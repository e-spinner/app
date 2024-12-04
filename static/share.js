
let shareMap


function openShareModal() {
    shareModal.classList.remove('hidden')

    shareMap = new google.maps.Map(document.getElementById("map"), {
        center: { lat: 0, lng: 0 },
        zoom: 15,
    });

    const bounds = new google.maps.LatLngBounds();
    masterPath.forEach(point => bounds.extend(new google.maps.LatLng(point.lat, point.lng)));
    shareMap.fitBounds(bounds);

    const distance = calculateDistance(masterPath);
    const duration = ((totalTime - totalTimeLeft)) / 60000

    document.getElementById('distance').textContent = `Distance: ${distance.toFixed(2)} mi`;
    document.getElementById('duration').textContent = `Duration: ${duration.toFixed(1)} min`;

}

function getDistanceFromLatLonInMi(lat1, lon1, lat2, lon2) {
    const R = 3963; // Radius of the Earth in mi
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in km
}

function calculateDistance(path) {
    let totalDistance = 0;
    for (let i = 0; i < path.length - 1; i++) {
        const p1 = path[i];
        const p2 = path[i + 1];
        totalDistance += getDistanceFromLatLonInMi(p1.lat, p1.lng, p2.lat, p2.lng);
    }
    return totalDistance;
}

function deg2rad(deg) {
    return deg * (Math.PI / 180);
}