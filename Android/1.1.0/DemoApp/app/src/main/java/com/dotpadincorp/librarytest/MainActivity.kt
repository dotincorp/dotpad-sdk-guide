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
import android.widget.TextView
import android.widget.Toast
import androidx.activity.result.ActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.annotation.RequiresApi
import androidx.appcompat.app.AppCompatActivity
import androidx.core.app.ActivityCompat
import androidx.databinding.DataBindingUtil
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.dotpadincorp.ble.REQUEST_ALL_PERMISSION
import com.dotpadincorp.ble.*
import com.dotpadincorp.ble.util.BrailleUtil
import com.dotpadincorp.librarytest.adapter.BleListAdapter
import com.dotpadincorp.librarytest.viewmodel.SubViewModel

import org.koin.androidx.viewmodel.ext.android.viewModel
import com.dotpadincorp.librarytest.databinding.ActivityMainBinding

class MainActivity : AppCompatActivity(), BLEMessage{

    private val TAG = "MainActivity"

    private val viewModel by viewModel<SubViewModel>()
    private var adapter: BleListAdapter? = null
    var deviceName : TextView? = null

    var getEditText : String = ""

    @RequiresApi(Build.VERSION_CODES.M)
    override fun onCreate(saveInstanceState: Bundle?){
        super.onCreate(saveInstanceState)
        val binding = DataBindingUtil.setContentView<ActivityMainBinding>(
            this,
            R.layout.activity_main
        )

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
                    viewModel.connectDevice(device)
                }
            }
        })

        // check if location permission
        if (!hasPermissions(this, PERMISSIONS)) {
            requestPermissions(PERMISSIONS, REQUEST_ALL_PERMISSION)
        }


        /*binding.PadInfo.setOnClickListener{
            var dot_protocol_cmd = "aa55000500010000a4"
            var writeArray = dot_protocol_cmd.decodeHex()

            viewModel.bleRepository.writeData(writeArray)

            Log.d(TAG, "onCreate: button clicked" )
        }*/

        binding.PadTextButton.setOnClickListener{

            if(binding.PadTextField.text.toString().length > 0) {
                getEditText = binding.PadTextField.text.toString()
                Toast.makeText(this, getEditText, Toast.LENGTH_SHORT).show()

                Log.d(TAG, "onCreate: " + BrailleUtil.translateToString(getEditText))
                viewModel.mDotPad_ProcessData.setBrailleText(getEditText, 0)
                viewModel.mDotPad_ProcessData.sendBrailleText(0)
            }
        }

        initObserver(binding)
        viewModel.bleRepository.delegate_SDP = this


        if (viewModel.bleRepository != null )
            viewModel.bleRepository.setCallBackFtn(this)
        else
            Log.d(TAG, "onCreate: setCallBackFtn failed")
    }

    private fun initObserver(binding: ActivityMainBinding){

        viewModel.requestEnableBLE.observe(this, {
            it.getContentIfNotHandled()?.let {
                requestEnableBLE()
            }
        })
        viewModel.listUpdate.observe(this, {
            it.getContentIfNotHandled()?.let { scanResults ->
                adapter?.setItem(scanResults)
            }
        })

        viewModel._isScanning.observe(this,{
            it.getContentIfNotHandled()?.let{ scanning->
                viewModel.isScanning.set(scanning)
            }
        })
        viewModel._isConnect.observe(this,{
            it.getContentIfNotHandled()?.let{ connect->
                viewModel.isConnect.set(connect)
            }
        })
        viewModel.statusTxt.observe(this,{

            binding.statusText.text = it

        })

        viewModel.readTxt.observe(this,{

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

    override fun receivedMessage(dataCode: BleRepository.DataCodes , msg: String) {
        //TODO("Not yet implemented")
        Log.d(TAG, "receivedMessage: " + msg)
        //var deviceName : TextView = findViewById(R.id.PadInfoTextField)

        when (dataCode) {
            BleRepository.DataCodes.Connected -> getDeviceInfo()
            BleRepository.DataCodes.Disconnected -> getDisconnected()
            BleRepository.DataCodes.Discovry_List -> getDiscovryList()
            BleRepository.DataCodes.DeviceName -> getDeviceName(msg)
        }
    }

    fun getDeviceInfo() {
        Log.d(TAG, "getDeviceInfo: ")
        //if(viewModel.bleRepository.RestrictionsName)
        Handler(Looper.getMainLooper()).postDelayed({
            Log.d(TAG, "postDelayed: ")
            viewModel.mDotPad_ProcessData.reqDeviceName()
        }, 500)
    }

    fun getDeviceName(msg: String) {
        Log.d(TAG, "getDeviceName: "+msg)
        deviceName?.setText(msg)

    }

    fun getDiscovryList() {
        Log.d(TAG, "getDiscovryList: ")
    }

    fun getDisconnected() {
        Log.d(TAG, "getDisconnected: ")
        deviceName?.setText("")

        //adapter?.items?.clear()
        //adapter?.notifyDataSetChanged()
    }

}
