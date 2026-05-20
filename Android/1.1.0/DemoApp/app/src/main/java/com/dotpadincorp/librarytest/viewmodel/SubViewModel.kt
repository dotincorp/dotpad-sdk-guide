package com.dotpadincorp.librarytest.viewmodel

import android.annotation.TargetApi
import android.content.Context.BLUETOOTH_SERVICE
import android.os.Build
import androidx.annotation.RequiresApi
import androidx.databinding.ObservableBoolean
import com.dotincorp.android.DotPadSDK.DotPad_ProcessData
import com.dotpadincorp.ble.util.Event
import com.dotpadincorp.librarytest.MyApplication
import com.dotpadincorp.ble.*
import androidx.lifecycle.*
import java.util.*
import android.bluetooth.*
import android.widget.TextView

class SubViewModel(val bleRepository: BleRepository) : ViewModel() {

    private val TAG = "MainViewModel"

    val statusTxt: LiveData<String>
        get() = bleRepository.fetchStatusText().asLiveData(viewModelScope.coroutineContext)
    val readTxt: LiveData<String>
        get() = bleRepository.fetchReadText().asLiveData(viewModelScope.coroutineContext)

    val bleManager : BluetoothManager
        get() = MyApplication.applicationContext().getSystemService(BLUETOOTH_SERVICE) as BluetoothManager

    //ble adapter
    private val bleAdapter: BluetoothAdapter?
        get() = bleRepository.bleAdapter

    val requestEnableBLE : LiveData<Event<Boolean>>
        get() = bleRepository.requestEnableBLE
    val listUpdate : LiveData<Event<ArrayList<BluetoothDevice>?>>
        get() = bleRepository.listUpdate

    val _isScanning: LiveData<Event<Boolean>>
        get() = bleRepository.isScanning
    var isScanning = ObservableBoolean(false)
    val _isConnect: LiveData<Event<Boolean>>
        get() = bleRepository.isConnect
    var isConnect = ObservableBoolean(false)

    /**
     *  Dot Pad ProcessData
     */

    val mDotPad_ProcessData = DotPad_ProcessData(bleRepository)

    /**
     *  Start BLE Scan
     */
    @RequiresApi(Build.VERSION_CODES.M)
    fun onClickScan(){
        bleRepository.startScan()
    }
    fun onClickDisconnect(){
        bleRepository.disconnectGattServer()
    }
    fun connectDevice(bluetoothDevice: BluetoothDevice){
        bleRepository.connectDevice(bluetoothDevice, MyApplication.instance)
    }
    fun onClickAllUp(){
        mDotPad_ProcessData.allUp()
    }
    fun onClickAllDown(){
        mDotPad_ProcessData.allDown()
    }
    fun onClickSendSampleDTM() {
        mDotPad_ProcessData.SampleDTM()
    }
}