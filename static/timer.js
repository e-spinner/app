let intervalSchedule = [];
let currentIntervalIndex = 0;
let timer;
let timeLeft; // Time remaining in the current action
let isPaused = false;

document.addEventListener("DOMContentLoaded", () => {

    // ******** //
    // Timer UI //
    // ******** //

    const startRunButton = document.getElementById("startRunButton");
    const timerModal = document.getElementById("timerModal");
    const startSessionButton = document.getElementById("startSession");
    const cancelSessionButton = document.getElementById("cancelSession");

    const time = document.getElementById("time");
    const cycles = document.getElementById("cycles");
    const weight = document.getElementById("weight");

    const timeVal = document.getElementById("timeVal");

    startRunButton.addEventListener("click", () => {
        timerModal.classList.remove('hidden')
        startRunButton.classList.add('hidden');
        updateVisualization();
    });

    cancelSessionButton.addEventListener("click", () => {
        timerModal.classList.add('hidden');
        startRunButton.classList.remove('hidden');
    });

    time.addEventListener("input", () => {
        updateVisualization();
    });

    cycles.addEventListener("input", () => {
        updateVisualization();
    });

    weight.addEventListener("input", () => {
        updateVisualization();
    });


    startSessionButton.addEventListener("click", () => {
        const t = parseInt(time.value) * 60 * 1000; // change to milliseconds
        const c = parseInt(cycles.value);
        const w = parseInt(weight.value);

        const rFraction = w / 10;
        const wFraction = 1 - rFraction;


        const rTime = Math.ceil(((t * rFraction) / c) / 1000) * 1000;
        const wTime = Math.ceil(((t * wFraction) / c) / 1000) * 1000;


        intervalSchedule = [];
        for (let i = 0; i < c; i++) {
            intervalSchedule.push({ action: "Run", duration: rTime });
            intervalSchedule.push({ action: "Walk", duration: wTime });
        }


        console.log("Plan:", intervalSchedule);
        timerModal.classList.add('hidden')
        currentIntervalIndex = 0;
        startInterval();

        pauseButton.classList.remove('hidden');
    });


    // ************** //
    // Timer Controls //
    // ************** //

    const pauseButton = document.getElementById("pauseButton");
    const resumeButton = document.getElementById("resumeButton");
    const stopButton = document.getElementById("stopButton");

    pauseButton.addEventListener("click", () => {
        if (timer) {
            clearTimeout(timer);
            isPaused = true;
            pauseButton.classList.add('hidden');
            resumeButton.classList.remove('hidden');
            stopButton.classList.remove('hidden');
        }
    });

    resumeButton.addEventListener("click", () => {
        if (isPaused) {
            isPaused = false;
            pauseButton.classList.remove('hidden');
            resumeButton.classList.add('hidden');
            stopButton.classList.add('hidden');
            
            //stuff I need to make work
            var runSound = new Audio('{{ url_for("static", filename="assets/Walking.mp3") }}');
            //var runCompleted = new Audio('path_to_your_audio_file.mp3');
            //var walkSound = new Audio('path_to_your_audio_file.mp3');
            // const audio = new Audio('{{ url_for("static", filename="beep.mp3") }}');
            runSound.play();

            startInterval(); // Restart with remaining time
        }
    });

    stopButton.addEventListener("click", () => {
        clearTimeout(timer);
        resetTimer();

        fetch('/debug', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(masterPath)
        })
            .then(response => response.json())
            .then(data => {
                console.log('Response from server:', data);
            })
            .catch(error => {
                console.error('Error sending request:', error);
            });
    });

    // ************* //
    // Timer Visuals //
    // ************* //

    const timerDisplay = document.getElementById("timerDisplay");
    const runIcon = document.getElementById("runIcon");
    const walkIcon = document.getElementById("walkIcon");
    const timeBar = document.getElementById("timeBar");

    function updateTimerDisplay() {
        const minutes = Math.floor(timeLeft / 60000);
        const seconds = Math.floor((timeLeft % 60000) / 1000);
        timerDisplay.textContent = `Time Left: ${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
    }

    function resetTimer() {
        timerDisplay.textContent = "Time Left: 00:00";
        currentIntervalIndex = 0;
        isPaused = false;
        intervalSchedule = [];
        pauseButton.classList.add('hidden');
        resumeButton.classList.add('hidden');
        stopButton.classList.add('hidden');
        startRunButton.classList.remove('hidden');

        walkIcon.classList.add('hidden');
        runIcon.classList.add('hidden');
    }

    function updateVisualization() {
        const t = parseInt(time.value) * 60 * 1000; // change to milliseconds
        const c = parseInt(cycles.value);
        const w = parseInt(weight.value);

        const rFraction = w / 10;
        const wFraction = 1 - rFraction;


        const rTime = (t * rFraction) / c;
        const wTime = (t * wFraction) / c;

        const totalIntervals = c * 2;
        const rWidth = (rFraction * 100) / c;
        const wWidth = (wFraction * 100) / c;


        timeVal.textContent = `${time.value} min, run ${Math.round(rTime / 60000)} min and walk ${Math.round(wTime / 60000)} min ${c} times `;

        // Clear the time bar
        timeBar.innerHTML = "";

        for (let i = 0; i < totalIntervals; i++) {
            const isRun = i % 2 === 0; // Alternate between run and walk
            const segment = document.createElement("div");
            segment.className = isRun ? "run" : "walk";
            segment.style.width = isRun ? `${rWidth}%` : `${wWidth}%`;
            segment.title = isRun
                ? `Run: ${Math.round(rTime / 1000)} seconds`
                : `Walk: ${Math.round(wTime / 1000)} seconds`;
            timeBar.appendChild(segment);
        }
    }

    // ****** //
    // Helper //
    // ****** //


    function startInterval() {
        const currentInterval = intervalSchedule[currentIntervalIndex];

        // Update SVG visibility
        if (currentInterval.action === "Run") {
            runIcon.classList.remove('hidden')
            walkIcon.classList.add('hidden')
        } else {
            runIcon.classList.add('hidden')
            walkIcon.classList.remove('hidden')
        }

        timeLeft = currentInterval.duration;

        timer = setInterval(() => {
            if (timeLeft <= 0) {
                clearInterval(timer);
                currentIntervalIndex++;
                beep();
                if (currentIntervalIndex < intervalSchedule.length) {
                    startInterval();
                } else {
                    alert("Session complete!");
                    resetTimer();
                }
            } else {
                timeLeft -= 1000;
                updateTimerDisplay();
            }
        }, 1000);
    }

    function beep() {
        // const audio = new Audio('{{ url_for("static", filename="beep.mp3") }}');
        // audio.play();
        try {
            navigator.vibrate([500]);
        } catch (error) {
            console.log('vibrate no worky')
        }
    }

});

