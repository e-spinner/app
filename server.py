from flask import Flask, render_template, request, jsonify, json, send_from_directory
import os
import socket

def get_local_ip():
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    s.connect(("8.8.8.8", 80))
    ip = s.getsockname()[0]
    s.close()
    return ip


app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/debug', methods=['POST'])
def debug():

    # Print data sent in POST request (JSON or form)
    debug_data = request.get_json() if request.is_json else request.form
    print("POST Debug Data:", debug_data)
    return jsonify({"message": "POST request received"})

@app.route('sound/<name>')
def fetch_sound(name):
    return send_from_directory('./static/assets', name)

if __name__ == '__main__':
    app.run(debug=True, host=get_local_ip() )
    
    