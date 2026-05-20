import UIKit

/// BLE 기기 검색 결과 테이블 셀 (기기 이름 + RSSI 신호 강도)
class BLEPeripheralCell: UITableViewCell {

    /// 기기 이름 레이블
    @IBOutlet weak var DeviceName: UILabel!
    /// 신호 강도(RSSI) 레이블
    @IBOutlet weak var RSSI: UILabel!
}
