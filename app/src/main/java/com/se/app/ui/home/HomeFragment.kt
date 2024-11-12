package com.se.app.ui.home

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Button
import android.widget.Chronometer
import android.widget.TextView
import android.widget.Toast
import androidx.fragment.app.Fragment
import androidx.lifecycle.ViewModelProvider
import com.se.app.R
import com.se.app.databinding.FragmentHomeBinding


class HomeFragment : Fragment() {

    private var _binding: FragmentHomeBinding? = null

    private lateinit var cMeter: Chronometer

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

        // chronometer object that can act as a stopwatch or timer
        // to switch call .setCountDown(boolean)
        cMeter = binding.cMeter




        distanceDisplay = binding.distanceDisplay
        runButton = binding.runButton

        runButton.setOnClickListener(object : View.OnClickListener {
            var isWorking = false

            override fun onClick(v: View) {
                isWorking = if (!isWorking) {
                    cMeter.start()
                    true
                } else {
                    cMeter.stop()
                    false
                }

                runButton.text = if (!isWorking) getString(R.string.start) else getString(R.string.stop)

                Toast.makeText(context, getString(
                    if (isWorking)
                        R.string.working
                    else
                        R.string.stopped),
                    Toast.LENGTH_SHORT).show()
            }
        })

        return root
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}