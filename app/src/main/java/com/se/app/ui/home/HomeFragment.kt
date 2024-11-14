package com.se.app.ui.home

import android.Manifest.permission.ACCESS_FINE_LOCATION
import android.Manifest.permission.BIND_INCALL_SERVICE
import android.annotation.SuppressLint
import android.os.Bundle
import android.os.Looper
import android.os.SystemClock
import android.util.Log
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Button
import android.widget.Chronometer
import android.widget.TextView
import androidx.fragment.app.Fragment
import androidx.lifecycle.ViewModelProvider
import com.google.android.gms.location.FusedLocationProviderClient
import com.google.android.gms.location.LocationCallback
import com.google.android.gms.location.LocationRequest
import com.google.android.gms.location.LocationResult
import com.google.android.gms.location.LocationServices
import com.se.app.R
import com.se.app.databinding.FragmentHomeBinding
import com.vmadalin.easypermissions.EasyPermissions
import com.vmadalin.easypermissions.annotations.AfterPermissionGranted


private const val REQUEST_CODE_FINE_LOCATION = 1

class HomeFragment : Fragment() {

    private var _binding: FragmentHomeBinding? = null

    private lateinit var fLocationPC: FusedLocationProviderClient
    private lateinit var cMeter: Chronometer

    private lateinit var loadButton: Button
    private lateinit var startButton: Button
    private lateinit var pauseButton: Button
    private lateinit var stopButton: Button

    private lateinit var distanceDisplay: TextView
    private lateinit var stateTV: TextView

    private lateinit var tracker: Tracker
    private lateinit var display: Display
    private lateinit var clock: Timer

    private lateinit var controller: Controller


    // This property is only valid between onCreateView and
    // onDestroyView.
    private val binding get() = _binding!!

    override fun onCreateView(inflater: LayoutInflater, container: ViewGroup?, savedInstanceState: Bundle?): View {
        val homeViewModel =
            ViewModelProvider(this)[HomeViewModel::class.java]

        _binding = FragmentHomeBinding.inflate(inflater, container, false)
        val root: View = binding.root


        stateTV = binding.moveState
        distanceDisplay = binding.distanceDisplay
        loadButton = binding.loadButton
        startButton = binding.playButton
        pauseButton = binding.pauseButton
        stopButton = binding.stopButton

        // Google Play Location Service
        fLocationPC = LocationServices.getFusedLocationProviderClient(requireActivity())
        setupLocationChangeListener()
        cMeter = binding.cMeter

        // initialize custom classes
        tracker = Tracker()
        clock = Timer(cMeter)
        display = Display(stateTV)
        controller = Controller(tracker, clock, display)

        loadButton.setOnClickListener { controller.load() }
        startButton.setOnClickListener { controller.play() }
        pauseButton.setOnClickListener { controller.pause() }
        stopButton.setOnClickListener { controller.stop() }

        return root
    }

    // ****************** //
    // Main State Machine //
    // ****************** //

    private class Controller( var tracker: Tracker, var timer: Timer, var display: Display) {
        var numCycles: Int = 0
        var runTime: Long = 0
        var walkTime: Long = 0
        // true = run, false = walk
        var action: Boolean = true
        var playing: Boolean = false

        init {
            Log.d("controller", "init")
            stop()

            timer.clock.setOnChronometerTickListener {
                val elapsedMillis = SystemClock.elapsedRealtime() - timer.clock.base

                // DO NOT set to >= breaks everything
                if (timer.baseTime + elapsedMillis > timer.baseTime) {
                    // Timer has ended, run next action'
                    timer.stop()

                    Log.d("Controller", "timer finished")

                    if (!action) {
                        Log.d("Controller", "decrementing cycles")
                        numCycles--
                    }

                    if (numCycles > 0) {
                        Log.d("Controller", "starting next action")
                        action = action.not()
                        playing = false

                        play()
                    }
                    else {
                        Log.d("Controller", "Run has Finished")
                    }
                }
            }
        }
        fun stop() {
            Log.d("controller", "stopping")
            timer.stop()
            display.stop()
            tracker.stop()
            playing = false
            saveData()
        }
        fun pause() {
            Log.d("controller", "pausing")
            timer.pause()
            tracker.pause()
            display.idle()
        }
        fun play() {
            // run
            if (action) {
                if (!playing) {
                    Log.d("controller", "setting timer for run")
                    timer.setTimer(runTime)
                    playing = true
                }
                Log.d("controller", "running")
                display.run()
                tracker.resume()
                timer.start()
            }
            // walk
            else {
                if (!playing) {
                    Log.d("controller", "setting timer for walk")
                    timer.setTimer(walkTime)
                    playing = true
                }
                Log.d("controller", "walking")
                display.walk()
                tracker.resume()
                timer.start()
            }
        }
        fun load( prefKey: String = "default" ) {
            Log.d("controller", "loading data")
            // currently hard coded, needs to be loading from pref, prefKey
            numCycles = 2
            walkTime = 5
            runTime = 10

            pause()
        }
        fun saveData() {
            Log.d("controller", "saving Data")

        }
    }

    // *********** //
    // Timer Logic //
    // *********** //
    private class Timer ( var clock: Chronometer ){
        private var running: Boolean = false
        private var pauseOffset: Long = 0
        var baseTime: Long = 0

        fun setTimer( seconds: Long ) {
            Log.d("timer", "setting timer")
            baseTime = seconds * 1000
            pauseOffset = 0
        }

        fun start() {
            if (!running) {
                Log.d("timer", "starting timer")
                clock.isCountDown = true
                clock.base = SystemClock.elapsedRealtime() + baseTime - pauseOffset
                clock.start()
                running = true
            }
        }

        fun pause() {
            Log.d("timer", "pausing timer")
            if (running) {
                clock.stop()
                pauseOffset = SystemClock.elapsedRealtime() - clock.base + baseTime
                running = false
            }
        }

        fun stop() {
            Log.d("timer", "stopping timer")
            clock.base = SystemClock.elapsedRealtime()
            pauseOffset = 0
            clock.stop()
            running = false
        }

    }

    // ***************** //
    // Location Tracking //
    // ***************** //

    private class Tracker() {
        fun start() {
        Log.d("tracker", "starting tracking")

        }

        fun resume() {
            Log.d("tracker", "resuming tracking")

        }

        fun pause() {
            Log.d("tracker", "pausing tracking")

        }

        fun stop() {
            Log.d("tracker", "stopping tracking")

        }
    }

    // location callback
    private val locationCallback = object: LocationCallback() {
        @SuppressLint("SetTextI18n")
        override fun onLocationResult(locationResult: LocationResult?) {
            if (locationResult != null) {
                super.onLocationResult(locationResult)
            }
            locationResult ?: return
            locationResult.locations.forEach {
                Log.d("TAG", "New location got: (${it.latitude}, ${it.longitude})")
                distanceDisplay.text = "${it.latitude}, ${it.longitude}"
            }
        }
    }

    // this requests location permission, and seems to work but shows errors for me.
    @SuppressLint("MissingPermission", "VisibleForTests")
    @AfterPermissionGranted(REQUEST_CODE_FINE_LOCATION)
    private fun setupLocationChangeListener() {
        if (EasyPermissions.hasPermissions(context, ACCESS_FINE_LOCATION)) {

            // right now this just fetches and prints the location every 5 seconds.
            // need to hook this into some kind of distance tracker, can use locationCallback elsewhere

//            val locationRequest = LocationRequest()
//            locationRequest.priority = LocationRequest.PRIORITY_HIGH_ACCURACY
//            locationRequest.interval = 5000 // 5000ms (5s)
//            fLocationPC.requestLocationUpdates(locationRequest, locationCallback, Looper.getMainLooper())
        } else {
            // Do not have permissions, request them now
            EasyPermissions.requestPermissions(
                host = this,
                rationale = "For showing your current location on the map.",
                requestCode = REQUEST_CODE_FINE_LOCATION,
                perms = arrayOf(ACCESS_FINE_LOCATION)
            )
        }
    }

    // ************************ //
    // Run / Walk State Display //
    // ************************ //
    private class Display(var output : TextView ) {

        // make better
        fun walk() {
            Log.d("display", "walking")
            output.text = "walking"
        }

        fun run() {
            Log.d("display", "running")
            output.text = "running"
        }

        fun idle() {
            Log.d("display", "idle")
            output.text = "idle"

        }

        fun stop() {
            Log.d("display", "stop")
            output.text = "stopped"

        }

    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}

