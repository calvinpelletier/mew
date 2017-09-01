import os
from collections import namedtuple
from datetime import datetime

from flask import Flask, render_template, request, make_response, redirect, session

import authentication
import event_analysis
import event_storage
from util import *

DATABASE_PATH = None

WebEvent = namedtuple("WebEvent", "token hostname time")

app = Flask(__name__, static_url_path="/static")


#########################################
# ENDPOINTS
#########################################

@app.route('/')
def get_landing_page():
    return render_template('index.html')


@app.route('/guest/<token>')
def redirect_guest(token):
    redirect_to_index = redirect('/graph')
    response = make_response(redirect_to_index)
    uid = authentication.token_to_uid(get_db(DATABASE_PATH), token)
    print "Redirecting (and setting uid cookie for token %s to %d)" % (token, uid)
    if uid:
        session['uid'] = uid
    else:
        print "Error: couldn't find uid for token %s" % token
        # return error?
    return response


@app.route('/graph/')
def graph():
    fake_labels = ['reddit.com', 'facebook.com', 'youtube.com', 'OTHER']
    fake_values = [45, 28, 27, 36]
    return render_template('graph.html', labels=fake_labels, values=fake_values)


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
        print "Failed to add an event: %s" % str(req_data)
        return "Failed to add an event", 400


@app.route('/api/graph', methods=['POST'])
def get_graph_data():
    req_data = request.get_json()
    num_minutes = req_data['minutes']

    if 'uid' in session:
        uid = session['uid']
    else:
        # not logged in
        return gen_resp(False)

    summary = event_analysis.get_last_x_min_summary(get_db(DATABASE_PATH), uid, num_minutes)
    data = {'labels': summary.keys(), 'values': summary.values()}

    return gen_resp(True, data)


@app.route('/api/debug/data')
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

if __name__ == "__main__":
    DATABASE_PATH = os.environ.get('MEW_DB_PATH')
    if not DATABASE_PATH:
        print "You need to set $MEW_DB_PATH!"
        exit(1)
    # Read secret key
    with open("secret_key") as secret_key_file:
        app.secret_key = secret_key_file.readline()
    app.run(host='127.0.0.1', debug=True)
