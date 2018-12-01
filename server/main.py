import argparse
from collections import namedtuple
from os import environ, path
import json

from flask import Flask, render_template, make_response, redirect, session
from google.auth.transport import requests
from google.oauth2 import id_token

from core import *
from core import authentication, concurrency, event_analysis, event_storage, log, ping, quota, unproductive, tasks
from core.log import *
from core.util import *

from time import sleep # for testing only

OAUTH_URL = '385569473349-1192ich7o73apbpmu48c4lc32soqgqjk.apps.googleusercontent.com'

DATABASE_PATH = None

MEW_PATH = environ.get('MEW_PATH')
if not MEW_PATH:
    print 'You need to set $MEW_PATH.'
    exit(1)

WebEvent = namedtuple("WebEvent", "token hostname time")

app = Flask(__name__, root_path=path.join(MEW_PATH, 'server/'), static_url_path="/static")

init_loggers(MEW_PATH)

with open(path.join(MEW_PATH, "server/secret_key"), 'r') as secret_key_file:
    app.secret_key = secret_key_file.readline()


#########################################
# ENDPOINTS
#########################################
@app.route('/')
def get_landing_page():
    ignore_token = request.args.get('ignore_token')
    if 'uid' in session and not ignore_token:
        return make_response(redirect('/graph'))
    else:
        return render_template('login.html')


@app.route('/guest/<token>')
def redirect_guest(token):
    uid = authentication.token_to_uid(get_db(DATABASE_PATH), token)

    if uid is None:
        warn("No UID for token %s" % (token,))
        if 'uid' in session:
            session.pop('uid', None)
        return make_response(redirect('/'))

    if 'uid' in session:
        # they're already signed in
        guest_uid = uid
        acc_uid = session['uid']
        if acc_uid != guest_uid:
            # they're signed in as someone else
            if event_analysis.has_events(get_db(DATABASE_PATH), acc_uid):
                info("Prompting for merge of signed-in uid %d with guest uid %d" % (acc_uid, guest_uid))
                # TODO: prompt the user if they would like to merge accounts
            else:
                # the signed in account doesnt have any events
                # auto merge
                info("Auto-merging signed-in uid %d with guest uid %d" % (acc_uid, guest_uid))
                authentication.replace_uid(get_db(DATABASE_PATH), guest_uid, acc_uid)
                event_storage.replace_events_with_uid(get_db(DATABASE_PATH), guest_uid, acc_uid)
    else:
        info("Redirecting (and setting uid cookie for token %s to %d)" % (token, uid))
        session['uid'] = uid

    return make_response(redirect('/graph'))


@app.route('/graph/')
def graph():
    if 'uid' in session:
        uid = session['uid']
        try:
            user_email = authentication.get_user_email(get_db(DATABASE_PATH), uid)
        except:
            # the user somehow got deleted from the db
            session.pop('uid')
            return make_response(redirect('/'))

        _, quota_type, _ = quota.get_quota(get_db(DATABASE_PATH), uid)
        if quota_type == 'none':
            quota_streak_section = 'hidden'
            today_section_class = 'today-no-quota'
        else:
            quota_streak_section = ''
            today_section_class = 'today-w-quota'

        if is_mobile():
            template = 'm_graph.html'
        else:
            template = 'graph.html'

        return render_template(
            template,
            email=user_email,
            today_section_class=today_section_class,
            quota_streak_section=quota_streak_section)
    else:
        warn("uid cookie is None when requesting graph page...")
        return make_response(redirect('/'))


# ~~~~~ TASKS ~~~~~
@app.route('/tasks/')
def tasks_page():
    if 'uid' in session:
        uid = session['uid']
        try:
            user_email = authentication.get_user_email(get_db(DATABASE_PATH), uid)
        except:
            # the user somehow got deleted from the db
            session.pop('uid')
            return make_response(redirect('/'))

        if is_mobile():
            template = 'm_tasks.html'
        else:
            template = 'tasks.html'

        return render_template(
            template,
            email=user_email)
    else:
        warn("uid cookie is None when requesting graph page...")
        return make_response(redirect('/'))


@app.route('/api/tasks/get', methods=['POST'])
def get_tasks_by_week():
    if 'uid' in session:
        uid = session['uid']
    else:
        return gen_fail('not authenticated')

    req = request.get_json()
    timezone = req['timezone']

    week_tasks, cur_dow = tasks.get_tasks_by_week(get_db(DATABASE_PATH), uid, timezone) # current week
    categories = tasks.get_task_categories(get_db(DATABASE_PATH), uid, req['timezone'])
    return gen_resp(True, {'week_tasks': week_tasks, 'cur_dow': cur_dow, 'categories': categories})


@app.route('/api/tasks/add', methods=['POST'])
def add_task():
    if 'uid' in session:
        uid = session['uid']
    else:
        return gen_fail('not authenticated')

    req = request.get_json()
    if 'dow' in req:
        task_id = tasks.add_task_by_dow(get_db(DATABASE_PATH), uid, req['timezone'], req['task'], req['dow'])
    else: # 'category' in req
        task_id = tasks.add_task_by_category(get_db(DATABASE_PATH), uid, req['task'], req['category'])

    return gen_resp(True, {
        'task': req['task'],
        'task_id': task_id
    })


@app.route('/api/tasks/remove', methods=['POST'])
def remove_task():
    if 'uid' in session:
        uid = session['uid']
    else:
        return gen_fail('not authenticated')

    req = request.get_json()
    tasks.remove_task(get_db(DATABASE_PATH), uid, req['task_id'])
    return gen_resp(True, {})


@app.route('/api/tasks/finish', methods=['POST'])
def finish_task():
    if 'uid' in session:
        uid = session['uid']
    else:
        return gen_fail('not authenticated')

    req = request.get_json()
    tasks.finish_task(get_db(DATABASE_PATH), uid, req['timezone'], req['task_id'])
    return gen_resp(True, {})


@app.route('/api/tasks/unfinish', methods=['POST'])
def unfinish_task():
    if 'uid' in session:
        uid = session['uid']
    else:
        return gen_fail('not authenticated')

    req = request.get_json()
    tasks.unfinish_task(get_db(DATABASE_PATH), uid, req['task_id'])
    return gen_resp(True, {})


@app.route('/api/tasks/assign', methods=['POST'])
def assign_task_to_day():
    if 'uid' in session:
        uid = session['uid']
    else:
        return gen_fail('not authenticated')

    req = request.get_json()
    tasks.assign_task_to_day(get_db(DATABASE_PATH), uid, req['task_id'], req['timezone'], req['dow'])
    return gen_resp(True, {})


@app.route('/api/tasks/clear-finished', methods=['POST'])
def clear_finished():
    if 'uid' in session:
        uid = session['uid']
    else:
        return gen_fail('not authenticated')

    tasks.clear_finished(get_db(DATABASE_PATH), uid)
    return gen_resp(True, {})


@app.route('/api/tasks/add-category', methods=['POST'])
def add_task_category():
    if 'uid' in session:
        uid = session['uid']
    else:
        return gen_fail('not authenticated')

    req = request.get_json()
    resp = tasks.add_category(get_db(DATABASE_PATH), uid, req['name'])
    return gen_resp(True, resp)


@app.route('/api/tasks/rename-category', methods=['POST'])
def rename_task_category():
    if 'uid' in session:
        uid = session['uid']
    else:
        return gen_fail('not authenticated')

    req = request.get_json()
    resp = tasks.rename_category(get_db(DATABASE_PATH), uid, req['cid'], req['new_name'])
    return gen_resp(True, resp)


@app.route('/api/tasks/set-cat-color', methods=['POST'])
def set_category_color():
    if 'uid' in session:
        uid = session['uid']
    else:
        return gen_fail('not authenticated')

    req = request.get_json()
    resp = tasks.set_cat_color(get_db(DATABASE_PATH), uid, req['cid'], req['color'])
    return gen_resp(True, resp)


@app.route('/api/tasks/delete-category', methods=['POST'])
def delete_category():
    if 'uid' in session:
        uid = session['uid']
    else:
        return gen_fail('not authenticated')

    req = request.get_json()
    tasks.delete_category(get_db(DATABASE_PATH), uid, req['cid'])
    return gen_resp(True, {})
# ~~~~~~~~~~~~~~~~


@app.route('/api/login', methods=['POST'])
def login():
    req_data = request.get_json()
    email = req_data['email']

    prev_uid = None
    if 'uid' in session:
        # The user is attaching an account
        prev_uid = session['uid']

    if 'google_token' in req_data:
        token = req_data['google_token']
        try:
            idinfo = id_token.verify_oauth2_token(token, requests.Request(), OAUTH_URL)
            if idinfo['iss'] not in ['accounts.google.com', 'https://accounts.google.com']:
                # someone is trying to fuck with us
                warn('Invalid value for idinfo[\'iss\']: %s' % str(idinfo['iss']))
                return gen_resp(False)
            google_uid = idinfo['sub']
        except ValueError:
            # invalid google token
            warn('Invalid google token for email "%s": %s' % (email, token))
            return gen_resp(False)
        uid = authentication.google_auth(get_db(DATABASE_PATH), email, google_uid)
    else:
        password = req_data['password']
        uid = authentication.authenticate(get_db(DATABASE_PATH), email, password)

    if uid is None:
        return gen_resp(False)
    else:
        session['uid'] = uid

        if prev_uid:
            info("User with uid %d is attaching an account with email %s and uid %s" % (prev_uid, email, uid))
            authentication.replace_uid(get_db(DATABASE_PATH), prev_uid, uid)
            event_storage.replace_events_with_uid(get_db(DATABASE_PATH), prev_uid, uid)

        return gen_resp(True)


@app.route('/api/logout', methods=['GET', 'POST'])
def logout():
    session.pop('uid', None)
    return redirect('/')


@app.route('/api/signup', methods=['POST'])
def signup():
    email = request.form['email']
    password = request.form['password']

    prev_uid = None
    if 'uid' in session:
        # The user is attaching an account
        prev_uid = session['uid']

    uid = authentication.add_user(get_db(DATABASE_PATH), email, password, prev_uid)

    if uid is None:
        # TODO: unique response for each error
        error("UID is none after calling add_user.")
        pass
    else:
        session['uid'] = uid
        return make_response(redirect('/graph'))


@app.route('/api/ping', methods=['POST'])
def rec_ping():
    req = request.get_json()
    try:
        token = req['token']
        ts = req['time']
    except:
        warn('Possible attack from ip: %s', request.environ['REMOTE_ADDR'])
        return gen_resp(False, {})

    ping.rec(token, ts)
    return gen_resp(True, {})


@app.route('/api/gentoken', methods=['POST'])
def gen_token():
    token = authentication.gen_token()
    response = {
        'success': True,
        'token': token
    }
    return jsonify(response)


@app.route('/api/addevent', methods=['POST'])
def add_event():
    req_data = request.get_json()

    # TODO:
    #   log failures
    #   return an actual response, not strings
    try:
        event = WebEvent(**req_data)
        event_storage.insert(get_db(DATABASE_PATH), event)
        ping.rec(event.token, event.time)  # in case they send an event then close chrome before a ping is sent
        return 'Successfully added an event.', 200
    except Exception as ex:
        error("Failed to add an event '%s': %s", str(req_data), ex.message)
        return "Failed to add an event", 400


@app.route('/api/bargraph', methods=['POST'])
def get_bar_graph_data():
    req_data = request.get_json()
    max_sites = req_data['max_sites']
    durations = req_data['durations']

    if 'uid' in session:
        uid = session['uid']
    else:
        # not logged in
        return gen_resp(False, {"reason": "No uid found."})

    res = {}
    for name, num_minutes in durations.items():
        res[name] = event_analysis.get_last_x_min_summary(get_db(DATABASE_PATH), uid, num_minutes, max_sites)
    debug(res)
    return gen_resp(True, res)


@app.route('/api/getmaindata', methods=['POST'])
def get_main_data():
    req_data = request.get_json()

    if not req_data:
        return gen_resp(False)

    timezone = req_data['timezone']
    max_sites = req_data.get('max_sites')  # 'get' so it returns None if not there

    include_linegraph_data = not req_data["ignore_linegraph_data"]

    if 'uid' in session:
        uid = session['uid']
    else:
        # not logged in
        return gen_resp(False, {"reason": "No uid found."})

    summary = event_analysis.get_daily_summary(get_db(DATABASE_PATH), uid, timezone, max_sites)
    if summary is None:
        return gen_resp(False, {'reason': 'no events'})

    streak, percent_usage_today = quota.get_streak(get_db(DATABASE_PATH), uid, summary['data'])

    resp_data = {
        'streak': streak,
        'quota-percent': percent_usage_today
    }

    if include_linegraph_data:
        resp_data['linegraph'] = summary

    return gen_resp(True, resp_data)


@app.route('/api/getstreak', methods=['POST'])
def get_streak():
    if 'uid' in session:
        uid = session['uid']
    else:
        return gen_resp(False, {'reason': 'No uid found.'})

    req_data = request.get_json()
    timezone = req_data['timezone']

    summary = event_analysis.get_daily_summary(get_db(DATABASE_PATH), uid, timezone)
    if summary is None:
        return gen_resp(False, {'reason': 'no events'})
    streak, _ = quota.get_streak(get_db(DATABASE_PATH), uid, summary['data'])
    # streak of -1 means there is no quota set
    return gen_resp(True, {'streak': streak})


"""
GET:
    params:
        none
    returns:
        'quota','quota_type','quota_unit',
        'unprod_sites'
POST:
    params:
        'quota','quota_type','quota_unit': (optional) new quota values
        'unprod_sites','timezone': (optional) new unprod sites
        'ret_linegraph': (bool) should return updated line graph data (max_sites is static at 20 for now)
        'ret_streak': (bool) should return updated streak/percent_usage_today
    returns:
        'linegraph': if ret_linegraph is true and settings have changed
        'streak': if ret_streak is true and settings have changed
        'percent_usage_today': if ret_streak is true and settings have changed
"""
@app.route('/api/settings', methods=['POST', 'GET'])
def set_get_settings():
    if 'uid' in session:
        uid = session['uid']
    else:
        return gen_fail('not authenticated')

    if request.method == 'POST':
        req = request.get_json()
        quota_changed = False
        unprod_changed = False

        tz = None

        if 'quota' in req:
            try:
                new_quota = int(req['quota'])
                quota_type = req['quota_type']
                quota_unit = req['quota_unit']
            except:
                return gen_fail('invalid or missing request data')
            result = quota.set_quota(get_db(DATABASE_PATH), uid, new_quota, quota_type, quota_unit)
            if result == -1:
                gen_fail('error when setting quota')
            elif result == 0:
                # no change in quota
                pass
            else:  # result == 1
                quota_changed = True

        if 'unprod_sites' in req:
            sites = req['unprod_sites']
            try:
                tz = req['timezone']
            except:
                return gen_fail('missing timezone')
            result = unproductive.set_unprod_sites(get_db(DATABASE_PATH), uid, sites, tz)
            if result == -1:
                gen_fail('error when setting unprod sites')
            elif result == 0:
                # no change in unprod sites
                pass
            else:  # result == 1
                unprod_changed = True

        ret_linegraph = 'ret_linegraph' in req and req['ret_linegraph'] and unprod_changed
        ret_streak = 'ret_streak' in req and req['ret_streak'] and (unprod_changed or quota_changed)
        ret = {}
        if ret_linegraph or ret_streak:
            summary = event_analysis.get_daily_summary(get_db(DATABASE_PATH), uid, tz, 20)
            if summary is None:
                return gen_fail('no events')
            if ret_linegraph:
                ret['linegraph'] = summary
            if ret_streak:
                streak, percent_usage_today = quota.get_streak(get_db(DATABASE_PATH), uid, summary['data'])
                ret['streak'] = streak
                ret['percent_usage_today'] = percent_usage_today
        return gen_resp(True, ret)

    else:  # get
        cur_quota, quota_type, quota_unit = quota.get_quota(get_db(DATABASE_PATH), uid)
        sites = unproductive.get_unprod_sites(get_db(DATABASE_PATH), uid)
        return gen_resp(True, {
            'quota': cur_quota,
            'quota_type': quota_type,
            'quota_unit': quota_unit,
            'unprod_sites': sites
        })


@app.route('/api/debug/data', methods=['GET'])
def get_user_website_data():
    mins_str = request.args.get('minutes')
    if mins_str:
        try:
            mins = float(mins_str)
        except:
            return gen_fail("Couldn't parse minutes parameter '%s'" % str(request.args.get('minutes')))
    else:
        return gen_fail("You need to provide the `minutes` parameter.")

    if 'uid' in session:
        uid = session['uid']
    else:
        # not logged in
        return gen_resp(False, {"reason": "No uid found."})

    db = get_db(DATABASE_PATH)
    events = event_analysis._get_last_x_min(db, uid, mins)

    result = []
    for e in events:
        result.append({
            'hostname': e[0],
            'time': e[1],
            'utc_str': timezones.get_utc_string(e[1] / 1000)
        })

    return gen_resp(True, {'data': result})


# Landing page for new installs of the chrome extension.
@app.route('/landing/<token>', methods=['GET'])
def extension_landing_page(token):
    # TODO: create a landing page.
    # For now, we're just uselessly redirecting to the login page
    uid = authentication.token_to_uid(get_db(DATABASE_PATH), token)
    session['uid'] = uid
    return redirect('/graph')


#########################################
# HELPER METHODS
#########################################

@app.teardown_appcontext
def close_connection(exception):
    db = getattr(g, '_database', None)
    if db is not None:
        db.close()


def setup():
    global DATABASE_PATH
    info("Running setup() before launching server.")

    DATABASE_PATH = environ.get('MEW_DB_PATH')
    if not DATABASE_PATH:
        print 'You need to set $MEW_DB_PATH.'
        exit(1)

    ping.init(DATABASE_PATH, WebEvent)

    concurrency.init()


#########################################
# MAIN ENTRY POINT OF FLASK APP
#########################################

if __name__ == "__main__":
    setup()
    app.run(host='127.0.0.1', debug=True)
