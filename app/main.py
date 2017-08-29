from flask import Flask, render_template
import sys

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

#########################################
# MAIN ENTRY POINT OF FLASK APP
#########################################

if __name__ == "__main__":
    app.run(host='127.0.0.1', debug=True)
