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
    /// "All Down" 버튼 (점역 샘플 버튼을 오른쪽 빈 공간에 배치하기 위한 위치 기준)
    @IBOutlet weak var allDownButton: UIButton!

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

    /// 기기 연결 없이 translateText 결과를 표시할 레이블 (코드로 추가, 스토리보드 미사용)
    private var translateOnlyResultLabel: UILabel?
    /// translateText 테스트용 입력 필드 (팝업 내부, 스토리보드 미사용)
    private var translateOnlyTextField: UITextField?
    /// translateText 언어 설정 테스트용 세그먼트 (English/Korean/Japanese)
    private var languageSegmentedControl: UISegmentedControl?
    /// translateText 등급 설정 테스트용 세그먼트 (Grade1/Grade2)
    private var gradeSegmentedControl: UISegmentedControl?
    /// translateText 워드랩 셀 개수 설정 테스트용 세그먼트 (10/20/30)
    private var cellCountSegmentedControl: UISegmentedControl?
    /// translateText 팝업의 카드 뷰 (바깥 영역 탭 감지 시 카드 영역 판별용)
    private weak var translateCardView: UIView?

    // MARK: - Lifecycle

    override func viewDidLoad() {
        super.viewDidLoad()
        // SDK 콜백 델리게이트 등록
        sdk.dotPadAPI.setCallBack(dotDeviceMessage: self)
        BrailleString.text = ""
        tableView.delegate = self
        tableView.dataSource = self
        setupTranslateOnlyTestUI()
    }

    /// `DotPadAPI.translateText` 사용 예시 진입 버튼을 "All Down" 오른쪽 빈 공간에 배치 (기기 연결 불필요)
    /// 입력 필드/옵션 세그먼트/번역 버튼/결과 레이블은 `presentTranslateOptions(_:)`에서
    /// 화면 가운데 팝업으로 띄운다.
    private func setupTranslateOnlyTestUI() {
        let button = UIButton(type: .system)
        button.translatesAutoresizingMaskIntoConstraints = false
        var config = UIButton.Configuration.plain()
        config.title = "Translate"
        config.background.backgroundColor = .secondarySystemBackground
        button.configuration = config
        button.addTarget(self, action: #selector(presentTranslateOptions(_:)), for: .touchUpInside)
        view.addSubview(button)

        NSLayoutConstraint.activate([
            button.leadingAnchor.constraint(equalTo: allDownButton.trailingAnchor, constant: 20),
            button.centerYAnchor.constraint(equalTo: allDownButton.centerYAnchor)
        ])
    }

    /// translateText 입력 필드, 옵션(언어/등급/워드랩 셀 개수), 번역 실행 버튼, 결과 레이블을
    /// 화면 가운데 팝업으로 띄운다. 메인 화면의 `padTextField`와는 별개의 입력 필드를 사용한다.
    /// `.formSheet`는 iPhone(거의 풀스크린)과 iPad(고정된 작은 박스)에서 보이는 크기가 서로 달라지므로,
    /// 기기 크기와 무관하게 항상 동일한 폭(340pt)의 카드가 화면 정중앙에 뜨도록 직접 구성한다.
    @objc private func presentTranslateOptions(_ sender: Any) {
        let popup = UIViewController()
        popup.view.backgroundColor = UIColor.black.withAlphaComponent(0.4)
        popup.modalPresentationStyle = .overFullScreen
        popup.modalTransitionStyle = .crossDissolve

        let cardView = UIView()
        cardView.translatesAutoresizingMaskIntoConstraints = false
        cardView.backgroundColor = .systemBackground
        cardView.layer.cornerRadius = 16
        cardView.layer.masksToBounds = true
        popup.view.addSubview(cardView)
        translateCardView = cardView

        // 카드 바깥 영역을 탭하면 팝업을 닫는다. cancelsTouchesInView=false로 카드 내부 컨트롤의 터치는 그대로 전달한다.
        let backgroundTapGesture = UITapGestureRecognizer(target: self, action: #selector(dismissTranslateOptionsIfBackgroundTapped(_:)))
        backgroundTapGesture.cancelsTouchesInView = false
        popup.view.addGestureRecognizer(backgroundTapGesture)

        let closeButton = UIButton(type: .system)
        closeButton.translatesAutoresizingMaskIntoConstraints = false
        closeButton.setTitle("Close", for: .normal)
        closeButton.contentHorizontalAlignment = .right
        closeButton.addTarget(self, action: #selector(dismissTranslateOptions), for: .touchUpInside)

        let titleLabel = UILabel()
        titleLabel.translatesAutoresizingMaskIntoConstraints = false
        titleLabel.text = "Translate Text Sample\n(No Device Required)"
        titleLabel.font = .boldSystemFont(ofSize: 17)
        titleLabel.numberOfLines = 0

        let textField = UITextField()
        textField.translatesAutoresizingMaskIntoConstraints = false
        textField.borderStyle = .roundedRect
        textField.placeholder = "Text to translate"
        textField.text = translateOnlyTextField?.text

        let languageSegment = UISegmentedControl(items: ["English", "Korean", "Japanese"])
        languageSegment.translatesAutoresizingMaskIntoConstraints = false
        languageSegment.selectedSegmentIndex = languageSegmentedControl?.selectedSegmentIndex ?? 0
        languageSegment.addTarget(self, action: #selector(translateSettingChanged(_:)), for: .valueChanged)

        let gradeSegment = UISegmentedControl(items: ["Grade1", "Grade2"])
        gradeSegment.translatesAutoresizingMaskIntoConstraints = false
        gradeSegment.selectedSegmentIndex = gradeSegmentedControl?.selectedSegmentIndex ?? 1
        gradeSegment.addTarget(self, action: #selector(translateSettingChanged(_:)), for: .valueChanged)

        let cellCountSegment = UISegmentedControl(items: ["10 cells", "20 cells", "30 cells"])
        cellCountSegment.translatesAutoresizingMaskIntoConstraints = false
        cellCountSegment.selectedSegmentIndex = cellCountSegmentedControl?.selectedSegmentIndex ?? 1
        cellCountSegment.addTarget(self, action: #selector(translateSettingChanged(_:)), for: .valueChanged)

        let translateButton = UIButton(type: .system)
        translateButton.translatesAutoresizingMaskIntoConstraints = false
        var translateConfig = UIButton.Configuration.plain()
        translateConfig.title = "Translate Text (No Device)"
        translateConfig.background.backgroundColor = .secondarySystemBackground
        translateButton.configuration = translateConfig
        translateButton.addTarget(self, action: #selector(translateTextOnly(_:)), for: .touchUpInside)

        let resultLabel = UILabel()
        resultLabel.translatesAutoresizingMaskIntoConstraints = false
        resultLabel.numberOfLines = 0
        resultLabel.font = .systemFont(ofSize: 14)
        resultLabel.text = translateOnlyResultLabel?.text ?? ""

        let stackView = UIStackView(arrangedSubviews: [closeButton, titleLabel, textField, languageSegment, gradeSegment, cellCountSegment, translateButton, resultLabel])
        stackView.translatesAutoresizingMaskIntoConstraints = false
        stackView.axis = .vertical
        stackView.spacing = 12
        stackView.setCustomSpacing(4, after: closeButton)
        cardView.addSubview(stackView)

        // 기기 크기와 무관하게 항상 동일한 폭(340pt)의 카드를 화면 정중앙에 배치 (아주 좁은 화면에서만 여백 확보를 위해 축소)
        let cardWidthConstraint = cardView.widthAnchor.constraint(equalToConstant: 340)
        cardWidthConstraint.priority = .defaultHigh
        NSLayoutConstraint.activate([
            cardView.centerXAnchor.constraint(equalTo: popup.view.centerXAnchor),
            cardView.centerYAnchor.constraint(equalTo: popup.view.centerYAnchor),
            cardWidthConstraint,
            cardView.leadingAnchor.constraint(greaterThanOrEqualTo: popup.view.safeAreaLayoutGuide.leadingAnchor, constant: 20),
            cardView.trailingAnchor.constraint(lessThanOrEqualTo: popup.view.safeAreaLayoutGuide.trailingAnchor, constant: -20),
            cardView.topAnchor.constraint(greaterThanOrEqualTo: popup.view.safeAreaLayoutGuide.topAnchor, constant: 20),
            cardView.bottomAnchor.constraint(lessThanOrEqualTo: popup.view.safeAreaLayoutGuide.bottomAnchor, constant: -20),

            stackView.topAnchor.constraint(equalTo: cardView.topAnchor, constant: 20),
            stackView.leadingAnchor.constraint(equalTo: cardView.leadingAnchor, constant: 20),
            stackView.trailingAnchor.constraint(equalTo: cardView.trailingAnchor, constant: -20),
            stackView.bottomAnchor.constraint(equalTo: cardView.bottomAnchor, constant: -20)
        ])

        // translateSettingChanged/translateTextOnly가 팝업 내부의 컨트롤을 참조하도록 갱신
        translateOnlyTextField = textField
        translateOnlyResultLabel = resultLabel
        languageSegmentedControl = languageSegment
        gradeSegmentedControl = gradeSegment
        cellCountSegmentedControl = cellCountSegment

        present(popup, animated: true)
    }

    /// translateText 팝업 닫기
    @objc private func dismissTranslateOptions() {
        dismiss(animated: true)
    }

    /// translateText 팝업의 카드 바깥 영역을 탭했을 때만 팝업을 닫는다.
    @objc private func dismissTranslateOptionsIfBackgroundTapped(_ gesture: UITapGestureRecognizer) {
        guard let popupView = gesture.view, let cardView = translateCardView else { return }
        let location = gesture.location(in: popupView)
        if !cardView.frame.contains(location) {
            dismiss(animated: true)
        }
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
                
            default:
                break
            }
        }
    }

    /// SDK 키 입력 콜백
    /// - Parameters:
    ///   - keyCode: 키 종류 (KeyFunction1~4, Panning, LPF1, RPF4 등)
    ///   - msg: 키 데이터 문자열
    func receivedKeyCallBack(_ keyCode: DotPadFrameworks.KeyCodes, _ msg: String) {
        LogMessage("KeyCode: \(keyCode), msg: \(msg)")
        switch keyCode {
        case .KeyFunction1:
            // 진동 사용 예시: onMs 동안 켜짐 → offMs 동안 꺼짐을 repeatCount번 반복
            sdk.dotPadAPI.requestVibrator(onMs: 100, offMs: 70, repeatCount: 5)
        case .KeyFunction2:
            break
        case .KeyFunction3:
            break
        case .KeyFunction4:
            break
        case .KeyFunction12:
            break
        case .KeyFunction13:
            break
        case .KeyFunction23:
            break
        case .KeyFunction24:
            break
        case .KeyFunction34:
            break
        case .KeyElse:
            break
        case .PanningAll:
            break
        case .PanningLeft:
            break
        case .PanningRight:
            break
        case .LPF1:
            break
        case .RPF4:
            break
        @unknown default:
            break
        }
    }
    
    func onKeyDown(key: DotPadKey, dotKeyBinary: String) {
        LogMessage("onKeyDown: \(key), msg: \(dotKeyBinary)")
    }
    
    func onKeyUp(key: DotPadKey, dotKeyBinary: String) {
        LogMessage("onKeyUp: \(key), msg: \(dotKeyBinary)")
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

    /// 텍스트 입력 → 점자 변환(비동기, .Dot 엔진 + 일본어면 원격 API 사용) → 닷패드 전송 및 결과 표시
    @IBAction func displayBrailleData(_ sender: Any) {
        guard let text = padTextField.text else { return }
        sdk.dotPadAPI.displayTextData(text: text) { [weak self] brailleUnicode in
            DispatchQueue.main.async {
                self?.BrailleString.text = brailleUnicode
            }
        }
    }

    /// 언어/등급/워드랩 셀 개수 세그먼트 변경 시 SDK 설정을 반영하고, 결과 비교를 위해 translateText를 재실행
    /// 언어를 Japanese로 선택하면(.Dot 엔진 고정) translateText/displayTextData(text:completion:)가
    /// 로컬 변환 대신 원격 점역 API(JapaneseTranslateAPI)를 사용하는 것을 확인할 수 있다.
    @objc func translateSettingChanged(_ sender: Any) {
        let language: LanguageCode
        switch languageSegmentedControl?.selectedSegmentIndex {
        case 1: language = .Korean
        case 2: language = .Japanese
        default: language = .English
        }
        let grade: GradeOption = gradeSegmentedControl?.selectedSegmentIndex == 0 ? .Grade1 : .Grade2
        let cellCounts: [Int32] = [10, 20, 30]
        let cellCount = cellCounts[cellCountSegmentedControl?.selectedSegmentIndex ?? 1]

        sdk.dotPadAPI.setupBrailleLanguage(translateEngine: .Dot, pinOption: nil, brailleLanguage: language.rawValue)
        sdk.dotPadAPI.setBrailleLanguageGrade(gradeValue: Int(grade.rawValue))
        sdk.dotPadAPI.setNumberOfBraillePerLine(cellCount)
        LogMessage(functionName: "translateSettingChanged", "language: \(language), grade: \(grade), cellCount: \(cellCount)")

        translateTextOnly(sender)
    }

    /// 기기 연결 없이 텍스트 입력 → 점자 hex 변환 결과만 콜백으로 확인
    @objc func translateTextOnly(_ sender: Any) {
        guard let text = translateOnlyTextField?.text, !text.isEmpty else { return }
        sdk.dotPadAPI.translateText(text) { [weak self] hexString in
            DispatchQueue.main.async {
                self?.translateOnlyResultLabel?.text = "Hex: \(hexString)"
                self?.LogMessage(functionName: "translateText(no device) result", hexString)
            }
        }
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
