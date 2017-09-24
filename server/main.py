import argparse
import logging.config
from os import environ, getcwd
from collections import namedtuple
from datetime import datetime

from flask import Flask, render_template, request, make_response, redirect, session
from core.util import *

from google.oauth2 import id_token
from google.auth.transport import requests

from core import authentication
from core import event_storage
from core import event_analysis

WebEvent = namedtuple("WebEvent", "token hostname time")

app = Flask(__name__, root_path=getcwd(), static_url_path="/static")

logging.config.fileConfig("config/logging.conf")
lg = logging.getLogger("main")

DATABASE_PATH = None

#########################################
# ENDPOINTS
#########################################

@app.route('/')
def get_landing_page():
    if 'uid' in session:
        return make_response(redirect('/graph'))
    else:
        return render_template('login.html')


@app.route('/guest/<token>')
def redirect_guest(token):
    redirect_to_index = redirect('/graph')
    response = make_response(redirect_to_index)
    uid = authentication.token_to_uid(get_db(DATABASE_PATH), token)
    if uid:
        session['uid'] = uid
        lg.info("Redirecting (and setting uid cookie for token %s to %d)" % (token, uid))
    else:
        lg.error("Couldn't find uid for token %s" % token)
        # return error?
    return response


@app.route('/graph/')
def graph():
    fake_labels = ['reddit.com', 'facebook.com', 'youtube.com', 'OTHER']
    fake_values = [45, 28, 27, 36]
    return render_template('graph.html', labels=fake_labels, values=fake_values)


@app.route('/api/login', methods=['POST'])
def login():
    req_data = request.get_json()
    email = req_data['email']
    if 'google_token' in req_data:
        token = req_data['google_token']
        try:
            idinfo = id_token.verify_oauth2_token(token, requests.Request(), '385569473349-1192ich7o73apbpmu48c4lc32soqgqjk.apps.googleusercontent.com')
            if idinfo['iss'] not in ['accounts.google.com', 'https://accounts.google.com']:
                # someone is trying to fuck with us
                return gen_resp(False) # TODO: log
            google_uid = idinfo['sub']
        except ValueError:
            # invalid google token
            return gen_resp(False) # TODO: log
        uid = authentication.google_auth(get_db(DATABASE_PATH), email, google_uid)
    else:
        password = req_data['password']
        uid = authentication.authenticate(get_db(DATABASE_PATH), email, password)
    if uid is None:
        return gen_resp(False)
    else:
        session['uid'] = uid
        return gen_resp(True)


@app.route('/api/logout')
def logout():
    session.pop('uid', None)
    return redirect('/')


@app.route('/api/signup', methods=['POST'])
def signup():
    email = request.form['email']
    password = request.form['password']
    uid = authentication.add_user(get_db(DATABASE_PATH), email, password)
    if uid is None:
        # TODO: unique response for each error
        pass
    else:
        session['uid'] = uid
        return make_response(redirect('/graph'))


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
        return 'Successfully added an event.', 200
    except Exception as ex:
        lg.error("Failed to add an event '%s': %s", str(req_data), ex.message)
        return "Failed to add an event", 400


@app.route('/api/bargraph', methods=['POST'])
def get_bar_graph_data():
    req_data = request.get_json()
    num_minutes = req_data['minutes']
    max_sites = req_data['max_sites']

    if 'uid' in session:
        uid = session['uid']
    else:
        # not logged in
        return gen_resp(False)

    summary = event_analysis.get_last_x_min_summary(get_db(DATABASE_PATH), uid, num_minutes, max_sites)
    return gen_resp(True, summary)


@app.route('/api/stackedgraph', methods=['POST'])
def get_stacked_graph_data():
    req_data = request.get_json()

    if not req_data:
        return gen_resp("False")

    num_days = req_data['days']
    timezone = req_data['timezone']

    if 'uid' in session:
        uid = session['uid']
    else:
        # not logged in
        return gen_resp(False, {"reason": "No uid found."})

    summary = event_analysis.get_last_x_days_summary(get_db(DATABASE_PATH), uid, timezone, num_days)
    lg.debug(summary)
    return gen_resp(True, summary)


@app.route('/api/debug/data', methods=['POST'])
def get_user_website_data():
    db = get_db(DATABASE_PATH)
    uid = int(request.args.get('uid'))
    mins = float(request.args.get('minutes'))
    events = event_analysis.get_last_x_min(db, uid, mins)

    result = []
    for e in events:
        result.append({
            'hostname': e[0],
            'time': e[1],
            'utc_str': datetime.utcfromtimestamp(e[1] / 1000).strftime('%Y-%m-%dT%H:%M:%SZ')

        })

    return gen_resp(True, {'data': result})


#########################################
# HELPER METHODS
#########################################

@app.teardown_appcontext
def close_connection(exception):
    db = getattr(g, '_database', None)
    if db is not None:
        db.close()


#########################################
# MAIN ENTRY POINT OF FLASK APP
#########################################

def setup():
    global DATABASE_PATH
    DATABASE_PATH = environ.get('MEW_DB_PATH')
    if not DATABASE_PATH:
        lg.error("You need to set $MEW_DB_PATH!")
        exit(1)
    # Read secret key
    with open("secret_key") as secret_key_file:
        app.secret_key = secret_key_file.readline()


if __name__ == "__main__":
    # Set up CLI args
    parser = argparse.ArgumentParser(description='Mew Server')
    parser.add_argument('-v', '--verbose', action='store_true', help="Verbose logging")
    cli_args = parser.parse_args()

    if cli_args.verbose:
        lg.info("Using verbose logging.")
        lg.level = logging.DEBUG

    setup()
    app.run(host='127.0.0.1', debug=True)
