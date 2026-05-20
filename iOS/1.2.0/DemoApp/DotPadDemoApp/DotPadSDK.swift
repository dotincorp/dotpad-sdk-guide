//
//  DotPadSDK.swift
//  CreatingTool
//
//  Created by Dot Incorporation.
//

import Foundation
import DotPadFrameworks

class DotPadSDK {
    
    static let shared = DotPadSDK()
    let dotPad_API: DotPadFrameworks.DotPad_API = DotPadFrameworks.DotPad_API()
    
    public var deviceName: String = ""
    public var dotPad: DotPad = DotPad(DeviceType.Default)
    
    public func setDeviceType(_ deviceType: DeviceType) {
        switch (deviceType) {
        case .DotPad320:
            print("[DotPadSDK] setDeviceType : \(deviceType)")
            dotPad = DotPad_320()
        case .DotPad832:
            print("[DotPadSDK] setDeviceType : \(deviceType)")
        case .DotPad300:
            print("[DotPadSDK] setDeviceType : \(deviceType)")
        case .Default:
            print("[DotPadSDK] setDeviceType : Default")
        }
        
        dotPad = DotPad(deviceType)
    }
    
    private init() { }
}
