# DotPad Demo App

DotPadFrameworks SDK를 활용하여 DotPad 점자 디스플레이 기기와 BLE 연결하고, 그래픽/점자 데이터를 출력하는 예제 앱입니다.

---

## 요구사항

- Xcode 15 이상
- iOS 15.0+
- Swift 5.0
- [XcodeGen](https://github.com/yonaskolb/XcodeGen)

---

## 프로젝트 설정

데모 앱은 자체 `Frameworks/` 폴더의 `DotPadFrameworks.xcframework`를 사용합니다.


### 빌드 및 실행

`DotPadDemoApp.xcodeproj`를 Xcode에서 열고 `DotPadDemoApp` 스킴을 선택하여 빌드합니다.

> 시뮬레이터는 BLE를 지원하지 않으므로 실제 iOS 기기에서 실행해야 합니다.

---

## 화면 구성 및 사용법

앱을 실행하면 하나의 메인 화면에 모든 컨트롤이 배치됩니다.

### 1. BLE 연결

| 단계 | 동작 |
|------|------|
| **Start Scan** 버튼 탭 | 주변 DotPad 기기 BLE 스캔 시작 |
| 기기 목록에서 항목 탭 | 해당 기기에 연결 (목록에는 기기명과 RSSI 신호 강도 표시) |
| 연결 완료 | 버튼 텍스트가 **Disconnect**로 변경되고 기기 이름이 자동 조회됨 |
| **Disconnect** 버튼 탭 | 연결 해제, 목록 초기화 |

> 연결 직후 3초 대기 후 자동으로 기기 이름을 요청합니다 (`requestDeviceName()`).  
> 기기 이름에 따라 그래픽/점자 디스플레이 지원 여부가 자동으로 판별됩니다.

### 2. 기기 정보 조회

- **Device Name** 버튼 탭 → 연결된 기기의 이름을 요청하고 옆 텍스트 필드에 표시
- 기기명이 `KM2-20`을 포함하면 → 점자 디스플레이만 활성화
- 기기명이 `DotPad320`을 포함하면 → 그래픽 + 점자 디스플레이 모두 활성화

### 3. 점자 텍스트 출력

1. **Text** 입력 필드에 출력할 텍스트 입력
2. **Display Braille Data** 버튼 탭
3. 텍스트가 점자로 변환되어 DotPad 점자 셀에 표시됨
4. 변환된 점자 문자열이 **Braille Output** 레이블에도 표시됨

### 4. 그래픽 데이터 출력 (DotPad320 전용)

- **Display Graphic Data** 버튼 탭
- 미리 정의된 hex 데이터(600자, 300바이트)가 그래픽 디스플레이로 전송됨
- DotPad320이 아닌 경우 동작하지 않음

### 5. 핀 제어

| 버튼 | 동작 |
|------|------|
| **All Up** | 모든 핀을 올림 (그래픽: `FF` × 300, 점자: `FF` × 20) |
| **All Down** | 모든 핀을 내림 (그래픽/점자 디스플레이 초기화) |

---

## 주요 기능

| 기능 | 설명 |
|------|------|
| BLE 스캔 / 연결 | 주변 DotPad 기기를 스캔하고 선택하여 연결 |
| 기기 정보 조회 | 연결된 기기의 이름 및 타입 확인 |
| 그래픽 데이터 출력 | DotPad320 그래픽 디스플레이에 hex 데이터 전송 |
| 점자 텍스트 출력 | 입력 텍스트를 점자로 변환하여 점자 셀에 표시 |
| 전체 올리기 / 내리기 | 모든 핀을 올리거나 초기화 |

---

## 지원 기기

| 기기 | 그래픽 디스플레이 | 점자 디스플레이 |
|------|:-:|:-:|
| DotPad320 | O | O |
| KM2-20 | - | O |

---

## 코드 구조

```
DotPadDemoApp/
├── AppDelegate.swift         # 앱 진입점
├── SceneDelegate.swift       # 씬 관리
├── ViewController.swift      # 메인 화면 (BLE 연결, 데이터 출력)
├── DotPadSDK.swift           # DotPadAPI 싱글톤 래퍼
├── BLEPeripheralCell.swift   # BLE 기기 목록 셀
└── Base.lproj/
    └── Main.storyboard       # 메인 UI 레이아웃
```

### 핵심 클래스

- **`DotPadSDK`**: `DotPadAPI` 인스턴스를 싱글톤으로 관리하는 래퍼 클래스. 기기 타입 설정(`setDeviceType`) 포함
- **`ViewController`**: `DotDeviceMessage`를 구현하여 기기 이벤트(연결/해제/키 입력 등) 수신. `sdk` 프로퍼티로 SDK 접근 간소화
- **`BLEPeripheralCell`**: BLE 검색 결과 테이블 셀 (기기 이름 + RSSI 신호 강도)

### 콜백 이벤트 (`DotDeviceMessage`)

메시지 이벤트와 키 이벤트가 별도 함수로 분리되어 있습니다.

**`receivedMessageCallBack(_:_:)`** — 연결/상태 이벤트:

| DataCode | 설명 |
|----------|------|
| `Discovery_List` | BLE 스캔 결과 업데이트 |
| `Connected` | 기기 연결 완료 |
| `Disconnected` | 기기 연결 해제 |
| `DeviceName` | 기기 이름/타입 수신 |
| `FirmwareInfo` | 펌웨어 버전 수신 |

**`receivedKeyCallBack(_:_:)`** — 하드웨어 키 입력 이벤트:

| KeyCode | 설명 |
|---------|------|
| `PanningLeft` / `PanningRight` | 패닝 키 |
| `PanningAll` | 양쪽 패닝 동시 (`msg: "PanningAll"` / `"PanningAllLongPress"`) |
| `LPF1` / `RPF4` | 패닝 + 기능키 조합 |
| `KeyFunction1` ~ `KeyFunction4` | 기능키 단독 입력 |
| `KeyFunction12` / `KeyFunction23` / `KeyFunction34` / `KeyFunction13` / `KeyFunction24` | 기능키 동시 입력 |
| `KeyElse` | 그 외 키 조합 (`msg`에 hex 값 포함) |

---

## SDK 연동 요약

데모 앱에서 SDK를 연동하는 최소 흐름입니다:

```swift
// 1. 싱글톤 초기화 및 콜백 델리게이트 등록
sdk.dotPadAPI.setCallBack(dotDeviceMessage: self)

// 2. BLE 스캔
sdk.dotPadAPI.dotPadDeviceScan(isScan: true)

// 3. 기기 연결 (Discovery_List 콜백에서 기기 목록 수신 후)
let devices = sdk.dotPadAPI.getDeviceFiltered()
sdk.dotPadAPI.connectDevice(peripheral: devices[0].remotePeripheral)

// 4-a. 점자 텍스트 출력
sdk.dotPadAPI.displayTextData(text: "Hello")

// 4-b. 그래픽 hex 데이터 출력 (DotPad320)
sdk.dotPadAPI.displayGraphicData(data: hexString)

// 5. 연결 해제
sdk.dotPadAPI.dotPadDisconnect()
```

---
