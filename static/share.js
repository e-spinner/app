
let shareMap


function openShareModal() {
    shareModal.classList.remove('hidden')

    // shareMap
    const cartesianPath = drawRunPath(masterPath)

    const distance = calculateDistance(masterPath);
    const duration = ((totalTime - totalTimeLeft)) / 60000

    document.getElementById('distance').textContent = `Distance: ${distance.toFixed(2)} mi`;
    document.getElementById('duration').textContent = `Duration: ${duration.toFixed(1)} min`;

    const exit = document.getElementById('endShareButton')
    exit.addEventListener('click', () => {
        shareModal.classList.add('hidden')
        masterPath = []
    })

    const nameModal = document.getElementById('nameRun')
    const shareButton = document.getElementById('shareButton')
    shareButton.addEventListener('click', () => {
        nameModal.classList.remove('hidden')

        document.getElementById('nameForm').addEventListener("submit", (event) => {
            // Prevent the default form submission behavior
            event.preventDefault();

            const usrName = document.getElementById("nameInput").value

            // Send data via fetch
            fetch('/save_path_data', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    username: usrName,
                    duration: duration,
                    distance: distance,
                    path: cartesianPath
                }),
            })
                .then((response) => response.json())
                .then((data) => {
                    console.log('Data shared successfully:', data);
                })
                .catch((error) => {
                    console.error('Error sharing data:', error);
                });

            nameModal.classList.add('hidden')
            shareModal.classList.add('hidden')
            masterPath = []

        })


    })

}



function drawRunPath(path) {
    origin = path[0]

    const cartesianPath = path.map(point => ({
        x: (point.lat - origin.lat) * 100000,
        y: (point.lng - origin.lng) * 100000
    }));


    const canvas = document.getElementById('shareMap');
    const context = canvas.getContext('2d');

    // Set canvas size
    const width = canvas.parentElement.clientWidth;
    const height = canvas.parentElement.clientHeight;
    canvas.width = width;
    canvas.height = height;

    // Find bounds of the points
    const minX = Math.min(...cartesianPath.map(p => p.x));
    const maxX = Math.max(...cartesianPath.map(p => p.x));
    const minY = Math.min(...cartesianPath.map(p => p.y));
    const maxY = Math.max(...cartesianPath.map(p => p.y));

    const rangeX = maxX - minX;
    const rangeY = maxY - minY;

    // Normalize and scale points to fit canvas
    const normalizedPoints = cartesianPath.map(point => ({
        x: ((point.x - minX) / rangeX) * (width * 0.9) + (width * 0.05),
        y: height - (((point.y - minY) / rangeY) * (height * 0.9) + (height * 0.05))
    }));

    // Draw the line
    context.clearRect(0, 0, width, height);
    context.beginPath();
    normalizedPoints.forEach((point, index) => {
        if (index === 0) {
            context.moveTo(point.x, point.y);
        } else {
            context.lineTo(point.x, point.y);
        }
    });
    context.strokeStyle = 'blue';
    context.lineWidth = 2;
    context.stroke();

    return cartesianPath;
}


function getDistanceFromLatLngInMi(lat1, lng1, lat2, lng2) {
    const R = 3963; // Radius of the Earth in mi
    const dLat = deg2rad(lat2 - lat1);
    const dLng = deg2rad(lng2 - lng1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in km
}

function calculateDistance(path) {
    let totalDistance = 0;
    for (let i = 0; i < path.length - 1; i++) {
        const p1 = path[i];
        const p2 = path[i + 1];
        totalDistance += getDistanceFromLatLngInMi(p1.lat, p1.lng, p2.lat, p2.lng);
    }
    return totalDistance;
}

function deg2rad(deg) {
    return deg * (Math.PI / 180);
}


document.addEventListener('DOMContentLoaded', () => {

    const leaderModal = document.getElementById('leaderboardModal')
    const leaderButton = document.getElementById('leaderBoardButton')


    leaderButton.addEventListener('click', async () => {
        leaderModal.classList.remove('hidden')

        const leaderDisplay = document.getElementById('leaderDisplay')

        try {
            const response = await fetch('/leaderboard');
            if (!response.ok) {
                throw new Error("Failed to fetch leaderboard data");
            }

            const leaderboard = await response.json();
            console.log("Leaderboard Data:", leaderboard);

            leaderboard.forEach((entry, index) => {
                const item = document.createElement("div");
                item.classList.add('leader')

                const canvasId = `path_${index}`;

                item.innerHTML = `
                <p>#${index + 1}: ${entry.username}</p>
                <p>Distance: ${entry.distance.toFixed(2)} mi</p>
                <p>Duration: ${entry.duration.toFixed(1)} mins</p>
                <p>Date: ${entry.timestamp}</p>
                <canvas id="${canvasId}"></canvas>
                `;

                leaderDisplay.appendChild(item);

                const canvas = document.getElementById(canvasId);
                if (canvas && entry.path && entry.path.length > 1) {
                    const ctx = canvas.getContext('2d');

                    const path = entry.path;
                    // console.log(path)

                    const width = canvas.parentElement.clientWidth;
                    const height = canvas.parentElement.clientHeight;
                    canvas.width = width;
                    canvas.height = height;

                    const bounds = {
                        minX: Math.min(...path.map(point => point.x)),
                        maxX: Math.max(...path.map(point => point.x)),
                        minY: Math.min(...path.map(point => point.y)),
                        maxY: Math.max(...path.map(point => point.y)),
                    };

                    const rangeX = bounds.maxX - bounds.minX;
                    const rangeY = bounds.maxY - bounds.minY;


                    // console.log(canvas.width, canvas.height)

                    // Normalize and scale points
                    const scaledPath = path.map(point => ({
                        x: ((point.x - bounds.minX) / rangeX) * (width * 0.9) + (width * 0.05),
                        y: height - (((point.y - bounds.minY) / rangeY) * (height * 0.9) + (height * 0.05))
                    }));

                    console.log(scaledPath)
                    // Draw the path
                    ctx.beginPath();
                    ctx.moveTo(scaledPath[0].x, scaledPath[0].y);
                    scaledPath.slice(1).forEach(point => {
                        ctx.lineTo(point.x, point.y)
                    });
                    ctx.strokeStyle = '#007BFF';
                    ctx.lineWidth = 2;
                    ctx.stroke();

                } else {
                    console.warn(`No path data available for ${entry.username}`);
                }
            });
        } catch (error) {
            console.error("Error loading leaderboard:", error);
        }


        const closeLeader = document.getElementById('closeLeaderboard')

        closeLeader.addEventListener('click', () => {
            leaderModal.classList.add('hidden')
        })
    })

});