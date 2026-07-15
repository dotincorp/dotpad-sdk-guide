package com.dotincorp.demoappnew.ui.screens

import android.annotation.SuppressLint
import android.util.Log
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.dotincorp.demoappnew.ui.theme.CardBackground
import com.dotincorp.demoappnew.ui.theme.DisabledGray
import com.dotincorp.demoappnew.ui.theme.LightBlue
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.dotincorp.demoappnew.viewModel.ConnectionMode
import com.dotincorp.demoappnew.viewModel.ScannedDevice
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.TextButton
import androidx.compose.foundation.layout.Box
import com.dotincorp.demoappnew.viewModel.ScanViewModel

enum class ScanControlButton{
    BleViewMode, USBViewMode, StartScan, ConnectView//, BrailleView
}
@SuppressLint("MissingPermission")
@Composable
fun ScanScreen(onTabChange: (Int) -> Unit, viewModel: ScanViewModel = viewModel()) {
    val connectionMode by viewModel.connectionMode.collectAsStateWithLifecycle()
    val isScanning by viewModel.isScanning.collectAsStateWithLifecycle()
    val scannedValues by viewModel.scannedValues.collectAsStateWithLifecycle()
    val errorMessage by viewModel.errorMessage.collectAsStateWithLifecycle()

    // 오류 메시지 다이얼로그 표시
    if (errorMessage.isNotEmpty()) {
        AlertDialog(
            onDismissRequest = { viewModel.clearErrorMessage() },
            title = {
                Text(
                    text = "오류 확인",
                    fontSize = 18.sp,
                    fontWeight = FontWeight.Bold
                )
            },
            text = {
                Text(
                    text = errorMessage,
                    fontSize = 14.sp
                )
            },
            confirmButton = {
                TextButton(
                    onClick = { viewModel.clearErrorMessage() }
                ) {
                    Text("확인")
                }
            }
        )
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        // 상단 버튼들 - 모드 전환 + 탭 전환
        ScanControlButtons(
            connectionMode = connectionMode,
            onClick = {
                when(it) {
                    ScanControlButton.BleViewMode -> viewModel.switchConnectionMode(ConnectionMode.BLE)
                    ScanControlButton.USBViewMode -> viewModel.switchConnectionMode(ConnectionMode.USB)
                    ScanControlButton.StartScan -> viewModel.toggleScan()
                    ScanControlButton.ConnectView -> {
                        viewModel.switchConnectionMode(viewModel.connectionMode.value)
                        onTabChange(1)
                    }
                }
            },
            isScanning = isScanning
        )

        // 스캔된 값을 보여주는 카드 영역
        ScannedValuesCard(
            scannedValues = scannedValues,
            modifier = Modifier.weight(1f),
            viewModel = viewModel
        )
    }
}

@Composable
fun ScanControlButtons(
    onClick: (ScanControlButton) -> Unit,
    connectionMode: ConnectionMode,
//    onModeChange: (ConnectionMode) -> Unit,
//    onTabChange: (Int) -> Unit,
    isScanning: Boolean,
//    onScanToggle: () -> Unit,
//    onBrailleSetting: () -> Unit
) {
    Column(
        verticalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        // 첫 번째 행: BLE/USB 모드 전환 + 스캔/연결 목록 탭
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            // BLE/USB 모드 전환 버튼
            Button(
                onClick = {
                    if (connectionMode == ConnectionMode.USB)
                        onClick(ScanControlButton.BleViewMode)
//                        onModeChange(ConnectionMode.BLE)
                },
                modifier = Modifier
                    .weight(1f)
                    .height(48.dp),
                colors = ButtonDefaults.buttonColors(
                    containerColor = if (connectionMode == ConnectionMode.USB) LightBlue else DisabledGray
                ),
                shape = RoundedCornerShape(8.dp)
            ) {
                Text(
                    text = "BLE",
                    fontSize = 14.sp,
                    fontWeight = FontWeight.Medium
                )
            }

            // BLE/USB 모드 전환 버튼
            Button(
                onClick = {
                    if (connectionMode == ConnectionMode.BLE)
                        onClick(ScanControlButton.USBViewMode)
//                        onModeChange(ConnectionMode.USB)
                },
                modifier = Modifier
                    .weight(1f)
                    .height(48.dp),
                colors = ButtonDefaults.buttonColors(
                    containerColor = if (connectionMode == ConnectionMode.BLE) LightBlue else DisabledGray
                ),
                shape = RoundedCornerShape(8.dp)
            ) {
                Text(
                    text = "USB",
                    fontSize = 14.sp,
                    fontWeight = FontWeight.Medium
                )
            }
        }

        // 두 번째 행: 스캔 제어 버튼들
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            Button(
                onClick = {
                    onClick(ScanControlButton.StartScan)
                },
                modifier = Modifier
                    .weight(1f)
                    .height(48.dp),
                enabled = true,
                colors = ButtonDefaults.buttonColors(
                    containerColor = if (isScanning) DisabledGray else LightBlue
                ),
                shape = RoundedCornerShape(8.dp)
            ) {
                Text(
                    text = if (isScanning) "STOP SCAN" else "START SCAN",
                    fontSize = 14.sp,
                    fontWeight = FontWeight.Medium
                )
            }

            // 탭 전환 버튼
            Button(
                onClick = { onClick(ScanControlButton.ConnectView) },
                modifier = Modifier
                    .weight(1f)
                    .height(48.dp),
                colors = ButtonDefaults.buttonColors(
                    containerColor = LightBlue
                ),
                shape = RoundedCornerShape(8.dp)
            ) {
                Text(
                    text = "연결된 목록",
                    fontSize = 14.sp,
                    fontWeight = FontWeight.Medium
                )
            }
        }
    }
}

@SuppressLint("MissingPermission")
@Composable
fun ScannedValuesCard(
    scannedValues: List<ScannedDevice>,
    modifier: Modifier = Modifier,
    viewModel: ScanViewModel
) {
    Card(
        modifier = modifier
            .fillMaxWidth(),
        shape = RoundedCornerShape(8.dp),
        colors = CardDefaults.cardColors(containerColor = CardBackground)
    ) {
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(8.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            if (scannedValues.isEmpty()) {
                item {
                    Text(
                        text = "스캔된 값이 없습니다",
                        color = Color.Gray,
                        modifier = Modifier.fillMaxWidth(),
                        style = MaterialTheme.typography.bodyMedium
                    )
                }
            } else {
                items(scannedValues, key = { it.identifier }) { device ->
                    val isConnect = device.isConnect
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(4.dp),
                        colors = CardDefaults.cardColors(
                            containerColor = if (isConnect) DisabledGray else Color(0xFFC9C9C9)
                        ),
                        onClick = { 
                            if (!isConnect) {
                                viewModel.connect(device)
                            }
                        }
                    ) {
                        Box(modifier = Modifier.fillMaxWidth()){
                            Column {
                                Text(
                                    text = device.name,
                                    modifier = Modifier.padding(start = 10.dp, end = 10.dp, top = 10.dp, bottom = 0.dp),
                                    style = MaterialTheme.typography.bodyMedium,
                                    fontSize = 22.sp,
                                    color = if (isConnect) Color.Gray else Color.Black
                                )
                                Text(
                                    text = device.identifier,
                                    modifier = Modifier.padding(start = 10.dp, end = 10.dp, top = 0.dp, bottom = 10.dp),
                                    style = MaterialTheme.typography.bodyMedium,
                                    fontSize = 14.sp,
                                    color = if (isConnect) Color.Gray else Color(0xFF747474)
                                )
                            }
                            
                            if (isConnect) {
                                Text(
                                    text = "연결됨",
                                    modifier = Modifier
                                        .align(Alignment.TopEnd)
                                        .padding(8.dp),
                                    style = MaterialTheme.typography.bodySmall,
                                    fontSize = 12.sp,
                                    color = Color.Green,
                                    fontWeight = FontWeight.Bold
                                )
                            }
                        }
                    }
                }
            }
        }
    }
}