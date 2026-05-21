import UIKit
import DotPadFrameworks

/// DotPadFrameworks SDK 데모 메인 화면
/// - BLE 기기 스캔/연결/해제
/// - 그래픽/점자 데이터 전송
/// - Function Key 수신
class ViewController: UIViewController, DotPadFrameworks.DotDeviceMessage {

    // MARK: - IBOutlets

    /// BLE 스캔/해제 버튼 ("Start Scan" ↔ "Disconnect")
    @IBOutlet weak var BLEButton: UIButton!
    /// BLE 검색된 기기 목록 테이블
    @IBOutlet var tableView: UITableView!
    /// 연결된 기기 이름 표시 (읽기 전용)
    @IBOutlet weak var padInfoTextField: UITextField!
    /// 점자 변환할 텍스트 입력 필드
    @IBOutlet weak var padTextField: UITextField!
    /// 점자 변환 결과 표시 레이블
    @IBOutlet var BrailleString: UILabel!

    // MARK: - Properties

    /// BLE 검색 결과 목록 (변경 시 테이블 자동 갱신)
    var discoveries = [BKDiscovery]() {
        didSet { tableView.reloadData() }
    }

    /// 연결된 기기의 그래픽 디스플레이 지원 여부 (DotPad320)
    var isGraphicDisplay = false
    /// 연결된 기기의 점자 디스플레이 지원 여부 (KM2-20, DotPad320)
    var isBrailleDisplay = false

    /// DotPadSDK 싱글톤 접근 단축 프로퍼티
    private var sdk: DotPadSDK { DotPadSDK.shared }

    // MARK: - Lifecycle

    override func viewDidLoad() {
        super.viewDidLoad()
        // SDK 콜백 델리게이트 등록
        sdk.dotPadAPI.setCallBack(dotDeviceMessage: self)
        BrailleString.text = ""
        tableView.delegate = self
        tableView.dataSource = self
    }

    // MARK: - Logging

    /// 타임스탬프 + 함수명 로그 출력
    func LogMessage(functionName: String = #function) {
        print("[\(Date())][\(functionName)]")
    }

    /// 타임스탬프 + 함수명 + 메시지 로그 출력
    func LogMessage(functionName: String = #function, _ message: Any) {
        print("[\(Date())][\(functionName)] \(message)")
    }

    // MARK: - DotDeviceMessage

    /// SDK 장치 메시지 콜백
    /// - Parameters:
    ///   - dataCode: 이벤트 종류 (Discovery_List, Connected, Disconnected, DeviceName, FirmwareInfo)
    ///   - msg: 이벤트 데이터 문자열
    func receivedMessageCallBack(_ dataCode: DotPadFrameworks.DataCodes, _ msg: String) {
        DispatchQueue.main.async { [weak self] in
            guard let self else { return }
            switch dataCode {
            case .Discovery_List:
                // BLE 스캔 결과 수신 → 테이블 갱신
                padInfoTextField.text = ""
                discoveries = sdk.dotPadAPI.getDeviceFiltered()

            case .Connected:
                // 기기 연결 완료 → 3초 후 기기 정보 요청 (기기 초기화 대기)
                BLEButton.setTitle("Disconnect", for: .normal)
                DispatchQueue.main.asyncAfter(deadline: .now() + 3) { [weak self] in
                    self?.getDeviceInfo(self as Any)
                }

            case .Disconnected:
                // 기기 연결 해제 → UI 초기화
                padInfoTextField.text = ""
                discoveries.removeAll()
                BLEButton.setTitle("Start Scan", for: .normal)

            case .DeviceName:
                // 기기 이름으로 디스플레이 타입 판별
                if msg.contains("KM2-20") {
                    isGraphicDisplay = false
                    isBrailleDisplay = true
                } else if msg.contains("DotPad320") {
                    isGraphicDisplay = true
                    isBrailleDisplay = true
                }
                padInfoTextField.text = msg

            case .FirmwareInfo:
                LogMessage("FirmwareInfo: \(msg)")
            }
        }
    }

    /// SDK 키 입력 콜백
    /// - Parameters:
    ///   - keyCode: 키 종류 (KeyFunction1~4, Panning, LPF1, RPF4 등)
    ///   - msg: 키 데이터 문자열
    func receivedKeyCallBack(_ keyCode: DotPadFrameworks.KeyCodes, _ msg: String) {
        LogMessage("KeyCode: \(keyCode), msg: \(msg)")
    }

    // MARK: - IBActions

    /// BLE 스캔 시작 또는 연결 해제
    @IBAction func startScan(_ sender: Any) {
        if sdk.dotPadAPI.isDeviceConnect() {
            LogMessage("Disconnect")
            sdk.dotPadAPI.dotPadDisconnect()
            sdk.dotPadAPI.dotPadDeviceScan(isScan: false)
        } else {
            LogMessage("Start Scan")
            sdk.dotPadAPI.dotPadDeviceScan(isScan: true)
        }
    }

    /// 모든 핀 올림 (그래픽: FF×300, 점자: FF×20)
    @IBAction func allUp(_ sender: Any) {
        LogMessage()
        if isGraphicDisplay {
            sdk.dotPadAPI.displayGraphicData(data: String(repeating: "FF", count: 300))
        }
        if isBrailleDisplay {
            sdk.dotPadAPI.displayTextData(brailleString: String(repeating: "FF", count: 20))
        }
    }

    /// 모든 핀 내림 (디스플레이 초기화)
    @IBAction func allDown(_ sender: Any) {
        LogMessage()
        if isGraphicDisplay {
            sdk.dotPadAPI.resetGraphicDisplay()
        }
        if isBrailleDisplay {
            sdk.dotPadAPI.resetBrailleDisplay()
        }
    }

    /// 연결된 기기의 이름 요청
    @IBAction func getDeviceInfo(_ sender: Any) {
        LogMessage()
        sdk.dotPadAPI.requestDeviceName()
    }

    /// 하드코딩된 300바이트 그래픽 데이터를 닷패드에 전송 (DotPad320 전용)
    @IBAction func displayGraphicData(_ sender: Any) {
        LogMessage()
        guard isGraphicDisplay else { return }

        let graphicDataStr = "0000000000000000000000000000000000000000000000000000000000000000000000CCEE0E00000000000000000000000000000000000000000000000000000010FF0F00000000000000000000000000000000880800808800000000888888FF0F0000000000000000C0CC0000000000003303003033000080FE7F33F7FF0F00C0FE7FF7EF0C00F7FF77770000000088080080880000F0FF000000FF0F00FF1F0000F1FF00F0FF00000000000033030030330000F0FF8C00C8FF0F00F7CF0880FC7F00F0FF080000000000880800808800000073777777777707103377773301003077777700000000330300303300000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000"
        sdk.dotPadAPI.displayGraphicData(data: graphicDataStr)
    }

    /// 텍스트 입력 → 점자 변환 → 닷패드 전송 및 결과 표시
    @IBAction func displayBrailleData(_ sender: Any) {
        guard let text = padTextField.text else { return }
        BrailleString.text = sdk.dotPadAPI.displayTextData(text: text)
    }
}

// MARK: - UITableViewDelegate & DataSource

extension ViewController: UITableViewDelegate {
    /// 기기 선택 시 BLE 연결 시도
    func tableView(_ tableView: UITableView, didSelectRowAt indexPath: IndexPath) {
        LogMessage("Tapped \(indexPath.row)")
        sdk.dotPadAPI.connectDevice(peripheral: discoveries[indexPath.row].remotePeripheral)
    }
}

extension ViewController: UITableViewDataSource {
    func tableView(_ tableView: UITableView, numberOfRowsInSection section: Int) -> Int {
        discoveries.count
    }

    /// BLE 기기 셀 구성 (기기 이름 + RSSI 신호 강도)
    func tableView(_ tableView: UITableView, cellForRowAt indexPath: IndexPath) -> UITableViewCell {
        let cell = tableView.dequeueReusableCell(withIdentifier: "cell", for: indexPath) as! BLEPeripheralCell
        cell.DeviceName.text = discoveries[indexPath.row].localName ?? "No Name"
        cell.RSSI.text = String(discoveries[indexPath.row].RSSI)
        return cell
    }
}
