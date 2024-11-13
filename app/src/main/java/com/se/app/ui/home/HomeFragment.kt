package com.se.app.ui.home

import android.Manifest.permission.ACCESS_FINE_LOCATION
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

    private lateinit var clock: Timer

    private lateinit var fLocationPC: FusedLocationProviderClient
    private lateinit var distanceDisplay: TextView

    private lateinit var runButton: Button

    // This property is only valid between onCreateView and
    // onDestroyView.
    private val binding get() = _binding!!

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        val homeViewModel =
            ViewModelProvider(this)[HomeViewModel::class.java]

        _binding = FragmentHomeBinding.inflate(inflater, container, false)
        val root: View = binding.root

        distanceDisplay = binding.distanceDisplay
        runButton = binding.runButton

        // chronometer object that can act as a stopwatch or timer
        // to switch call .setCountDown(boolean)
        clock = Timer(binding.cMeter)

        // Google Play Location Service
        fLocationPC = LocationServices.getFusedLocationProviderClient(requireActivity())
        setupLocationChangeListener()


        // runButton onclick
        runButton.setOnClickListener(object : View.OnClickListener {
            var isWorking = false

            override fun onClick(v: View) {
                isWorking = if (!isWorking) {

                    // set clock to countdown for 30 seconds
                    clock.setTimer(30)
                    // start clock
                    clock.startTimer()
                    true
                } else {
                    clock.stopTimer()
                    false
                }

                runButton.text = if (!isWorking) getString(R.string.start) else getString(R.string.stop)

            }
        })


        return root
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }

    // *********** //
    // Timer Logic //
    // *********** //
    private class Timer ( var clock: Chronometer ){
        private var running: Boolean = false
        private var pauseOffset: Long = 0
        private var baseTime: Long = 0

        fun setTimer( time: Long ) {
            baseTime = time * 1000
            pauseOffset = 0
        }

        fun startTimer() {
            if (!running) {
                clock.isCountDown = true
                clock.base = SystemClock.elapsedRealtime() - pauseOffset + baseTime
                clock.start()
                running = true
            }
        }

        fun pauseTimer() {
            if (running) {
                clock.stop()
                pauseOffset = SystemClock.elapsedRealtime() - clock.base
                running = false
            }
        }

        fun stopTimer() {
            clock.base = SystemClock.elapsedRealtime()
            pauseOffset = 0
            clock.stop()
            running = false
        }
    }

    // ***************** //
    // Location Tracking //
    // ***************** //

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

            val locationRequest = LocationRequest()
            locationRequest.priority = LocationRequest.PRIORITY_HIGH_ACCURACY
            locationRequest.interval = 5000 // 5000ms (5s)
            fLocationPC.requestLocationUpdates(locationRequest, locationCallback, Looper.getMainLooper())
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
}

