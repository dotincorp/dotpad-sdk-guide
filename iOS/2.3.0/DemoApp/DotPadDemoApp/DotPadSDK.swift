import Foundation
import DotPadFrameworks

/// DotPadFrameworks SDK 싱글톤 래퍼
/// - `DotPadAPI` 인스턴스를 중앙 관리
/// - 연결된 기기 타입(DotPad320/832/300) 설정
class DotPadSDK {

    /// 싱글톤 인스턴스
    static let shared = DotPadSDK()

    /// SDK 진입점 (BLE 통신, 데이터 처리, 점자 변환)
    let dotPadAPI: DotPadFrameworks.DotPadAPI = DotPadFrameworks.DotPadAPI()

    /// 연결된 기기 이름
    var deviceName: String = ""

    /// 현재 기기 모델 (외부에서 setDeviceType으로만 변경)
    private(set) var dotPad: DotPad = DotPad(deviceType: .DotPad320)

    /// 기기 타입 설정 (DotPad320, DotPad832, DotPad300)
    func setDeviceType(_ deviceType: DeviceType) {
        print("[DotPadSDK] setDeviceType : \(deviceType)")
        dotPad = DotPad(deviceType: deviceType)
    }

    private init() { }
}
