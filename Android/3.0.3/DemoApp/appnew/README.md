# DotPad Demo App (Android)

DotPadFrameworks SDK를 활용하여 DotPad 점자 디스플레이 기기와 BLE/USB 연결하고, 그래픽/점자 데이터를 출력하는 예제 앱입니다.

- **패키지명**: `com.dotincorp.demoappnew`
- **iOS 대응**: `dot-demo-ios/DotPadDemoApp`

---

## 요구사항

- Android Studio Ladybug 이상
- JDK 17
- Android SDK 26+ (Min SDK 26)
- BLE 지원 Android 기기 (에뮬레이터는 BLE 미지원)

---

## 빌드 및 실행

```bash
cd DemoApp
./gradlew :appnew:assembleDebug

# 테스트
./gradlew :appnew:testDebugUnitTest
```

또는 Android Studio에서 `appnew` 모듈 선택 후 실행합니다.

> BLE는 실제 Android 기기에서만 동작합니다. 에뮬레이터에서는 스캔/연결이 불가합니다.

---

## 화면 구성 및 사용법

앱은 두 개 탭으로 구성됩니다: **스캔 화면**과 **연결 화면**.

### 1. 스캔 화면 (ScanScreen)

| 단계 | 동작 |
|------|------|
| BLE/USB 모드 전환 | 상단 **BLE** / **USB** 버튼으로 연결 모드 선택 |
| **START SCAN** 버튼 탭 | 주변 DotPad 기기 스캔 시작 (버튼이 **STOP SCAN**으로 변경) |
| 기기 목록에서 항목 탭 | 해당 기기에 연결 (기기명과 MAC 주소 표시) |
| 연결 완료 | 기기 항목에 "연결됨" 표시, 자동으로 기기 정보 조회 |
| **연결된 목록** 버튼 탭 | 연결 화면으로 이동 |

> 앱 시작 시 블루투스 권한을 자동으로 요청합니다.
> Android 12(S) 이상: `BLUETOOTH_SCAN`, `BLUETOOTH_CONNECT`, `ACCESS_FINE_LOCATION`
> Android 11 이하: `BLUETOOTH`, `BLUETOOTH_ADMIN`, `ACCESS_FINE_LOCATION`

### 2. 연결 화면 (ConnectScreen)

연결된 모든 기기를 카드 형태로 표시하며, 각 기기별로 독립 제어가 가능합니다.

#### 개별 기기 제어 버튼

| 버튼 | 동작 |
|------|------|
| **CHECK** | 입력된 텍스트를 해당 기기에 점자로 전송 |
| **UP** | 해당 기기의 모든 핀 올리기 |
| **DOWN** | 해당 기기의 모든 핀 내리기 |
| **SAMPLE** | 해당 기기에 샘플 그래픽 데이터 전송 |
| **DISCONNECT** | 해당 기기 연결 해제 |

#### 전체 기기 공통 버튼

| 버튼 | 동작 |
|------|------|
| **점자 언어 설정** | 점자 변환 언어/등급 선택 다이얼로그 |
| **Text** 입력 + **CHECK** | 입력 텍스트를 점자로 변환하여 모든 연결 기기에 전송 |
| **ALL UP** | 모든 기기의 모든 핀 올리기 (그래픽: `FF` × 300, 점자: `FF` × 20) |
| **ALL DOWN** | 모든 기기의 모든 핀 내리기 (그래픽/점자 디스플레이 초기화) |
| **Send Sample** | 모든 기기에 샘플 그래픽 hex 데이터 전송 |
| **FileOpen** | DTMS JSON 파일을 열어 그래픽+점자 데이터를 기기에 전송 |

#### 점자 페이지 네비게이션

텍스트가 점자로 변환된 후, DotPad 하드웨어 키로 페이지를 넘길 수 있습니다:
- **Panning Left**: 점자 텍스트 이전 페이지
- **Panning Right**: 점자 텍스트 다음 페이지
- **F3 키**: DTMS 파일 이전 페이지
- **F4 키**: DTMS 파일 다음 페이지

---

## 주요 기능

| 기능 | 설명 |
|------|------|
| BLE/USB 스캔 | 주변 DotPad 기기를 BLE 또는 USB로 스캔 |
| 멀티 디바이스 연결 | 여러 DotPad 기기 동시 연결 및 개별 제어 |
| 그래픽 데이터 출력 | DotPad320 그래픽 디스플레이에 hex 데이터 전송 |
| 점자 텍스트 출력 | 입력 텍스트를 점자로 변환하여 점자 셀에 표시 |
| 점자 언어 설정 | 점자 변환 언어 및 등급 선택 |
| 전체 올리기 / 내리기 | 모든 핀을 올리거나 초기화 |
| DTMS 파일 열기 | JSON 파일에서 그래픽+점자 데이터 로드 |
| 페이지 네비게이션 | 점자 텍스트/DTMS 파일 페이지 이동 (하드웨어 키) |

---

## 지원 기기

| 기기 | 그래픽 디스플레이 | 점자 디스플레이 |
|------|:-:|:-:|
| DotPad320 | O | O |
| KM2-20 | - | O |

---

## 코드 구조

```
appnew/src/main/java/com/dotincorp/demoappnew/
├── AppAplication.kt              Application (Timber 초기화)
├── MainActivity.kt               메인 Activity (권한 요청, 탭 관리)
├── ui/
│   ├── screens/
│   │   ├── ScanScreen.kt         BLE/USB 스캔 화면
│   │   ├── ConnectScreen.kt      연결된 기기 제어 화면
│   │   └── pop/
│   │       └── BrailleSelectDialog.kt  점자 언어/등급 선택 다이얼로그
│   └── theme/                    Material3 테마
└── viewModel/
    ├── ScanViewModel.kt          스캔 상태, BLE/USB 모드 전환, 기기 연결
    └── ConnectViewModel.kt       연결 기기 관리, 데이터 전송, 페이지 네비게이션
```

### 핵심 클래스

- **`ScanViewModel`**: BLE/USB 모드 전환, 스캔 시작/중지, 기기 연결
- **`ConnectViewModel`**: `DotDeviceMessage` 콜백으로 연결/해제 이벤트 수신, 텍스트/그래픽 전송, DTMS 파일 처리

### 콜백 이벤트 (`DotDeviceMessage`)

`ConnectViewModel`에서 아래 콜백을 처리합니다:

| 콜백 | DataCode/KeyCode | 설명 |
|------|-----------------|------|
| `receivedMessageCallBackWithDevice` | `Connected` | 기기 연결 완료, D2 자동 재출력 설정 |
| | `Disconnected` / `Reconnecting` | 기기 해제, 점자 데이터 정리 |
| `receivedKeyCallBack` | `PanningLeft` / `PanningRight` | 점자 텍스트 이전/다음 페이지 |
| | `KeyFunction3` / `KeyFunction4` | DTMS 파일 이전/다음 페이지 |
| `receivedErrorCallback` | 각종 에러 | 에러 로깅 |

---

## SDK 연동 요약

데모 앱에서 SDK를 연동하는 최소 흐름입니다:

```kotlin
// 1. 콜백 등록
DotPadProcess.setCallBack(object : DotDeviceMessage {
    override fun receivedMessageCallBackWithDevice(device, dataCode, msg) { ... }
    override fun receivedKeyCallBack(device, keyCode, msg) { ... }
    override fun receivedErrorCallback(errorCode, msg) { ... }
})

// 2. BLE 스캔
DotPadProcess.scanner?.startBleScan()

// 3. 기기 연결 (스캔 결과에서 BluetoothDevice 선택)
DotPadProcess.connect(bluetoothDevice)

// 4-a. 점자 텍스트 출력 (콜백으로 변환 결과 수신)
DotPadProcess.displayTextData("Hello") { device, brailleHex ->
    // brailleHex: 변환된 점자 hex 문자열
}

// 4-b. 그래픽 hex 데이터 출력 (DotPad320)
DotPadProcess.displayGraphicData(hexString)

// 4-c. 전체 핀 올리기/내리기
DotPadProcess.displayAllUp()
DotPadProcess.displayAllDown()

// 5. 점자 언어 설정
val languages = DotPadProcess.getBrailleLanguages()  // Map<String, List<String>>
DotPadProcess.setBrailleLanguages("ko", "grade1")

// 6. 연결 해제
DotPadProcess.disconnect()
```

---

## 트러블슈팅

| 증상 | 원인 및 해결 |
|------|-------------|
| 빌드 오류: SDK 모듈 없음 | `settings.gradle.kts`에서 `:DotPadFrameworks` 모듈 포함 확인 |
| 기기가 스캔되지 않음 | 블루투스 ON 확인, 위치 권한 허용 확인, 실제 기기에서 실행 |
| 연결 후 기기 이름이 표시 안 됨 | GATT 연결 → 서비스 검색 → DeviceName 순서로 수신 — 잠시 대기 |
| 그래픽 데이터가 전송 안 됨 | DotPad320 전용 기능 — 기기 타입 확인 |
| 에뮬레이터에서 동작 안 함 | BLE는 실제 Android 기기에서만 동작 |
| 권한 팝업이 나오지 않음 | 이전에 "다시 묻지 않음" 선택 → 설정 > 앱 > 권한에서 수동 허용 |
| USB 기기가 감지되지 않음 | OTG 지원 기기인지 확인, USB 케이블 연결 상태 확인 |

---

## 의존성

- `DotPadFrameworks` — 프로젝트 내 SDK 모듈 (`implementation(project(":DotPadFrameworks"))`)
