//
//  ViewController.swift
//  DotPadDemoApp
//
//  Created by Dot Incorporation.
//

import UIKit
import DotPadFrameworks

class ViewController: UIViewController, SendDataProtocol {

    public var discoveries = [BKDiscovery]() {
        didSet {
            //print("[ViewController] discoveries : tableView reloadData")
            tableView.reloadData()
        }
    }

    @IBOutlet weak var TextDisplayButton: UIButton!
    @IBOutlet weak var BLEButton: UIButton!
    @IBOutlet var tableView: UITableView!
    @IBOutlet weak var padInfoTextField: UITextField!
    @IBOutlet weak var padTextField: UITextField!
    @IBOutlet var BrailleString: UILabel!

    override func viewDidLoad() {
        super.viewDidLoad()
        // Do any additional setup after loading the view.
        DotPadSDK.shared.dotPadAPI.dotPadCommunication.delegate_SDP = self

        BrailleString.text = ""

        tableView.delegate = self
        tableView.dataSource = self

    }

    func sendDataFunc(_ dataCode: DotPadCommunication.DataCodes, _ dataStr: String) {
        //print("[ViewController] sendDataFunc")
        switch dataCode {
        case DotPadCommunication.DataCodes.Discovery_List:
            padInfoTextField.text = ""
            discoveries = DotPadSDK.shared.dotPadAPI.dotPadCommunication.discoveries ?? []
        case DotPadCommunication.DataCodes.Connected:
            BLEButton.setTitle("Disconnect", for: .normal)
            do {
                sleep(3)
            }
            getDeviceInfo(self)
        case DotPadCommunication.DataCodes.Disconnected:
            padInfoTextField.text = ""
            discoveries.removeAll()
            BLEButton.setTitle("Start Scan", for: .normal)
        case DotPadCommunication.DataCodes.DeviceName:
            padInfoTextField.text = dataStr
            DotPadSDK.shared.setDeviceType(DotPadSDK.shared.dotPadAPI.dotPadProcessData.getDeviceType())
        default:
            print("[]")
        }
    }

    @IBAction func startScan(_ sender: Any) {

        if (DotPadSDK.shared.dotPadAPI.dotPadCommunication.isConnect() == false)
        {
            print("[ViewController] startScanPheripheral")
            DotPadSDK.shared.dotPadAPI.dotPadCommunication.scan()
        } else if (DotPadSDK.shared.dotPadAPI.dotPadCommunication.isConnect() == true)
        {
            print("[ViewController] disconnect")
            DotPadSDK.shared.dotPadAPI.dotPadCommunication.disconnect()
        }

    }

    @IBAction func DisplayText(_ sender: UIButton){
        BrailleString.text = DotPadSDK.shared.dotPadAPI.dotPadProcessData.displayTextData(text: padTextField.text!)
    }

    @IBAction func allUp(_ sender: Any) {
        print("[ViewController] allUp")
        DotPadSDK.shared.dotPadAPI.dotPadProcessData.displayGraphicData(data: String(repeating: "FF", count: 300))
    }

    @IBAction func allDown(_ sender: Any) {
        print("[ViewController] allDown")
        DotPadSDK.shared.dotPadAPI.dotPadProcessData.resetGraphicDisplay()
    }

    @IBAction func getDeviceInfo(_ sender: Any) {
        print("[ViewController] getDeviceInfo")
        DotPadSDK.shared.dotPadAPI.dotPadProcessData.requestDeviceName()
    }

    @IBAction func sendSampleDTM(_ sender: Any) {
        print("[ViewController] sendDemoDTM")

        var textToSend: String = padTextField.text ?? "Sample Text!!!";
        DotPadSDK.shared.dotPadAPI.dotPadProcessData.displayGraphicData(data: "00000000000000000000000000000080CC6E170000000000000000000000" +
                                                                            "000000000000000000008888888C047C7F13000000000000000000000000" +
                                                                            "00000000000000C06C5F1B7B7B3F3FFFFFFFDDFFEFCE0000000000000000" +
                                                                            "000000000000003D7D784DF9A7A1213D3B39FBFFBF130000000000000000" +
                                                                            "00000000000000DF15FB05B4C5596D0EFDD9F10D00000000000000000000" +
                                                                            "00000000000000D7DEDA9AAF78E96EFB764F7B0400000000000000000000" +
                                                                            "00000000000000709FD78FCF3CB97939BF4FEFE900000000000000000000" +
                                                                            "000000000000000073CBA3D4FFC4BDEE3BC6BBED390C0000000000000000" +
                                                                            "00000000000000000010D7EBEA67FFF0B6B79CDF35030000000000000000" +
                                                                            "000000000000000000000000117366372733010000000000000000000000")
        BrailleString.text = DotPadSDK.shared.dotPadAPI.dotPadProcessData.displayTextData(text:textToSend)
    }

    // MARK: - Assist Ftn
    private func charPairToByte(_ str:String) -> UInt8{
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

extension ViewController: UITableViewDelegate {
    func tableView(_ tableView: UITableView, didSelectRowAt indexPath: IndexPath) {
        print("you tapped \(indexPath.row)")

        let filteredDiscoveries = discoveries.filter { $0.localName?.contains("Dot") == true }
        DotPadSDK.shared.dotPadAPI.dotPadCommunication.connect(filteredDiscoveries[indexPath.row].remotePeripheral)
    }
}

extension ViewController: UITableViewDataSource {

    func tableView(_ tableView: UITableView, numberOfRowsInSection section: Int) -> Int {
        return discoveries.filter { $0.localName?.contains("Dot") == true }.count
    }

    func tableView(_ tableView: UITableView, cellForRowAt indexPath: IndexPath) -> UITableViewCell {
        let cell = tableView.dequeueReusableCell(withIdentifier: "cell", for: indexPath) as! BLEPeripheralCell
        
        let filteredDiscoveries = discoveries.filter { $0.localName?.contains("Dot") == true }
        let discovery = filteredDiscoveries[indexPath.row]

        cell.DeviceName.text = discovery.localName ?? "No Name"
        cell.RSSI.text = String(discovery.RSSI) ?? "-"

        return cell
    }
}






