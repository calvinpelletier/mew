import os
import sqlite3
from collections import namedtuple
import event_storage

from flask import Flask, render_template, g, request, make_response, jsonify

import authentication

DATABASE = '/home/calvin/projects/mew/db/main.db'  # TODO: make this dynamic

WebEvent = namedtuple("WebEvent", "token hostname time")

app = Flask(__name__, static_url_path="/static")


#########################################
# ENDPOINTS
#########################################

@app.route('/')
def get_landing_page():
    return render_template('index.html')

@app.route('/gentoken')
def gen_token():
    token = authentication.gen_token()
    response = {
        'success': True,
        'token': token
    }
    return jsonify(response)

@app.route('/addevent', methods=['POST'])
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


#########################################
# HELPER METHODS
#########################################

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
    database_env_var = os.environ.get('MEW_DB_PATH')
    if not database_env_var:
        print "You need to set $MEW_DB_PATH!"
        exit(1)
    app.run(host='127.0.0.1', debug=True)
