import sqlite3
from collections import namedtuple
import event_storage

from flask import Flask, render_template, g, request

DATABASE = '/home/calvin/projects/mew/db/main.db'  # TODO: make this dynamic

WebEvent = namedtuple("WebEvent", "token hostname time")

app = Flask(__name__, static_url_path="/static")


#########################################
# ENDPOINTS
#########################################

@app.route('/')
def get_landing_page():
    return render_template('index.html')


@app.route('/addevent', methods=['POST'])
def add_event():
    req_data = request.get_json()

    # TODO:
    #   log failures
    #   return an actual response, not strings
    try:
        event = WebEvent(**req_data)
        event_storage.insert(get_db(), event)
        return "success"
    except:
        return "fail"


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
    app.run(host='127.0.0.1', debug=True)
