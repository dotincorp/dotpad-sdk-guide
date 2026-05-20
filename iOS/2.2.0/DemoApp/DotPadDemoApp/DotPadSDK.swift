//
//  DotPadSDK.swift
//  CreatingTool
//
//  Created by inseong.cho_mac on 2022/01/24.
//

import Foundation
import DotPadFrameworks

class DotPadSDK {
    
    static let shared = DotPadSDK()
    let dotPadAPI: DotPadFrameworks.DotPadAPI = DotPadFrameworks.DotPadAPI()
    
    public var deviceName: String = ""
    public var dotPad: DotPad = DotPad(deviceType: DeviceType.DotPad320)
    
    public func setDeviceType(_ deviceType: DeviceType) {
        switch (deviceType) {
        case .DotPad320:
            print("[DotPadSDK] setDeviceType : \(deviceType)")
            dotPad = DotPad(deviceType: DeviceType.DotPad320)
        case .DotPad832:
            print("[DotPadSDK] setDeviceType : \(deviceType)")
        case .Default:
            print("[DotPadSDK] setDeviceType : Default")
        }
        
        dotPad = DotPad(deviceType: DeviceType.DotPad320)
    }
    
    private init() { }
}
