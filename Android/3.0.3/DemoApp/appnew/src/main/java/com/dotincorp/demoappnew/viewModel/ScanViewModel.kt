package com.dotincorp.demoappnew.viewModel

import android.Manifest
import android.annotation.SuppressLint
import android.app.Application
import android.app.PendingIntent
import android.bluetooth.BluetoothDevice
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.hardware.usb.UsbDevice
import android.hardware.usb.UsbManager
import android.os.Build
import android.os.Handler
import android.os.Looper
import androidx.annotation.RequiresPermission
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.dotincorp.sdk_v3.model.DotDevice
import com.dotincorp.sdk_v3.process.DotPadProcess
import com.dotincorp.sdk_v3.process.DotPadScanner
import com.dotincorp.sdk_v3.process.DotPadSearchListener
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import kotlinx.coroutines.suspendCancellableCoroutine
import kotlin.coroutines.resume

enum class ConnectionMode {
    BLE, USB
}

data class ScannedDevice(
    val name: String,
    val identifier: String, // 고유 식별
    val bluetoothDevice: BluetoothDevice? = null,
    val usbDevice: UsbDevice? = null,
    val isConnect: Boolean = false
)

class ScanViewModel(application: Application) : AndroidViewModel(application) {
    private val scanner: DotPadScanner = DotPadScanner(application)

    // 스캔된 기기 목록
    private val _scannedValues = MutableStateFlow<List<ScannedDevice>>(emptyList())
    val scannedValues: StateFlow<List<ScannedDevice>> = _scannedValues.asStateFlow()

    // BLE/USB 메뉴 선택
    private val _connectionMode = MutableStateFlow(ConnectionMode.BLE)
    val connectionMode: StateFlow<ConnectionMode> = _connectionMode.asStateFlow()

    // 에러 메시지
    private val _errorMessage = MutableStateFlow("")
    val errorMessage: StateFlow<String> = _errorMessage.asStateFlow()

    // 스캔 중 확인
    private val _isScanning = MutableStateFlow(false)
    val isScanning: StateFlow<Boolean> = _isScanning.asStateFlow()

    init {
        // 스캔 리스너 등록
        scanner.listener = object : DotPadSearchListener {
            @RequiresPermission(Manifest.permission.BLUETOOTH_CONNECT)
            override fun onBLEScan(device: BluetoothDevice) {
                val exists = _scannedValues.value.any { it.identifier == device.address }
                if (!exists) {
                    _scannedValues.value = _scannedValues.value + ScannedDevice(
                        name = device.name ?: "Unknown Device",
                        identifier = device.address,
                        bluetoothDevice = device
                    )
                }
            }

            override fun onUSBScan(devices: List<UsbDevice>) {
                _scannedValues.value = devices.map { dev ->
                    val identifier = "${dev.vendorId}:${dev.productId}:${dev.deviceName}"
                    ScannedDevice(
                        name = dev.productName ?: "USB Device",
                        identifier = identifier,
                        usbDevice = dev
                    )
                }
            }

            // BLE 스캔 중인지 확인
            override fun isBLEScanning(isScanning: Boolean) {
                _isScanning.value = isScanning
            }

            override fun onError(msg: String) {
                _errorMessage.value = msg
            }
        }
    }

    // BLE/USB 스캔 탭 메뉴
    @RequiresPermission(Manifest.permission.BLUETOOTH_SCAN)
    fun switchConnectionMode(mode: ConnectionMode) {
        _connectionMode.value = mode
        _scannedValues.value = emptyList()
        scanner.stopBleScan()
    }

    // 스캔 시작/종료
    @RequiresPermission(Manifest.permission.BLUETOOTH_SCAN)
    fun toggleScan() {
        when (_connectionMode.value) {
            ConnectionMode.BLE -> {
                if (_isScanning.value) scanner.stopBleScan()
                else {
                    _scannedValues.value = emptyList()
                    scanner.startBleScan()
                }
            }

            ConnectionMode.USB -> {
                scanner.startUsbScan()
            }
        }
    }

    // 기기 연결
    @SuppressLint("MissingPermission")
    fun connect(device: ScannedDevice) {
        _errorMessage.value = ""
        when (_connectionMode.value) {
            ConnectionMode.BLE -> {
                device.bluetoothDevice?.let { bt ->
                    DotPadProcess.connect(bt)
                    _scannedValues.update { list ->
                        list.map { item ->
                            if (item == device) {
                                item.copy(isConnect = true)
                            } else {
                                item
                            }
                        }
                    }
                }
            }

            ConnectionMode.USB -> {
                viewModelScope.launch {
                    val granted = device.usbDevice?.let {
                        requestUsbPermissionOnce(getApplication<Application>(), DotPadProcess.usbManager, it)
                    } ?: false

                    if (granted) {
                        device.usbDevice.let { usbDevice ->
                            DotPadProcess.connect(usbDevice)
                            _scannedValues.update { list ->
                                list.map { item ->
                                    if (item == device) {
                                        item.copy(isConnect = true)
                                    } else {
                                        item
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    // 에러 메시지 초기화
    fun clearErrorMessage() {
        _errorMessage.value = ""
    }

    // 기기 연결 권한 요청
    private suspend fun requestUsbPermissionOnce(
        context: Application,
        usbManager: UsbManager,
        device: UsbDevice
    ): Boolean {
        val appCtx = context.applicationContext
        if (usbManager.hasPermission(device)) return true

        val action = "${appCtx.packageName}.USB_PERMISSION"

        return suspendCancellableCoroutine { cont ->
            var done = false
            val main = Handler(Looper.getMainLooper())

            // 1) 브로드캐스트 수신 (승인/거부 콜백)
            val receiver = object : BroadcastReceiver() {
                override fun onReceive(ctx: Context, intent: Intent) {
                    if (done || intent.action != action) return
                    val grantedExtra =
                        intent.getBooleanExtra(UsbManager.EXTRA_PERMISSION_GRANTED, false)
                    // 일부 단말은 grantedExtra가 false라도 실제 권한은 true가 됨
                    val grantedNow = usbManager.hasPermission(device)
                    val grantedFinal = grantedExtra || grantedNow

                    done = true
                    runCatching { appCtx.unregisterReceiver(this) }
                    main.removeCallbacksAndMessages(null)

                    if (!cont.isCompleted) cont.resume(grantedFinal)
                }
            }

            // 등록
            val filter = IntentFilter(action)
            if (Build.VERSION.SDK_INT >= 33) {
                appCtx.registerReceiver(receiver, filter, Context.RECEIVER_NOT_EXPORTED)
            } else {
                appCtx.registerReceiver(receiver, filter)
            }

            // 고유 PendingIntent + 내 앱으로 라우팅
            val intent = Intent(action).setPackage(appCtx.packageName)
            val pi = PendingIntent.getBroadcast(
                appCtx,
                device.deviceId, // 요청마다 고유 requestCode로 충돌 방지
                intent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )

            // 권한 요청
            usbManager.requestPermission(device, pi)
        }
    }
}