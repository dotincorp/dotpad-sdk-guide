package com.dotincorp.demoappnew.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
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
import com.dotincorp.demoappnew.ui.theme.BorderGray
import com.dotincorp.demoappnew.ui.theme.CardBackground
import com.dotincorp.demoappnew.ui.theme.LightBlue
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.ui.draw.clip
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.style.TextAlign
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.TextButton
import androidx.compose.material3.OutlinedButton
import com.dotincorp.demoappnew.ui.screens.pop.LanguageGradeSelectDialog
import com.dotincorp.demoappnew.viewModel.ConnectViewModel
import com.dotincorp.sdk_v3.model.DotDevice

@Composable
fun ConnectScreen(onTabChange: (Int) -> Unit, viewModel: ConnectViewModel = viewModel()) {
    val inputText by viewModel.inputText.collectAsStateWithLifecycle()
    val errorMessage by viewModel.errorMessage.collectAsStateWithLifecycle()
    val connectedDevices by viewModel.connectedDevices.collectAsStateWithLifecycle()
    val showBrailleSettingDialog by viewModel.showBrailleSettingDialog.collectAsStateWithLifecycle()

    // 파일 선택을 위한 ActivityResultLauncher
    val filePickerLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.OpenDocument()
    ) { uri ->
        uri?.let { viewModel.handleFileResult(it) }
    }

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

    LanguageGradeSelectDialog(
        showDialog = showBrailleSettingDialog,
        langGradeMap = viewModel.getBrailleLanguages(),
        onDismiss = { viewModel.onBrailleSettingToggle() },
        onConfirm = {
                lang, grade ->
            viewModel.onBrailleSettingToggle()
            viewModel.setBrailleSettings(lang, grade)
        }

    )

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        // 상단 버튼들 - 모드 전환 + 탭 전환
        ConnectControlButtons(
            onTabChange = onTabChange,
            onDisconnect = { viewModel.disconnect() }
        )

        // 연결된 디바이스 목록 및 개별 제어
    ConnectedDevicesCard(
        devices = connectedDevices,
            inputText = inputText,
            onSendText = { device -> viewModel.onCheck(device) },
            onAllUp = { device -> viewModel.allUp(device) },
            onAllDown = { device -> viewModel.allDown(device) },
            onSendSample = { device -> viewModel.sendSampleDtm(device) },
            onDisconnect = { device -> viewModel.disconnect(device) },
            modifier = Modifier.weight(1f)
        )

        // Text 입력 섹션
        TextInputSection(
            inputText = inputText,
            onInputTextChange = { viewModel.onInputTextChange(it) },
            onCheck = { viewModel.onCheck() },
            onBrailleSettingClick = { viewModel.onBrailleSettingToggle() }
        )

        // ALL UP, ALL DOWN 버튼
        AllControlButtons(
            onAllUp = { viewModel.allUp() },
            onAllDown = { viewModel.allDown() }
        )

        // Send Sample DTM 버튼
        SendSampleDtmButton(
            onSampleClick = { viewModel.sendSampleDtm() },
            onFileOpenClick = { filePickerLauncher.launch(arrayOf("application/octet-stream")) }
        )
    }
}

@Composable
fun ConnectControlButtons(
    onTabChange: (Int) -> Unit,
    onDisconnect: () -> Unit
) {
    Column(
        verticalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            // 탭 전환 버튼
            Button(
                onClick = { onTabChange(0) },
                modifier = Modifier
                    .weight(1f)
                    .height(48.dp),
                colors = ButtonDefaults.buttonColors(
                    containerColor = LightBlue
                ),
                shape = RoundedCornerShape(8.dp)
            ) {
                Text(
                    text = "스캔 목록",
                    fontSize = 14.sp,
                    fontWeight = FontWeight.Medium
                )
            }

            Button(
                onClick = onDisconnect,
                modifier = Modifier
                    .weight(1f)
                    .height(48.dp),
                enabled = true, // 항상 활성화 (전체 연결 해제)
                colors = ButtonDefaults.buttonColors(
                    containerColor = LightBlue
                ),
                shape = RoundedCornerShape(8.dp)
            ) {
                Text(
                    text = "DISCONNECT",
                    fontSize = 14.sp,
                    fontWeight = FontWeight.Medium
                )
            }
        }
    }
}

@Composable
fun TextInputSection(
    inputText: String,
    onInputTextChange: (String) -> Unit,
    onCheck:() -> Unit,
    onBrailleSettingClick: () -> Unit
) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        Button(
            onClick = onBrailleSettingClick,
            modifier = Modifier
                .weight(1f)
                .height(48.dp),
            colors = ButtonDefaults.buttonColors(
                containerColor = LightBlue
            ),
            shape = RoundedCornerShape(8.dp)
        ) {
            Text(
                text = "점자 언어 설정",
                fontSize = 14.sp,
                fontWeight = FontWeight.Medium
            )
        }
    }

    Row(
        modifier = Modifier.fillMaxWidth(),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        Text(
            text = "Text",
            fontSize = 16.sp,
            fontWeight = FontWeight.Medium,
            modifier = Modifier.width(60.dp)
        )

        Box(
            modifier = Modifier
                .height(40.dp) // 고정 높이 설정
                .clip(RoundedCornerShape(8.dp))
                .background(Color.White)
                .padding(horizontal = 8.dp) // 전체 여백 조정
                .border(
                    width = 1.dp,
                    color = BorderGray,
                    shape = RoundedCornerShape(8.dp)
                )
                .background(
                    color = Color.White,
                    shape = RoundedCornerShape(8.dp)
                )
                .weight(1f),
            contentAlignment = Alignment.CenterStart
        ) {
            Box(
                modifier = Modifier.padding(start = 4.dp)
            ) {
                // 입력 필드
                BasicTextField(
                    value = inputText,
                    onValueChange = onInputTextChange,
                    singleLine = true,
                    textStyle = TextStyle(
                        fontSize = 14.sp,
                        color = Color.Black,
                        textAlign = TextAlign.Start
                    ),
                    modifier = Modifier
                        .fillMaxWidth() // 전체 너비 사용
                )
            }
        }

        Button(
            onClick = onCheck,
            modifier = Modifier.height(40.dp),
            shape = RoundedCornerShape(8.dp),
            colors = ButtonDefaults.buttonColors(containerColor = LightBlue)
        ) {
            Text(
                text = "CHECK",
                fontSize = 12.sp,
                fontWeight = FontWeight.Medium
            )
        }
    }
}

@Composable
fun AllControlButtons(
    onAllUp: () -> Unit,
    onAllDown: () -> Unit
) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        Button(
            onClick = onAllUp,
            modifier = Modifier
                .weight(1f)
                .height(68.dp),
            colors = ButtonDefaults.buttonColors(containerColor = LightBlue),
            shape = RoundedCornerShape(8.dp)
        ) {
            Text(
                text = "ALL UP",
                fontSize = 14.sp,
                fontWeight = FontWeight.Medium
            )
        }

        Button(
            onClick = onAllDown,
            modifier = Modifier
                .weight(1f)
                .height(68.dp),
            colors = ButtonDefaults.buttonColors(containerColor = LightBlue),
            shape = RoundedCornerShape(8.dp)
        ) {
            Text(
                text = "ALL DOWN",
                fontSize = 14.sp,
                fontWeight = FontWeight.Medium
            )
        }
    }
}

@Composable
fun SendSampleDtmButton(
    onSampleClick: () -> Unit,
    onFileOpenClick: () -> Unit
) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        Button(
            onClick = onSampleClick,
            modifier = Modifier
                .weight(1f)
                .height(68.dp),
            colors = ButtonDefaults.buttonColors(containerColor = LightBlue),
            shape = RoundedCornerShape(8.dp)
        ) {
            Text(
                text = "Send Sample",
                fontSize = 14.sp,
                fontWeight = FontWeight.Medium
            )
        }

        Button(
            onClick = onFileOpenClick,
            modifier = Modifier
                .weight(1f)
                .height(68.dp),
            colors = ButtonDefaults.buttonColors(containerColor = LightBlue),
            shape = RoundedCornerShape(8.dp)
        ) {
            Text(
                text = "FileOpen",
                fontSize = 14.sp,
                fontWeight = FontWeight.Medium
            )
        }
    }
}

@Composable
fun ConnectedDevicesCard(
    devices: List<DotDevice>,
    inputText: String,
    onSendText: (DotDevice) -> Unit,
    onAllUp: (DotDevice) -> Unit,
    onAllDown: (DotDevice) -> Unit,
    onSendSample: (DotDevice) -> Unit,
    onDisconnect: (DotDevice) -> Unit,
    modifier: Modifier = Modifier
) {
    Card(
        modifier = modifier.fillMaxWidth(),
        shape = RoundedCornerShape(8.dp),
        colors = CardDefaults.cardColors(containerColor = CardBackground)
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(8.dp)
        ) {
            Text(
                text = "CONNECTED DEVICES (${devices.size})",
                fontSize = 16.sp,
                fontWeight = FontWeight.Medium,
                modifier = Modifier.padding(bottom = 8.dp)
            )
            
            if (devices.isEmpty()) {
                Text(
                    text = "연결된 디바이스가 없습니다",
                    color = Color.Gray,
                    modifier = Modifier.fillMaxWidth(),
                    style = MaterialTheme.typography.bodyMedium
                )
            } else {
                LazyColumn(
                    modifier = Modifier.fillMaxSize(),
                    verticalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    items(devices) { device ->
                        Card(
                            modifier = Modifier.fillMaxWidth(),
                            shape = RoundedCornerShape(6.dp),
                            colors = CardDefaults.cardColors(containerColor = Color(0xFFEDEDED))
                        ) {
                            Column(Modifier.padding(12.dp)) {
                                Text(
                                    text = device.deviceName.ifEmpty { device.deviceIdentifier },
                                    fontSize = 16.sp,
                                    fontWeight = FontWeight.SemiBold
                                )
                                Text(
                                    text = device.deviceIdentifier,
                                    fontSize = 12.sp, 
                                    color = Color(0xFF666666)
                                )
                                Row(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .padding(top = 8.dp),
                                    horizontalArrangement = Arrangement.spacedBy(4.dp)
                                ) {
                                    OutlinedButton(
                                        onClick = { onSendText(device) },
                                        enabled = inputText.isNotEmpty(),
                                        modifier = Modifier.weight(1f)
                                    ) {
                                        Text("CHECK", fontSize = 10.sp)
                                    }
                                    OutlinedButton(
                                        onClick = { onAllUp(device) },
                                        modifier = Modifier.weight(1f)
                                    ) {
                                        Text("UP", fontSize = 10.sp)
                                    }
                                    OutlinedButton(
                                        onClick = { onAllDown(device) },
                                        modifier = Modifier.weight(1f)
                                    ) {
                                        Text("DOWN", fontSize = 10.sp)
                                    }
                                }
                                Row(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .padding(top = 8.dp),
                                    horizontalArrangement = Arrangement.spacedBy(4.dp)
                                ) {
                                    OutlinedButton(
                                        onClick = { onSendSample(device) },
                                        modifier = Modifier.weight(1f)
                                    ) { 
                                        Text("SAMPLE", fontSize = 10.sp) 
                                    }
                                    OutlinedButton(
                                        onClick = { onDisconnect(device) },
                                        modifier = Modifier.weight(1f)
                                    ) {
                                        Text("DISCONNECT", fontSize = 10.sp)
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}