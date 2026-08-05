package com.dotincorp.demoappnew

import android.Manifest
import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle
import android.util.Log
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.tooling.preview.Preview
import androidx.core.content.ContextCompat
import com.dotincorp.demoappnew.ui.theme.DemoAppTheme
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import com.dotincorp.demoappnew.ui.screens.ConnectScreen
import com.dotincorp.demoappnew.ui.screens.ScanScreen

class MainActivity : ComponentActivity() {
    @OptIn(ExperimentalMaterial3Api::class)
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()

        // 블루투스 권한 확인/요청
        Log.d("MainActivity", "권한 체크: ${hasAllBtPermissions()}")
        Log.d("MainActivity", "필요한 권한: ${requiredBtPermissions().contentToString()}")

        // 각 권한별 상태 로깅
        requiredBtPermissions().forEach { permission ->
            val granted = ContextCompat.checkSelfPermission(this, permission) == PackageManager.PERMISSION_GRANTED
            Log.d("MainActivity", "권한 $permission: ${if (granted) "허용됨" else "거부됨"}")
        }

        if (!hasAllBtPermissions()) {
            Log.d("MainActivity", "권한 요청 시작")
            permissionLauncher.launch(requiredBtPermissions())
        } else {
            Log.d("MainActivity", "모든 권한이 이미 허용됨")
        }

        setContent {
            // 탭 상태 관리
            var currentTab by remember { mutableIntStateOf(0) } // 0: 스캔 목록, 1: 연결된 디바이스

            DemoAppTheme {
                Scaffold(
                    topBar = {
                        TopAppBar(
                            title = { Text("DemoAppNew") }
                        )
                    }
                ) { paddingValues ->
                    Box(modifier = Modifier
                        .fillMaxSize()
                        .padding(paddingValues) // 패딩 적용
                    ) {
                        when (currentTab) {
                            0 -> {
                                ScanScreen({ currentTab = it})
                            }

                            1 -> {
                                ConnectScreen({currentTab = it})
                            }
                        }
                    }
                }
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Preview(showBackground = true)
@Composable
fun GreetingPreview() {
    // 탭 상태 관리
    var currentTab by remember { mutableIntStateOf(0) } // 0: 스캔 목록, 1: 연결된 디바이스

    DemoAppTheme {
        Scaffold(
            topBar = {
                TopAppBar(
                    title = { Text("DemoAppNew") }
                )
            }
        ) { paddingValues ->
            Box(modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues) // 패딩 적용
            ) {
                when (currentTab) {
                    0 -> {
                        ScanScreen({currentTab = it})
                    }

                    1 -> {
                        ConnectScreen({currentTab = it})
                    }
                }
            }
        }
    }
}

private fun MainActivity.requiredBtPermissions(): Array<String> =
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
        arrayOf(
            Manifest.permission.BLUETOOTH_SCAN,
            Manifest.permission.BLUETOOTH_CONNECT,
            Manifest.permission.ACCESS_FINE_LOCATION, // 위치 권한도 필요
            Manifest.permission.READ_EXTERNAL_STORAGE
        )
    } else {
        arrayOf(
            Manifest.permission.ACCESS_FINE_LOCATION,
            Manifest.permission.BLUETOOTH,
            Manifest.permission.BLUETOOTH_ADMIN,
            Manifest.permission.READ_EXTERNAL_STORAGE
        )
    }

private fun MainActivity.hasAllBtPermissions(): Boolean =
    requiredBtPermissions().all {
        ContextCompat.checkSelfPermission(this, it) == PackageManager.PERMISSION_GRANTED
    }

private val MainActivity.permissionLauncher
    get() = registerForActivityResult(
        ActivityResultContracts.RequestMultiplePermissions()
    ) { permissions ->
        Log.d("MainActivity", "권한 요청 결과: $permissions")
        val allGranted = permissions.values.all { it }
        if (allGranted) {
            Log.d("MainActivity", "모든 블루투스 권한이 승인되었습니다")
        } else {
            Log.w("MainActivity", "일부 권한이 거부되었습니다")
            permissions.forEach { (permission, granted) ->
                Log.w("MainActivity", "권한 $permission: ${if (granted) "허용됨" else "거부됨"}")
            }
        }
    }