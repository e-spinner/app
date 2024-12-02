let lastPosition = null; // Store the last significant position
const significantChangeThreshold = 0.00001; // Minimum distance (degrees) to consider significant

// Function to calculate the distance between two coordinates (Haversine formula is more precise but heavier)
function hasSignificantChange(newPosition) {
    if (!lastPosition) return true;

    const latDiff = Math.abs(newPosition.latitude - lastPosition.latitude);
    const lonDiff = Math.abs(newPosition.longitude - lastPosition.longitude);
    console.log(latDiff, lonDiff, newPosition.latitude, newPosition.longitude)
    return latDiff > significantChangeThreshold || lonDiff > significantChangeThreshold;
}

// Function to start tracking
function startTracking() {
    if (navigator.geolocation) {
        navigator.geolocation.watchPosition(
            (position) => {
                const latitude = position.coords.latitude;
                const longitude = position.coords.longitude;

                if (hasSignificantChange({ latitude, longitude })) {
                    lastPosition = { latitude, longitude };

                    // Send data to the server
                    fetch('/track', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ latitude, longitude }),
                    })
                        .then((response) => response.json())
                        .then((data) => console.log('Location saved:', data))
                        .catch((error) => console.log('Error:', error));
                }
            },
            (error) => {
                console.log('Error getting location:', error);
            },
            { enableHighAccuracy: true }
        );
    } else {
        console.log('Geolocation is not supported by this browser.');
    }
}
