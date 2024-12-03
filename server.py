from flask import Flask, render_template, request, jsonify, json
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

CURRENT_ROUTE = 'data/current_route.json'

# Initialize the file if it doesn't exist
if not os.path.exists(CURRENT_ROUTE):
    with open(CURRENT_ROUTE, 'w') as f:
        json.dump([], f)

@app.route('/track', methods=['POST'])
def track():
    data = request.json
    latitude = data.get('latitude')
    longitude = data.get('longitude')

    # Append the new location to the file
    with open(CURRENT_ROUTE, 'r+') as f:
        locations = json.load(f)
        locations.append({'latitude': latitude, 'longitude': longitude})
        f.seek(0)
        json.dump(locations, f, indent=4)
    
    
    return jsonify({'status': 'success', 'latitude': latitude, 'longitude': longitude})

@app.route('/current_route', methods=['GET'])
def current_route():
    try:
        # Read location data from the file
        with open(CURRENT_ROUTE, 'r') as f:
            locations = json.load(f)
        return jsonify(locations)  # Return the data as JSON
    except Exception as e:
        # Handle potential errors 
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    
    app.run(debug=True, host=get_local_ip())
    
    
