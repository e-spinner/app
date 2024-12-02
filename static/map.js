let map;
let routePath;

// Initialize the map
function initMap() {
    map = new google.maps.Map(document.getElementById('map'), {
        center: { lat: 0, lng: 0 },
        zoom: 13,
    });

    routePath = new google.maps.Polyline({
        path: [],
        geodesic: true,
        strokeColor: '#FF0000',
        strokeOpacity: 1.0,
        strokeWeight: 2,
    });

    routePath.setMap(map);

    fetchLocations();
}

// Fetch and plot locations from the server
function fetchLocations() {
    fetch('/current_route')
        .then((response) => response.json())
        .then((data) => {
            if (data.length > 0) {
                const path = data.map((loc) => {
                    return { lat: loc.latitude, lng: loc.longitude };
                });

                routePath.setPath(path);

                // Center map on the first point
                map.setCenter(path[0]);
            }
        })
        .catch((error) => alert('Error fetching locations:', error));
}

// Call this when the page loads
window.onload = initMap;