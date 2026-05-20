import UIKit
import Foundation
import DotPadFrameworks
import Accessibility

class ViewController: UIViewController, DotPadFrameworks.SendDataProtocol {
    
    public var discoveries = [BKDiscovery]() {
        didSet {
            tableView.reloadData()
        }
    }
    
    @IBOutlet weak var BLEButton: UIButton!
    @IBOutlet var tableView: UITableView!
    @IBOutlet weak var padInfoTextField: UITextField!
    @IBOutlet weak var padTextField: UITextField!
    @IBOutlet var BrailleString: UILabel!
    
    @IBOutlet weak var testView: UIView!
    @IBOutlet weak var buttonTest: UIButton!
    
    var isGraphicDisplay: Bool = false
    var isBrailleDisplay: Bool = false
    
    override func viewDidLoad() {
        super.viewDidLoad()
        DotPadSDK.shared.dotPadAPI.dotPadCommunication.delegate_SDP = self
        BrailleString.text = ""
        tableView.delegate = self
        tableView.dataSource = self
    }

    func LogMessage(functionName: String = #function) {
        print("[\(Date())][\(functionName)]")
    }
    
    func LogMessage(functionName: String = #function, _ message: Any) {
        print("[\(Date())][\(functionName)] \(message)")
    }
    
    // dotpad callback function
    func sendDataFunc(_ dataCode: DotPadFrameworks.DotPadCommunication.DataCodes, _ dataStr: String) {
        switch dataCode {
        case DotPadFrameworks.DotPadCommunication.DataCodes.Discovery_List:
            padInfoTextField.text = ""
            discoveries = DotPadSDK.shared.dotPadAPI.dotPadCommunication.discoveries_filtered
        case DotPadFrameworks.DotPadCommunication.DataCodes.Connected:
            BLEButton.setTitle("Disconnect", for: .normal)
            do { sleep(3) }
            getDeviceInfo(self)
        case DotPadFrameworks.DotPadCommunication.DataCodes.Disconnected:
            padInfoTextField.text = ""
            discoveries.removeAll()
            BLEButton.setTitle("Start Scan", for: .normal)
        case DotPadFrameworks.DotPadCommunication.DataCodes.DeviceName:
            let deviceName = dataStr
            if deviceName.contains("KM2-20") {
                isGraphicDisplay = false
                isBrailleDisplay = true
            } else if deviceName.contains("DotPad320") {
                isGraphicDisplay = true
                isBrailleDisplay = true
            }
            padInfoTextField.text = dataStr
        case DotPadFrameworks.DotPadCommunication.DataCodes.KeyFunction1:
            LogMessage("Key Function1 from framework")
            let dotDataBoolean: Array<Array<Bool>> = DotPadSDK.shared.dotPadAPI.dotPadProcessData.getDotDataBooleanCurrentDTMSItem()
            //LogMessage(dotDataBoolean)
            let itemInfo: (Int, Int) = DotPadSDK.shared.dotPadAPI.dotPadProcessData.getDTMSItemIdxInfo()
            LogMessage(itemInfo)
        case DotPadFrameworks.DotPadCommunication.DataCodes.KeyFunction2:
            LogMessage("Key Function2 from framework")
            let dotDataBoolean: Array<Array<Bool>> = DotPadSDK.shared.dotPadAPI.dotPadProcessData.getDotDataBooleanCurrentDTMSItem()
            //LogMessage(dotDataBoolean)
            let itemInfo: (Int, Int) = DotPadSDK.shared.dotPadAPI.dotPadProcessData.getDTMSItemIdxInfo()
            LogMessage(itemInfo)
        default:
            break
        }
    }

    // scan device
    @IBAction func startScan(_ sender: Any) {
        if (DotPadSDK.shared.dotPadAPI.dotPadCommunication.isConnect() == false) {
            LogMessage("Start Scan")
            DotPadSDK.shared.dotPadAPI.dotPadCommunication.scan()
        }
        else if (DotPadSDK.shared.dotPadAPI.dotPadCommunication.isConnect() == true) {
            LogMessage("Disconnect")
            DotPadSDK.shared.dotPadAPI.dotPadCommunication.disconnect()
        }
    }
    
    @IBAction func allUp(_ sender: Any) {
        LogMessage()
        if isGraphicDisplay {
            DotPadSDK.shared.dotPadAPI.dotPadProcessData.displayGraphicData(data: String(repeating: "FF", count: 300))
        }
        if isBrailleDisplay {
            DotPadSDK.shared.dotPadAPI.dotPadProcessData.displayTextData(brailleString: String(repeating: "FF", count: 20))
        }
    }
    
    @IBAction func allDown(_ sender: Any) {
        LogMessage()
        if isGraphicDisplay {
            DotPadSDK.shared.dotPadAPI.dotPadProcessData.resetGraphicDisplay()
        }
        if isBrailleDisplay {
            DotPadSDK.shared.dotPadAPI.dotPadProcessData.resetBrailleDisplay()
        }
    }
    
    @IBAction func getDeviceInfo(_ sender: Any) {
        LogMessage()
        DotPadSDK.shared.dotPadAPI.dotPadProcessData.requestDeviceName()
    }
    
    @IBAction func displayGraphicData(_ sender: Any) {
        LogMessage()

        if isGraphicDisplay {
            let graphicDataStr = "0000000000000000000000000000000000000000000000000000000000000000000000CCEE0E00000000000000000000000000000000000000000000000000000010FF0F00000000000000000000000000000000880800808800000000888888FF0F0000000000000000C0CC0000000000003303003033000080FE7F33F7FF0F00C0FE7FF7EF0C00F7FF77770000000088080080880000F0FF000000FF0F00FF1F0000F1FF00F0FF00000000000033030030330000F0FF8C00C8FF0F00F7CF0880FC7F00F0FF080000000000880800808800000073777777777707103377773301003077777700000000330300303300000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000"
            DotPadSDK.shared.dotPadAPI.dotPadProcessData.displayGraphicData(data: graphicDataStr)
        }
    }
    
    @IBAction func displayBrailleData(_ sender: Any) {
        if let textToSend: String = padTextField.text {
            BrailleString.text = DotPadSDK.shared.dotPadAPI.dotPadProcessData.displayTextData(text: textToSend)
        }
    }
    
    private func charPairToByte(_ str: String) -> UInt8{
        var byte:UInt8 = 0
        
        for c in str {
            var number:UInt8 = 0
            byte = byte << 4
            number = UInt8(UInt(String(c), radix: 16) ?? 0 )
            byte = byte | number
        }
        return byte
    }
    
    private func hexStringToByteArray(_ str: String) -> Array<UInt8> {
        var hexString = ""
        
        for character in str {
            if (character != " ") {
                hexString.append(character)
            }
        }
        
        hexString = hexString.uppercased()
        
        var bytes = [UInt8]()
        var stringLength = hexString.count
        
        if (stringLength % 2 != 0) {
            stringLength -= 1;
        }
        
        for i in (0..<stringLength/2) {
            let sub = hexString.substring(with: (hexString.index(hexString.startIndex, offsetBy: i * 2) ..< hexString.index(hexString.startIndex, offsetBy: (i * 2) + 2)))
            let byte:UInt8 = charPairToByte(sub)
            
            bytes.append(byte)
        }
        return bytes
    }
}

@available(iOS 15.2, *)
extension ViewController: UITableViewDelegate {
    func tableView(_ tableView: UITableView, didSelectRowAt indexPath: IndexPath) {
        LogMessage("Tapped \(indexPath.row)")
        DotPadSDK.shared.dotPadAPI.dotPadCommunication.connect(discoveries[indexPath.row].remotePeripheral)
    }
}

@available(iOS 15.2, *)
extension ViewController: UITableViewDataSource {
    
    func tableView(_ tableView: UITableView, numberOfRowsInSection section: Int) -> Int {
        return discoveries.count
    }
    
    func tableView(_ tableView: UITableView, cellForRowAt indexPath: IndexPath) -> UITableViewCell {
        let cell = tableView.dequeueReusableCell(withIdentifier: "cell", for: indexPath) as! BLEPeripheralCell
        cell.DeviceName.text = discoveries[indexPath.row].localName ?? "No Name"
        cell.RSSI.text = String(discoveries[indexPath.row].RSSI)
        return cell
    }
}

