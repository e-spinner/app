let intervalSchedule = [];
let currentIntervalIndex = 0;
let timer;
let timeLeft; // Time remaining in the current action
let isPaused = false;

document.addEventListener("DOMContentLoaded", () => {
    const startRunButton = document.getElementById("startRunButton");
    const timerModal = document.getElementById("timerModal");
    const startSessionButton = document.getElementById("startSession");
    const cancelSessionButton = document.getElementById("cancelSession");
    const pauseButton = document.getElementById("pauseButton");
    const resumeButton = document.getElementById("resumeButton");
    const stopButton = document.getElementById("stopButton");
    const timerDisplay = document.getElementById("timerDisplay");
    const runIcon = document.getElementById("runIcon");
    const walkIcon = document.getElementById("walkIcon");

    startRunButton.addEventListener("click", () => {
        timerModal.classList.remove('hidden')
        startRunButton.classList.add('hidden');
    });

    cancelSessionButton.addEventListener("click", () => {
        timerModal.classList.add('hidden');
        startRunButton.classList.remove('hidden');
    });

    startSessionButton.addEventListener("click", () => {
        const exerciseDuration = parseInt(document.getElementById("exerciseDuration").value) * 60 * 1000;
        const cycles = parseInt(document.getElementById("cycles").value);

        if (!exerciseDuration || !cycles) {
            alert("Please fill in both fields.");
            return;
        }

        const runTime = exerciseDuration / (2 * cycles); // Split duration equally
        const walkTime = runTime;

        intervalSchedule = [];
        for (let i = 0; i < cycles; i++) {
            intervalSchedule.push({ action: "Run", duration: runTime });
            intervalSchedule.push({ action: "Walk", duration: walkTime });
        }

        timerModal.classList.add('hidden')
        currentIntervalIndex = 0;
        startInterval();

        pauseButton.classList.remove('hidden');
    });

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
            startInterval(); // Restart with remaining time
        }
    });

    stopButton.addEventListener("click", () => {
        clearTimeout(timer);
        resetTimer();
    });

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

        walkIcon.classList.add('hidden')
        runIcon.classList.add('hidden')
    }

    function startInterval() {
        const feedbackArea = document.getElementById("display");
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
        navigator.vibrate([500]);
    }

});

