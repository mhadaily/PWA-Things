/**
 * @author Charlie Gerard / http://charliegerard.github.io
 */
const services = {
  controlService: {
    name: 'control service',
    uuid: 'd5060001-a904-deb9-4748-2c7f4a124842'
  },
  imuDataService: {
    name: 'IMU Data Service',
    uuid: 'd5060002-a904-deb9-4748-2c7f4a124842'
  },
  emgDataService: {
    name: 'EMG Data Service',
    uuid: 'd5060005-a904-deb9-4748-2c7f4a124842'
  },
  batteryService: {
    name: 'battery service',
    uuid: 0x180f
  },
  classifierService: {
    name: 'classifier service',
    uuid: 'd5060003-a904-deb9-4748-2c7f4a124842'
  }
};

const characteristics = {
  commandCharacteristic: {
    name: 'command characteristic',
    uuid: 'd5060401-a904-deb9-4748-2c7f4a124842'
  },
  imuDataCharacteristic: {
    name: 'imu data characteristic',
    uuid: 'd5060402-a904-deb9-4748-2c7f4a124842'
  },
  batteryLevelCharacteristic: {
    name: 'battery level characteristic',
    uuid: 0x2a19
  },
  classifierEventCharacteristic: {
    name: 'classifier event characteristic',
    uuid: 'd5060103-a904-deb9-4748-2c7f4a124842'
  },
  emgData0Characteristic: {
    name: 'EMG Data 0 characteristic',
    uuid: 'd5060105-a904-deb9-4748-2c7f4a124842'
  }
};
// @ts-ignore
var _this;
var state = {};
var previousPose;

export class MyoWebBluetooth {
  private device: any;
  // @ts-ignore
  constructor(name) {
    _this = this;
    // @ts-ignore
    this.name = name;
    // @ts-ignore
    this.services = services;
    // @ts-ignore
    this.characteristics = characteristics;
    // @ts-ignore
    this.standardServer;
  }

  async disconnect(): Promise<string> {
    if (!this.device) {
      return '';
    }
    console.log('Disconnecting from Bluetooth Device...');
    if (this.device.gatt.connected) {
      await this.device.gatt.disconnect();
      return `Device ${this.device.name} is disconnected, please try again`;
    } else {
      console.log('> Bluetooth Device is already disconnected');
      return '';
    }
  }

  connect() {
    // @ts-ignore
    return (
      // @ts-ignore
      navigator.bluetooth
        .requestDevice({
          filters: [
            // @ts-ignore
            { name: this.name },
            {
              services: [
                services.batteryService.uuid,
                // services.imuDataService.uuid,
                services.controlService.uuid
                // services.emgDataService.uuid
              ]
            }
          ],
          optionalServices: [services.classifierService.uuid]
        })
        // @ts-ignore
        .then(device => {
          console.log('Device discovered', device.name);
          this.device = device;
          return device.gatt.connect();
        })
        // @ts-ignore
        .then(server => {
          console.log('server device: ' + Object.keys(server.device));

          this.getServices(
            [
              services.batteryService,
              services.controlService,
              // services.emgDataService,
              // services.imuDataService,
              services.classifierService
            ],
            [
              characteristics.batteryLevelCharacteristic,
              characteristics.commandCharacteristic,
              // characteristics.emgData0Characteristic,
              // characteristics.imuDataCharacteristic,
              characteristics.classifierEventCharacteristic
            ],
            server
          );
        })
        // @ts-ignore
        .catch(error => {
          console.log('error', error);
        })
    );
  }

  // @ts-ignore
  getServices(requestedServices, requestedCharacteristics, server) {
    // @ts-ignore
    this.standardServer = server;
    // @ts-ignore
    requestedServices.filter(service => {
      if (service.uuid == services.batteryService.uuid) {
        // @ts-ignore
        // No need to pass in all requested characteristics for the battery service as the battery level is the only characteristic available.
        _this.getBatteryData(service, characteristics.batteryLevelCharacteristic, this.standardServer);
      } else if (service.uuid == services.controlService.uuid) {
        // @ts-ignore
        _this.getControlService(requestedServices, requestedCharacteristics, this.standardServer);
      }
    });
  }
  // @ts-ignore
  getBatteryData(service, reqChar, server) {
    // @ts-ignore
    return server.getPrimaryService(service.uuid).then(service => {
      console.log('getting battery service');
      // @ts-ignore
      _this.getBatteryLevel(reqChar.uuid, service);
    });
  }
  // @ts-ignore
  getBatteryLevel(characteristic, service) {
    return (
      service
        .getCharacteristic(characteristic)
        // @ts-ignore
        .then(char => {
          console.log('getting battery level characteristic');
          // @ts-ignore
          char.addEventListener('characteristicvaluechanged', _this.handleBatteryLevelChanged);
          return char.readValue();
        })
        // @ts-ignore
        .then(value => {
          let batteryLevel = value.getUint8(0);
          console.log('> Battery Level is ' + batteryLevel + '%');
          // @ts-ignore
          state.batteryLevel = batteryLevel;
        })
        // @ts-ignore
        .catch(error => {
          console.log('Error: ', error);
        })
    );
  }

  // @ts-ignore
  getControlService(requestedServices, requestedCharacteristics, server) {
    // @ts-ignore
    let controlService = requestedServices.filter(service => {
      return service.uuid == services.controlService.uuid;
    });
    // @ts-ignore
    let commandChar = requestedCharacteristics.filter(char => {
      return char.uuid == characteristics.commandCharacteristic.uuid;
    });

    // Before having access to IMU, EMG and Pose data, we need to indicate to the Myo that we want to receive this data.
    return (
      server
        .getPrimaryService(controlService[0].uuid)
        // @ts-ignore
        .then(service => {
          console.log('getting service: ', controlService[0].name);
          return service.getCharacteristic(commandChar[0].uuid);
        })
        // @ts-ignore
        .then(characteristic => {
          console.log('getting characteristic: ', commandChar[0].name);
          // return new Buffer([0x01,3,emg_mode,imu_mode,classifier_mode]);
          // The values passed in the buffer indicate that we want to receive all data without restriction;
          let commandValue = new Uint8Array([0x01, 3, 0x02, 0x03, 0x01]);
          characteristic.writeValue(commandValue);
        })
        // @ts-ignore
        .then(_ => {
          // @ts-ignore
          let IMUService = requestedServices.filter(service => {
            return service.uuid == services.imuDataService.uuid;
          });
          // @ts-ignore
          let EMGService = requestedServices.filter(service => {
            return service.uuid == services.emgDataService.uuid;
          });
          // @ts-ignore
          let classifierService = requestedServices.filter(service => {
            return service.uuid == services.classifierService.uuid;
          });
          // @ts-ignore
          let IMUDataChar = requestedCharacteristics.filter(char => {
            return char.uuid == characteristics.imuDataCharacteristic.uuid;
          });
          // @ts-ignore
          let EMGDataChar = requestedCharacteristics.filter(char => {
            return char.uuid == characteristics.emgData0Characteristic.uuid;
          });
          // @ts-ignore
          let classifierEventChar = requestedCharacteristics.filter(char => {
            return char.uuid == characteristics.classifierEventCharacteristic.uuid;
          });

          if (IMUService.length > 0) {
            console.log('getting service: ', IMUService[0].name);
            // @ts-ignore
            _this.getIMUData(IMUService[0], IMUDataChar[0], server);
          }
          if (EMGService.length > 0) {
            console.log('getting service: ', EMGService[0].name);
            // @ts-ignore
            _this.getEMGData(EMGService[0], EMGDataChar[0], server);
          }
          if (classifierService.length > 0) {
            console.log('getting service: ', classifierService[0].name);
            // @ts-ignore
            _this.getClassifierData(classifierService[0], classifierEventChar[0], server);
          }
        })
        // @ts-ignore
        .catch(error => {
          console.log('error: ', error);
        })
    );
  }

  // @ts-ignore
  handleBatteryLevelChanged(event) {
    let batteryLevel = event.target.value.getUint8(0);
    // @ts-ignore
    state.batteryLevel = batteryLevel;

    console.log('> Battery Level is ' + batteryLevel + '%');
    // @ts-ignore
    _this.onStateChangeCallback(state);
  }

  // @ts-ignore
  handleIMUDataChanged(event) {
    //byteLength of ImuData DataView object is 20.
    // imuData return {{orientation: {w: *, x: *, y: *, z: *}, accelerometer: Array, gyroscope: Array}}
    // @ts-ignore
    let imuData = event.target.value;

    let orientationW = event.target.value.getInt16(0) / 16384;
    let orientationX = event.target.value.getInt16(2) / 16384;
    let orientationY = event.target.value.getInt16(4) / 16384;
    let orientationZ = event.target.value.getInt16(6) / 16384;

    let accelerometerX = event.target.value.getInt16(8) / 2048;
    let accelerometerY = event.target.value.getInt16(10) / 2048;
    let accelerometerZ = event.target.value.getInt16(12) / 2048;

    let gyroscopeX = event.target.value.getInt16(14) / 16;
    let gyroscopeY = event.target.value.getInt16(16) / 16;
    let gyroscopeZ = event.target.value.getInt16(18) / 16;

    var data = {
      orientation: {
        x: orientationX,
        y: orientationY,
        z: orientationZ,
        w: orientationW
      },
      accelerometer: {
        x: accelerometerX,
        y: accelerometerY,
        z: accelerometerZ
      },
      gyroscope: {
        x: gyroscopeX,
        y: gyroscopeY,
        z: gyroscopeZ
      }
    };

    state = {
      orientation: data.orientation,
      accelerometer: data.accelerometer,
      gyroscope: data.gyroscope
    };
    // @ts-ignore
    _this.onStateChangeCallback(state);
  }

  onStateChangeCallback() {}
  // @ts-ignore
  getIMUData(service, characteristic, server) {
    return (
      server
        .getPrimaryService(service.uuid)
        // @ts-ignore
        .then(newService => {
          console.log('getting characteristic: ', characteristic.name);
          return newService.getCharacteristic(characteristic.uuid);
        })
        // @ts-ignore
        .then(char => {
          // @ts-ignore
          char.startNotifications().then(res => {
            // @ts-ignore
            char.addEventListener('characteristicvaluechanged', _this.handleIMUDataChanged);
          });
        })
    );
  }
  // @ts-ignore
  getEMGData(service, characteristic, server) {
    return (
      server
        .getPrimaryService(service.uuid)
        // @ts-ignore
        .then(newService => {
          console.log('getting characteristic: ', characteristic.name);
          return newService.getCharacteristic(characteristic.uuid);
        })
        // @ts-ignore
        .then(char => {
          // @ts-ignore
          char.startNotifications().then(res => {
            // @ts-ignore
            char.addEventListener('characteristicvaluechanged', _this.handleEMGDataChanged);
          });
        })
    );
  }

  // @ts-ignore
  getClassifierData(service, characteristic, server) {
    return (
      server
        .getPrimaryService(service.uuid)
        // @ts-ignore
        .then(newService => {
          console.log('getting characteristic: ', characteristic.name);
          return newService.getCharacteristic(characteristic.uuid);
        })
        // @ts-ignore
        .then(char => {
          // @ts-ignore
          char.startNotifications().then(res => {
            // @ts-ignore
            char.addEventListener('characteristicvaluechanged', _this.handlePoseChanged);
          });
        })
    );
  }

  // @ts-ignore
  handlePoseChanged(event) {
    console.log('handlePoseChanged');
    let eventReceived = event.target.value.getUint8(0);
    let poseEventCode = event.target.value.getInt16(1) / 256;
    // @ts-ignore
    let armSynced, armType, myoDirection, myoLocked;

    let arm = event.target.value.getUint8(1);
    let x_direction = event.target.value.getUint8(2);
    switch (eventReceived) {
      case 1:
        // @ts-ignore
        _this.eventArmSynced(arm, x_direction);
        armSynced = true;
        break;
      case 2:
        armSynced = false;
        break;
      case 3:
        // @ts-ignore
        _this.getPoseEvent(poseEventCode);
        break;
      case 4:
        myoLocked = false;
        break;
      case 5:
        myoLocked = true;
        break;
      case 6:
        armSynced = false;
        break;
    }

    // @ts-ignore
    state.armSynced = armSynced;
    // @ts-ignore
    state.myoLocked = myoLocked;
    // @ts-ignore
    _this.onStateChangeCallback(state);
  }
  // @ts-ignore
  eventArmSynced(arm, x_direction) {
    const armType = arm == 1 ? 'right' : arm == 2 ? 'left' : 'unknown';
    const myoDirection = x_direction == 1 ? 'wrist' : x_direction == 2 ? 'elbow' : 'unknown';
    // @ts-ignore
    state.armType = armType;
    // @ts-ignore
    state.myoDirection = myoDirection;
    // @ts-ignore
    _this.onStateChangeCallback(state);
  }
  // @ts-ignore
  getPoseEvent(code) {
    let pose;
    previousPose = pose;
    switch (code) {
      case 1:
        pose = 'fist';
        break;
      case 2:
        pose = 'wave in';
        break;
      case 3:
        pose = 'wave out';
        break;
      case 4:
        pose = 'fingers spread';
        break;
      case 5:
        pose = 'double tap';
        break;
      case 255:
        pose = 'unknown';
        break;
    }

    if (previousPose !== pose) {
      // @ts-ignore
      state.pose = pose;
      // @ts-ignore
      _this.onStateChangeCallback(state);
    }
  }
  // @ts-ignore
  handleEMGDataChanged(event) {
    //byteLength of ImuData DataView object is 20.
    // imuData return {{orientation: {w: *, x: *, y: *, z: *}, accelerometer: Array, gyroscope: Array}}
    let emgData = event.target.value;

    let sample1 = [
      emgData.getInt8(0),
      emgData.getInt8(1),
      emgData.getInt8(2),
      emgData.getInt8(3),
      emgData.getInt8(4),
      emgData.getInt8(5),
      emgData.getInt8(6),
      emgData.getInt8(7)
    ];
    // @ts-ignore
    let sample2 = [
      emgData.getInt8(8),
      emgData.getInt8(9),
      emgData.getInt8(10),
      emgData.getInt8(11),
      emgData.getInt8(12),
      emgData.getInt8(13),
      emgData.getInt8(14),
      emgData.getInt8(15)
    ];
    // @ts-ignore
    state.emgData = sample1;
    // @ts-ignore
    _this.onStateChangeCallback(state);
  }
  // @ts-ignore
  onStateChange(callback) {
    // @ts-ignore
    _this.onStateChangeCallback = callback;
  }
}
