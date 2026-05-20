package com.dotpadincorp.librarytest

import android.app.Activity
import android.bluetooth.BluetoothAdapter
import android.bluetooth.BluetoothDevice
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.util.Log
import android.view.View
import android.widget.Button
import android.widget.TextView
import android.widget.Toast
import androidx.activity.result.ActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.annotation.RequiresApi
import androidx.appcompat.app.AppCompatActivity
import androidx.appcompat.widget.AppCompatButton
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import androidx.databinding.DataBindingUtil
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.dotincorp.sdk.REQUEST_ALL_PERMISSION
import com.dotincorp.sdk.*
import com.dotincorp.sdk.model.DataCodes
import com.dotincorp.sdk.model.DotDeviceMessage
import com.dotincorp.sdk.util.BrailleUtil
import com.dotpadincorp.librarytest.adapter.BleListAdapter
import com.dotpadincorp.librarytest.viewmodel.SubViewModel

import com.dotpadincorp.librarytest.databinding.ActivityMainBinding

class MainActivity : AppCompatActivity(), DotDeviceMessage {
    private val TAG = "MainActivity"

    private var viewModel: SubViewModel? = null
    private var adapter: BleListAdapter? = null

    private var btnScan: AppCompatButton? = null
    private var btnDisconnect: AppCompatButton? = null
    private var padInfo: Button? = null
    private var padTextButton:Button? = null

    private var deviceName : TextView? = null
    private var getEditText : String = ""

    @RequiresApi(Build.VERSION_CODES.M)
    override fun onCreate(saveInstanceState: Bundle?){
        super.onCreate(saveInstanceState)
        viewModel = SubViewModel(BleRepository(application))
        val binding = DataBindingUtil.setContentView<ActivityMainBinding>(
            this,
            R.layout.activity_main
        )

        btnScan = findViewById(R.id.btn_scan)
        btnDisconnect = findViewById(R.id.btn_disconnect)
        padInfo = findViewById(R.id.PadInfo)
        padTextButton = findViewById(R.id.PadTextButton)

        deviceName = findViewById(R.id.PadInfoTextField)

        binding.viewModel = viewModel
        binding.rvBleList.setHasFixedSize(true)
        val layoutManager: RecyclerView.LayoutManager = LinearLayoutManager(this)
        binding.rvBleList.layoutManager = layoutManager

        adapter = BleListAdapter()
        binding.rvBleList.adapter = adapter
        adapter?.setItemClickListener(object : BleListAdapter.ItemClickListener {
            override fun onClick(view: View, device: BluetoothDevice?) {
                if (device != null) {
                    viewModel?.connectDevice(device)
                }
            }
        })

        // check if location permission
        if (!hasPermissions(this, PERMISSIONS)) {
            requestPermissions(PERMISSIONS, REQUEST_ALL_PERMISSION)
        }

        binding.PadTextButton.setOnClickListener{

            if(binding.PadTextField.text.toString().length > 0) {
                getEditText = binding.PadTextField.text.toString()
                Toast.makeText(this, getEditText, Toast.LENGTH_SHORT).show()

                Log.d(TAG, "onCreate: " + BrailleUtil.translateToString(getEditText))

//                viewModel.mDotPadProcess.setTextToBrailleText(getEditText)
//                viewModel.mDotPadProcess.displayBrailleData()

                //setTextToBrailleText + displayBrailleData = displayTextData
                viewModel?.mDotPadProcess?.displayTextData(getEditText)
            }
        }

        initObserver(binding)

        viewModel?.mDotPadProcess?.setCallBack(this)
    }

    private fun initObserver(binding: ActivityMainBinding){

        viewModel?.requestEnableBLE?.observe(this, {
            it.getContentIfNotHandled()?.let {
                requestEnableBLE()
            }
        })
        viewModel?.listUpdate?.observe(this, {
            it.getContentIfNotHandled()?.let { scanResults ->
                adapter?.setItem(scanResults)
            }
        })

        viewModel?._isScanning?.observe(this,{
            it.getContentIfNotHandled()?.let{ scanning->
                viewModel?.isScanning?.set(scanning)
            }
        })

        viewModel?.statusTxt?.observe(this,{

            binding.statusText.text = it

        })

        viewModel?.readTxt?.observe(this,{

            binding.txtRead.append(it)

            if ((binding.txtRead.measuredHeight - binding.scroller.scrollY) <=
                (binding.scroller.height + binding.txtRead.lineHeight)) {
                binding.scroller.post {
                    binding.scroller.smoothScrollTo(0, binding.txtRead.bottom)
                }
            }

        })
    }
    override fun onResume() {
        super.onResume()
        // finish app if the BLE is not supported
        if (!packageManager.hasSystemFeature(PackageManager.FEATURE_BLUETOOTH_LE)) { finish() }
    }


    private val requestEnableBleResult = registerForActivityResult(ActivityResultContracts.StartActivityForResult()) { result: ActivityResult ->
        if (result.resultCode == Activity.RESULT_OK) {
            val intent = result.data
            // do somthing after enableBleRequest
        }
    }

    fun String.decodeHex(): ByteArray {
        check(length % 2 == 0) { "Must have an even length" }

        return chunked(2)
            .map { it.toInt(16).toByte() } /* radix = 16 은 16진수를 의미 */
            .toByteArray()
    }

    /**
     * Request BLE enable
     */
    private fun requestEnableBLE() {
        val bleEnableIntent = Intent(BluetoothAdapter.ACTION_REQUEST_ENABLE)
        requestEnableBleResult.launch(bleEnableIntent)
    }

    private fun hasPermissions(context: Context?, permissions: Array<String>): Boolean {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M && context != null && permissions != null) {
            for (permission in permissions) {
                if (ActivityCompat.checkSelfPermission(context, permission)
                    != PackageManager.PERMISSION_GRANTED) {
                    return false
                }
            }
        }
        return true
    }
    // Permission check
    @RequiresApi(Build.VERSION_CODES.M)
    override fun onRequestPermissionsResult(
        requestCode: Int,
        permissions: Array<String?>,
        grantResults: IntArray
    ) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults)
        when (requestCode) {
            REQUEST_ALL_PERMISSION -> {
                // If request is cancelled, the result arrays are empty.
                if (grantResults.isNotEmpty() && grantResults[0] == PackageManager.PERMISSION_GRANTED) {
                    Toast.makeText(this, "Permissions granted!", Toast.LENGTH_SHORT).show()
                } else {
                    requestPermissions(permissions, REQUEST_ALL_PERMISSION)
                    Toast.makeText(this, "Permissions must be granted", Toast.LENGTH_SHORT).show()
                }
            }
        }
    }

    override fun receivedMessageCallBack(dataCode: DataCodes, msg: String) {
        //TODO("Not yet implemented")
        Log.d(TAG, "receivedMessage: " + msg)
        //var deviceName : TextView = findViewById(R.id.PadInfoTextField)

        when (dataCode) {
            DataCodes.Connected -> getDeviceInfo()
            DataCodes.Disconnected -> getDisconnected()
            DataCodes.DeviceName -> getDeviceName(msg)
            DataCodes.DeviceAuxiliaryKeyRightPress -> setDevicePannigKeyPress(msg)
            DataCodes.DeviceFunctionKey1stLeftPress -> setDeviceFuntionKeyPress(msg)

            // Output is available only after the device is connected and the DataCodes.BoardInfo callback has been received.
            DataCodes.BoardInfo -> viewModel?.outputReady = true
        }
    }

    fun getDeviceInfo() {
        Log.d(TAG, "getDeviceInfo: ")

        //change button status
        btnScan?.background = ContextCompat.getDrawable(this, R.drawable.round_background_color3)
        btnDisconnect?.background = ContextCompat.getDrawable(this, R.drawable.button_back)

        val handler = Handler(Looper.getMainLooper())
        handler.post {
            btnScan?.isEnabled = false
            btnDisconnect?.isEnabled = true
            padInfo?.isEnabled = true
            padTextButton?.isEnabled = true
        }

        Handler(Looper.getMainLooper()).postDelayed({
            Log.d(TAG, "postDelayed: ")
            // device name
            viewModel?.mDotPadProcess?.requestDeviceName()
        }, 1000)
    }

    fun getDeviceName(msg: String) {
        Log.d(TAG, "getDeviceName: "+msg)
        deviceName?.setText(msg)

    }

    fun getDisconnected() {
        Log.d(TAG, "getDisconnected: ")

        viewModel?.outputReady = false

        //change button status
        btnScan?.background = ContextCompat.getDrawable(this, R.drawable.button_back)

        btnDisconnect?.background = ContextCompat.getDrawable(this, R.drawable.round_background_color3)
        val handler = Handler(Looper.getMainLooper())
        handler.post {
            btnScan?.isEnabled = true
            btnDisconnect?.isEnabled = false
            padInfo?.isEnabled = false
            padTextButton?.isEnabled = false
        }

        deviceName?.setText("")
    }

    fun setDevicePannigKeyPress(msg: String) {
        val binaryString = Integer.toBinaryString(msg.toInt()).padStart(4, '0')

        // Panning Left
        // setTextToBrailleText -> Pressing the key outputs the previous text.
        if (binaryString == "0100") {
            val handler = Handler(Looper.getMainLooper())
            handler.post {
                Toast.makeText(
                    this,
                    "Panning Key Left(Pressing the key outputs the previous text)",
                    Toast.LENGTH_SHORT
                ).show()
            }
        }

        // Panning Right
        // setTextToBrailleText -> Pressing the key outputs the next text.
        if (binaryString == "0010") {
            val handler = Handler(Looper.getMainLooper())
            handler.post {
                Toast.makeText(
                    this,
                    "Panning Key Right(Pressing the key outputs the next text)",
                    Toast.LENGTH_SHORT
                ).show()
            }
        }
    }

    fun setDeviceFuntionKeyPress(msg:String) {
        val binaryString = Integer.toBinaryString(msg.toInt()).padStart(4, '0')

        // Function1 key
        if (binaryString == "1000") {
            val handler = Handler(Looper.getMainLooper())
            handler.post {
                Toast.makeText(this, "Function1 key press", Toast.LENGTH_SHORT).show()
            }
        }

        // Function2 key
        if (binaryString == "0100") {
            val handler = Handler(Looper.getMainLooper())
            handler.post {
                Toast.makeText(this, "Function2 key press", Toast.LENGTH_SHORT).show()
            }
        }

        // Function3 key
        if (binaryString == "0001") {
            val handler = Handler(Looper.getMainLooper())
            handler.post {
                Toast.makeText(this, "Function3 key press", Toast.LENGTH_SHORT).show()
            }
        }

        // Function4 key
        if (binaryString == "0010") {
            val handler = Handler(Looper.getMainLooper())
            handler.post {
                Toast.makeText(this, "Function4 key press", Toast.LENGTH_SHORT).show()
            }
        }
    }
}
