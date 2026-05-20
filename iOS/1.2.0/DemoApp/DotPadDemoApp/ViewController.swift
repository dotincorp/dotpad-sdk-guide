//
//  ViewController.swift
//  DotPadDemoApp
//
//  Created by Dot Incorporation.
//

import UIKit
import DotPadFrameworks

class ViewController: UIViewController, DotPadFrameworks.SendDataProtocol {

    //let dotPad_API: DotPadFrameworks.DotPad_API = DotPadFrameworks.DotPad_API()

    public var discoveries = [BKDiscovery]() {
        didSet {
            //print("[ViewController] discoveries : tableView reloadData")
            tableView.reloadData()
        }
    }
    
    @IBOutlet weak var BLEButton: UIButton!
    @IBOutlet var tableView: UITableView!
    @IBOutlet weak var padInfoTextField: UITextField!
    @IBOutlet weak var padTextField: UITextField!
    @IBOutlet var BrailleString: UILabel!

    override func viewDidLoad() {
        super.viewDidLoad()
        // Do any additional setup after loading the view.
        DotPadSDK.shared.dotPad_API.dotPad_Communication.delegate_SDP = self
        
        BrailleString.text = ""
        
        tableView.delegate = self
        tableView.dataSource = self
        
    }

    func sendDataFunc(_ dataCode: DotPadFrameworks.DotPad_Communication.DataCodes, _ dataStr: String) {
        //print("[ViewController] sendDataFunc")
        switch dataCode {
        case DotPadFrameworks.DotPad_Communication.DataCodes.Discovery_List:
            padInfoTextField.text = ""
            discoveries = DotPadSDK.shared.dotPad_API.dotPad_Communication.discoveries ?? []
        case DotPadFrameworks.DotPad_Communication.DataCodes.Connected:
            BLEButton.setTitle("Disconnect", for: .normal)
            do {
                sleep(3)
            }
            getDeviceInfo(self)
        case DotPadFrameworks.DotPad_Communication.DataCodes.Disconnected:
            padInfoTextField.text = ""
            discoveries.removeAll()
            BLEButton.setTitle("Start Scan", for: .normal)
        case DotPadFrameworks.DotPad_Communication.DataCodes.DeviceName:
            padInfoTextField.text = dataStr
            DotPadSDK.shared.dotPad_API.dotPad_ProcessData.setDeviceType()
            DotPadSDK.shared.setDeviceType(DotPadSDK.shared.dotPad_API.dotPad_ProcessData.deviceType)
        default:
            print("[]")
        }
    }
    
    @IBAction func startScan(_ sender: Any) {

        if (DotPadSDK.shared.dotPad_API.dotPad_Communication.isConnected == false)
        {
            print("[ViewController] startScanPheripheral")
            DotPadSDK.shared.dotPad_API.dotPad_Communication.scan()
        } else if (DotPadSDK.shared.dotPad_API.dotPad_Communication.isConnected == true)
        {
            print("[ViewController] disconnect")
            DotPadSDK.shared.dotPad_API.dotPad_Communication.disconnect()
        }

 }
    
    @IBAction func allUp(_ sender: Any) {
        print("[ViewController] allUp")
        DotPadSDK.shared.dotPad_API.dotPad_ProcessData.allUp()
    }
    
    @IBAction func allDown(_ sender: Any) {
        print("[ViewController] allDown")
        DotPadSDK.shared.dotPad_API.dotPad_ProcessData.allDown()
    }
    
    @IBAction func getDeviceInfo(_ sender: Any) {
        print("[ViewController] getDeviceInfo")
        DotPadSDK.shared.dotPad_API.dotPad_ProcessData.reqDeviceName()
    }
    
    @IBAction func sendSampleDTM(_ sender: Any) {
        print("[ViewController] sendDemoDTM")
        
        var textToSend: String = padTextField.text ?? "Sample Text!!!";
        DotPadSDK.shared.dotPad_API.dotPad_ProcessData.sendSampleDTM()
        BrailleString.text = DotPadSDK.shared.dotPad_API.dotPad_ProcessData.Print_BrailleText(textToSend)
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
        DotPadSDK.shared.dotPad_API.dotPad_Communication.connect(discoveries[indexPath.row].remotePeripheral)
    }
}

extension ViewController: UITableViewDataSource {
    
    func tableView(_ tableView: UITableView, numberOfRowsInSection section: Int) -> Int {
        return discoveries.count
    }
    
    func tableView(_ tableView: UITableView, cellForRowAt indexPath: IndexPath) -> UITableViewCell {
        let cell = tableView.dequeueReusableCell(withIdentifier: "cell", for: indexPath) as! BLEPeripheralCell
        
        cell.DeviceName.text = discoveries[indexPath.row].localName ?? "No Name"
        cell.RSSI.text = String(discoveries[indexPath.row].RSSI) ?? "-"
        
        return cell
    }
}






