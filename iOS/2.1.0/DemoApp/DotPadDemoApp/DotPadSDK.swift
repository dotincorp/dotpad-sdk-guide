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
    let dotPadAPI: DotPadAPI = DotPadAPI()

    public var deviceName: String = ""
    public var dotPad: DotPad = DotPad(deviceType: DeviceType.Default)

    public func setDeviceType(_ deviceType: DeviceType) {
        switch (deviceType) {
        case .DotPad320:
            print("[DotPadSDK] setDeviceType : \(deviceType)")
            dotPad = DotPad(deviceType: DeviceType.DotPad320)
        case .DotPad832:
            print("[DotPadSDK] setDeviceType : \(deviceType)")
        case .Default:
            print("[DotPadSDK] setDeviceType : Default")
        @unknown default:
            print("[DotPadSDK] setDeviceType : Default")
            dotPad = DotPad(deviceType: DeviceType.DotPad320)
        }
    }
    
    private init() { }
}
