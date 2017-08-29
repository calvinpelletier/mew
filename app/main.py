from flask import Flask, render_template, g
import sqlite3
import sys

DATABASE = '/home/calvin/projects/mew/db/main.db' # TODO: make this dynamic

app = Flask(__name__, static_url_path="/static")

#########################################
# ENDPOINTS
#########################################

@app.route('/')
def get_landing_page():
    return render_template('index.html')

#########################################
# HANDLERS FOR SOCKET MESSAGES FROM CLIENTS
#########################################

#########################################
# METHODS FOR EMITTING MESSAGES TO CLIENTS
#########################################

#########################################
# HELPER METHODS
#########################################

def get_db():
    db = getattr(g, '_database', None)
    if db is None:
        db = g._database = sqlite3.connect(DATABASE)
        db =
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
