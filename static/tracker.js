let map, ployline_raw, polyline_fit, path = [], masterPath = [];
let lastPosition = null;
let lastHeading = 0;
let pointCounter = 0;
const significantChangeThreshold = 0.00001; // Minimum distance (degrees) to consider significant


// Function to calculate if a significant change occurred
function hasSignificantChange(newPosition) {
    if (!lastPosition) return true;

    const latDiff = Math.abs(newPosition.lat - lastPosition.lat);
    const lonDiff = Math.abs(newPosition.lng - lastPosition.lng);

    return latDiff > significantChangeThreshold || lonDiff > significantChangeThreshold;
}

// Function to initialize the map
function initMap() {


    map = new google.maps.Map(document.getElementById("map"), {
        center: { lat: 0, lng: 0 },
        zoom: 18,
        tilt: 75,
        mapId: "46608cbf703b23fa"

    });

    startTracking();
}

// Function to start tracking location
function startTracking() {
    if (navigator.geolocation) {
        navigator.geolocation.watchPosition(
            (position) => {
                const latitude = position.coords.latitude;
                const longitude = position.coords.longitude;

                const currentLocation = { lat: latitude, lng: longitude };



                if (hasSignificantChange(currentLocation)) {
                    if (lastPosition) {
                        // // Calculate heading manually
                        // lastHeading = calculateHeading(lastPosition, currentLocation);
                    }

                    lastPosition = currentLocation; // Update last position
                    path.push(currentLocation);

                    // Center map on user
                    // map.setCenter(currentLocation);

                    // Add the current location to the polyline path
                    if (!ployline_raw) {
                        ployline_raw = new google.maps.Polyline({
                            map,
                            path,
                            strokeColor: "#FF0000",
                            strokeOpacity: 1.0,
                            strokeWeight: 3,
                        });
                    } else {
                        ployline_raw.setPath(path);
                    }

                    // Snap the route to roads/sidewalks
                    snapToRoads(path);
                    pointCounter++;
                    if (pointCounter > 10) {
                        path = [masterPath[masterPath.length - 1]]
                        pointCounter = 0
                    }


                    updateMapOrientation(position)


                }
            },
            (error) => console.log('Error getting location:', error),
            { enableHighAccuracy: true }
        );
    } else {
        console.log('Geolocation is not supported by this browser.');
    }
}

function snapToRoads(path) {
    if (path.length < 2) {
        console.log('Not enough locations to snap.');
        return;
    }

    // Convert path to an array of latitude and longitude strings
    const pathString = path.map(point => `${point.lat},${point.lng}`).join('|');

    // Make a request to the Roads API
    fetch(`https://roads.googleapis.com/v1/snapToRoads?path=${pathString}&interpolate=true&key=AIzaSyCZS2Wretv0mja0wkGSiPyCrx2-Q0rlKZU`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Roads API request failed with status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            if (data.snappedPoints) {
                // Extract snapped points and update the polyline
                const snappedPath = data.snappedPoints.map(point => ({
                    lat: point.location.latitude,
                    lng: point.location.longitude
                }));

                masterPath.push(snappedPath[snappedPath.length - 1])

                if (!polyline_fit) {
                    polyline_fit = new google.maps.Polyline({
                        map,
                        snappedPath,
                        strokeColor: "#0000FF",
                        strokeOpacity: 1.0,
                        strokeWeight: 3,
                    });
                } else {
                    polyline_fit.setPath(masterPath);
                }

                map.setCenter(snappedPath[snappedPath.length - 1]);

                lastHeading = calculateHeading(snappedPath[snappedPath.length - 2], snappedPath[snappedPath.length - 1])

            } else {
                console.log('No snapped points returned from Roads API.');
            }
        })
        .catch(error => {
            console.log('Error with Roads API:', error);
        });
}

function updateMapOrientation(position) {

    const tilt = 75;

    map.setOptions({
        heading: lastHeading,
        tilt: tilt,
    });


}

function calculateHeading(from, to) {
    const lat1 = from.lat * (Math.PI / 180);
    const lon1 = from.lng * (Math.PI / 180);
    const lat2 = to.lat * (Math.PI / 180);
    const lon2 = to.lng * (Math.PI / 180);

    const dLon = lon2 - lon1;

    const y = Math.sin(dLon) * Math.cos(lat2);
    const x =
        Math.cos(lat1) * Math.sin(lat2) -
        Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);

    let heading = Math.atan2(y, x) * (180 / Math.PI); // Convert to degrees
    heading = (heading + 360) % 360; // Normalize to 0-360 degrees

    return heading;
}

// Call this when the page loads
window.onload = initMap;