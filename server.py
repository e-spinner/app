from flask import Flask, render_template, request, jsonify, json, send_from_directory
import os

import socket
from pymongo import MongoClient
from datetime import datetime

def get_local_ip():
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    s.connect(("8.8.8.8", 80))
    ip = s.getsockname()[0]
    s.close()
    return ip


app = Flask(__name__)

uri = "mongodb+srv://es:ybiXW78TszAKGYx2@rundata.zr3cj.mongodb.net/?retryWrites=true&w=majority&appName=rundata"
client = MongoClient(uri)
database = client.get_database("rundata")
paths = database.get_collection("paths")


@app.route('/')
def index():
    return render_template('index.html')

@app.route('/debug', methods=['POST'])
def debug():

    # Print data sent in POST request (JSON or form)
    debug_data = request.get_json() if request.is_json else request.form
    print("POST Debug Data:", debug_data)
    return jsonify({"message": "POST request received"})


@app.route('/sound/<name>')
def fetch_sound(name):
    return send_from_directory('./assets', name)

@app.route('/save_path_data', methods=['POST'])
def save_path_data():
    data = request.get_json()
    
    path = data.get('path')
    usr = data.get('username')  
    duration = data.get('duration')
    distance = data.get('distance')
    timestamp = datetime.now()
    
    record = {
        "username": usr,
        "timestamp": timestamp,
        "duration": duration,
        "distance": distance,
        "path": path
    }
    
    paths.insert_one(record)
    return jsonify({"message": "POST request received"})

@app.route('/leaderboard')
def leaderboard():
    try:
        # Fetch all runs from the database and sort them by distance
        runs = list(paths.find().sort("distance", -1))
        
        # response data
        leaderboard_data = [
            {
                "username": run["username"],
                "timestamp": run["timestamp"].strftime("%Y-%m-%d %H:%M:%S"),
                "duration": run["duration"],
                "distance": run["distance"],
                "path": run["path"]
            }
            for run in runs
        ]
        
        return jsonify(leaderboard_data)
    except Exception as e:
        print(e)
        return jsonify({"error": str(e)}), 500


if __name__ == '__main__':
 
    app.run(debug=True, host=get_local_ip())

