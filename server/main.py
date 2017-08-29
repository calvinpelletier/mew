import os
import sqlite3
from collections import namedtuple

from flask import Flask, render_template, g, request, make_response, jsonify, session

import event_storage
import event_analysis
import authentication

DATABASE = None

WebEvent = namedtuple("WebEvent", "token hostname time")

app = Flask(__name__, static_url_path="/static")


#########################################
# ENDPOINTS
#########################################

@app.route('/')
def get_landing_page():
    return render_template('index.html')


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
        event_storage.insert(get_db(), event)
        return 'Successfully added an event.', 200
    except:
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
        gen_resp(False)

    summary = event_analysis.get_last_x_min_summary(get_db(), uid, num_minutes)
    data = {'labels': summary.keys(), 'values': summary.values()}

    return gen_resp(True, data)


#########################################
# HELPER METHODS
#########################################

def gen_resp(success, data=None):
    resp = {'success': success}
    if data is not None:
        for key, value in data.iteritems():
            if key == 'success':
                raise Exception('redundant success in resp')
            resp[key] = value
    return jsonify(resp)

def get_db():
    db = getattr(g, '_database', None)
    if db is None:
        db = g._database = sqlite3.connect(DATABASE)
    return db


@app.teardown_appcontext
def close_connection(exception):
    db = getattr(g, '_database', None)
    if db is not None:
        db.close()

#########################################
# MAIN ENTRY POINT OF FLASK APP
#########################################

if __name__ == "__main__":
    DATABASE = os.environ.get('MEW_DB_PATH')
    if not DATABASE:
        print "You need to set $MEW_DB_PATH!"
        exit(1)
    app.run(host='127.0.0.1', debug=True)
