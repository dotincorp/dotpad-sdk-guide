package com.dotpadincorp.librarytest.viewmodel

import android.annotation.TargetApi
import android.content.Context.BLUETOOTH_SERVICE
import android.os.Build
import androidx.annotation.RequiresApi
import androidx.databinding.ObservableBoolean
import com.dotpadincorp.librarytest.MyApplication
import androidx.lifecycle.*
import java.util.*
import android.bluetooth.*
import com.dotincorp.sdk.BleRepository
import com.dotincorp.sdk.process.DotPadProcess
import com.dotincorp.sdk.util.Event

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

    var outputReady:Boolean = false

    /**
     *  Dot Pad ProcessData
     */

    val mDotPadProcess = DotPadProcess()

    /**
     *  Start BLE Scan
     */
    @RequiresApi(Build.VERSION_CODES.M)
    fun onClickScan(){
        bleRepository.startScan()
    }
    fun onClickDisconnect(){
        mDotPadProcess.disconnect()
    }
    fun connectDevice(bluetoothDevice: BluetoothDevice){
        mDotPadProcess.connect(bluetoothDevice, MyApplication.instance)
    }
    fun onClickAllUp(){
        if (!outputReady)
            return

        mDotPadProcess.displayGraphicAllUp()
        mDotPadProcess.displayTextDataLine(0, 0, "FFFFFFFF")
    }
    fun onClickAllDown(){
        if (!outputReady)
            return

        mDotPadProcess.displayGraphicAllDown()
        mDotPadProcess.displayTextDataLine(0, 1, "00")
    }
    fun onClickSendSampleDTM() {
        if (!outputReady)
            return

        val sampleData =
                    "00000000000000000000000000000080CC6E170000000000000000000000" +
                    "000000000000000000008888888C047C7F13000000000000000000000000" +
                    "00000000000000C06C5F1B7B7B3F3FFFFFFFDDFFEFCE0000000000000000" +
                    "000000000000003D7D784DF9A7A1213D3B39FBFFBF130000000000000000" +
                    "00000000000000DF15FB05B4C5596D0EFDD9F10D00000000000000000000" +
                    "00000000000000D7DEDA9AAF78E96EFB764F7B0400000000000000000000" +
                    "00000000000000709FD78FCF3CB97939BF4FEFE900000000000000000000" +
                    "000000000000000073CBA3D4FFC4BDEE3BC6BBED390C0000000000000000" +
                    "00000000000000000010D7EBEA67FFF0B6B79CDF35030000000000000000" +
                    "000000000000000000000000117366372733010000000000000000000000"
        mDotPadProcess.displayGraphicData(sampleData)
    }
}