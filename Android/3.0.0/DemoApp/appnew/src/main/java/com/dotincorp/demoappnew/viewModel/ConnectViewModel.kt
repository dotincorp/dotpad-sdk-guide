package com.dotincorp.demoappnew.viewModel

import android.Manifest
import android.app.Application
import android.content.Intent
import android.net.Uri
import android.util.Log
import androidx.annotation.RequiresPermission
import androidx.lifecycle.AndroidViewModel
import com.dotincorp.sdk_v3.model.DataCodes
import com.dotincorp.sdk_v3.model.DTMS
import com.dotincorp.sdk_v3.model.DotDevice
import com.dotincorp.sdk_v3.model.DotDeviceMessage
import com.dotincorp.sdk_v3.model.KeyCodes
import com.dotincorp.sdk_v3.process.DotPadProcess
import com.dotincorp.sdk_v3.process.ErrorCodes
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import org.json.JSONObject

data class BrailleData(
    val id: String, // 기기 고유 식별
    val brailleData: String, // 점자 데이터
    val currentIndex: Int // 현재 페이지 번호
)

class ConnectViewModel(application: Application) : AndroidViewModel(application) {
    // 연결된 디바이스
    private val _connectedDevices = MutableStateFlow<List<DotDevice>>(emptyList())
    val connectedDevices: StateFlow<List<DotDevice>> = _connectedDevices

    // 텍스트 입력
    private val _inputText = MutableStateFlow("")
    val inputText: StateFlow<String> = _inputText.asStateFlow()

    // 에러 메시지
    private val _errorMessage = MutableStateFlow("")
    val errorMessage: StateFlow<String> = _errorMessage.asStateFlow()

    // DTMS 파일
    private var dtms: DTMS? = null

    // 점역 데이터 저장을 위한 맵 (디바이스 ID -> BrailleData)
    private val brailleDataMap = MutableStateFlow<Map<String, BrailleData>>(emptyMap())

    // 점역 설정
    private val _showBrailleSettingDialog = MutableStateFlow(false)
    val showBrailleSettingDialog: StateFlow<Boolean> = _showBrailleSettingDialog.asStateFlow()

    init {
        // 콜백 등록
        DotPadProcess.setCallBack(object : DotDeviceMessage {
            override fun receivedMessageCallBackWithDevice(
                device: DotDevice,
                dataCode: DataCodes,
                msg: String
            ) {
                // 연결된 기기 고유식별
                val id = device.deviceIdentifier

                when (dataCode) {
                    DataCodes.Connected -> {
                        // 연결된 기기 목록 갱신
                        _connectedDevices.value = DotPadProcess.getConnectedDevices()
                        // D2 장비 재출력 세팅
                        DotPadProcess.setAutoRefresh(true, device)
                    }
                    DataCodes.Reconnecting ,
                    DataCodes.Disconnected -> {
                        // 연결 해제 시 저장된 데이터 정리
                        val current = brailleDataMap.value.toMutableMap()
                        current.remove(id)
                        brailleDataMap.value = current

                        // 연결된 기기 목록 갱신
                        _connectedDevices.value = DotPadProcess.getConnectedDevices()
                    }
                    DataCodes.ConnectedFail ,DataCodes.BoardInfo ,DataCodes.BleMacAddress ,DataCodes.DeviceName ,DataCodes.DeviceFWVersion ,DataCodes.DeviceHWVersion ,DataCodes.ResponseDisplayLineAck ,DataCodes.ResponseDisplayLineNonAck ,DataCodes.ResponseDisplayLineComplete ,DataCodes.CommandError ,DataCodes.CommandNone ,DataCodes.CommandSendFail, DataCodes.ConnectionStateChangeError -> ""
                }
            }

            override fun receivedKeyCallBack(device: DotDevice?, keyCode: KeyCodes, msg: String) {
                when (keyCode) {
                    KeyCodes.PanningLeft -> device?.let { handlePrevPage(device) }
                    KeyCodes.PanningRight -> device?.let { handleNextPage(device) }
                    KeyCodes.KeyFunction3 -> dtmsPreviousPage()
                    KeyCodes.KeyFunction4 -> dtmsNextPage()
                    KeyCodes.KeyFunction1 ,KeyCodes.KeyFunction2 ,KeyCodes.KeyFunction12 ,KeyCodes.KeyFunction13 ,KeyCodes.KeyFunction14 ,KeyCodes.KeyFunction23 ,KeyCodes.KeyFunction24 ,KeyCodes.KeyFunction34 ,KeyCodes.KeyElse ,KeyCodes.PanningAll ,KeyCodes.LPF1 ,KeyCodes.RPF4 -> ""
                }
            }

            override fun receivedErrorCallback(errorCode: ErrorCodes, msg: String) {
                when (errorCode) {
                    ErrorCodes.ApplicationNotSet ,ErrorCodes.UsbPermissionDenied ,ErrorCodes.AlreadyConnected ,ErrorCodes.AlreadyConnecting ,ErrorCodes.ConnectFailed -> ""
                }
                
                Log.d("ConnectViewModel", msg)
            }
        })

        // 연결된 기기 갱신
        _connectedDevices.value = DotPadProcess.getConnectedDevices()

        // D2 장비 재출력 세팅
        DotPadProcess.setAutoRefresh(true)
    }

    // 텍스트 데이터 갱신
    fun onInputTextChange(text: String) {
        _inputText.value = text
    }

    // 텍스트 출력
    fun onCheck(device: DotDevice? = null) {
        try {
            val current = brailleDataMap.value.toMutableMap()
            DotPadProcess.displayTextData(inputText.value, device)
            { target, result ->
                val deviceId = target.deviceIdentifier
                current[deviceId] = BrailleData(id = deviceId, brailleData = result, currentIndex = 0)
                brailleDataMap.value = current
                Log.d("ConnectViewModel", "점역 데이터 저장됨 (디바이스: ${target.deviceIdentifier}): ${result.length} 문자")
            }
        } catch (e: Exception) {
            _errorMessage.value = "점역출력 중 오류: ${e.message}"
        }
    }

    // 핀 전체 올리기
    fun allUp(device: DotDevice? = null) {
        DotPadProcess.displayAllUp(device)
    }

    // 핀 전체 내리기
    fun allDown(device: DotDevice? = null) {
        DotPadProcess.displayAllDown(device)
    }

    // 샘플 출력
    fun sendSampleDtm(device: DotDevice? = null) {
        val dotSampleData =
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

        DotPadProcess.displayGraphicData(dotSampleData, device)
    }

    // 연결 해제
    @RequiresPermission(Manifest.permission.BLUETOOTH_CONNECT)
    fun disconnect(device: DotDevice? = null) {
        DotPadProcess.disconnect(device)
    }

    // 선택한 파일 읽어오기
    fun handleFileResult(uri: Uri) {
        try {
            val contentResolver = getApplication<Application>().contentResolver

            // URI 권한을 영구적으로 부여받기
            val takeFlags = Intent.FLAG_GRANT_READ_URI_PERMISSION or Intent.FLAG_GRANT_WRITE_URI_PERMISSION
            try {
                contentResolver.takePersistableUriPermission(uri, takeFlags)
            } catch (e: SecurityException) {
                Log.e("ConnectViewModel", "URI 권한을 가져올 수 없습니다: ${e.message}")
                return
            }

            // URI에서 텍스트 읽기
            val jsonString = readTextFromUri(uri)

            // DTMS 객체 생성
            dtms = DTMS(JSONObject(jsonString))
            // DTMS 데이터 설정 및 표시
            dtms?.setItemIdx(0)
            dtms?.let { it ->
                DotPadProcess.displayTextData(it.getBrailleText(), null, false)
                DotPadProcess.displayGraphicData(it.getGraphicData())
            }
        } catch (e: Exception) {
            Log.e("ConnectViewModel", "파일 처리 중 오류 발생: ${e.message}")
        }
    }

    private fun readTextFromUri(uri: Uri): String {
        return getApplication<Application>().contentResolver.openInputStream(uri)?.use { inputStream ->
            inputStream.bufferedReader().use { it.readText() }
        } ?: ""
    }

    // 펑션키 입력
    private fun dtmsPreviousPage() {
        if (dtms?.hasPreviousPage() ?: false) {
            dtms?.decreaseItemIdx()
            dtms?.let { it ->
                DotPadProcess.displayTextData(it.getBrailleText(), null, false)
                DotPadProcess.displayGraphicData(it.getGraphicData())
            }
        }
    }

    private fun dtmsNextPage() {
        if(dtms?.hasNextPage()?: false) {
            dtms?.increaseItemIdx()
            dtms?.let { it ->
                DotPadProcess.displayTextData(it.getBrailleText(), null, false)
                DotPadProcess.displayGraphicData(it.getGraphicData())
            }
        }
    }

    fun clearErrorMessage() {
        _errorMessage.value = ""
    }

    // 점자 텍스트 이전 페이지 처리
    private fun handlePrevPage(device: DotDevice) {
        val deviceId = device.deviceIdentifier
        val data = brailleDataMap.value[deviceId] ?: return
        val braille = data.brailleData
        val currentIndex = data.currentIndex
        if (currentIndex > 0) {
            val cellsPerPage = device.numberBrailleCellColumns
            if (cellsPerPage <= 0)
                return

            val newIndex = currentIndex - 1
            val map = brailleDataMap.value.toMutableMap()
            map[deviceId] = data.copy(currentIndex = newIndex)
            brailleDataMap.value = map

            val pageData = extractPageData(braille, newIndex, cellsPerPage)
            DotPadProcess.displayTextData(pageData, device, false)
        }
    }

    // 점자 텍스트 다음 페이지 처리
    private fun handleNextPage(device: DotDevice) {
        val deviceId = device.deviceIdentifier
        val data = brailleDataMap.value[deviceId] ?: return
        val braille = data.brailleData
        val currentIndex = data.currentIndex

        val cellsPerPage = device.numberBrailleCellColumns
        if (cellsPerPage <= 0)
            return

        val totalPages = ((braille.length / 2) + cellsPerPage - 1) / cellsPerPage
        if (currentIndex < totalPages - 1) {
            val newIndex = currentIndex + 1
            val map = brailleDataMap.value.toMutableMap()
            map[deviceId] = data.copy(currentIndex = newIndex)
            brailleDataMap.value = map

            val pageData = extractPageData(braille, newIndex, cellsPerPage)
            DotPadProcess.displayTextData(pageData, device, false)
        }
    }

    // 페이지 데이터 추출
    private fun extractPageData(brailleData: String, pageIndex: Int, cellsPerPage:Int): String {
        val startIndex = pageIndex * cellsPerPage * 2
        val endIndex = minOf(startIndex + (cellsPerPage * 2), brailleData.length)

        return if (startIndex < brailleData.length) {
            brailleData.substring(startIndex, endIndex)
        } else {
            ""
        }
    }

    fun onBrailleSettingToggle() {
        _showBrailleSettingDialog.value = !_showBrailleSettingDialog.value
    }
    fun getBrailleLanguages() : Map<String, List<String>> {
        return DotPadProcess.getBrailleLanguages()
    }
    fun setBrailleSettings(selectLanguage:String, selectGrade:String?) {
        DotPadProcess.setBrailleLanguages(selectLanguage, selectGrade)
    }
}