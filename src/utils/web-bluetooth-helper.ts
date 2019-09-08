export class WebBluetoothHelper {
  private device: any;
  private server: any;

  async readValue(char: any) {
    const value = await char.readValue();
    return value.getUint8(0);
  }
  parseValue(event: any) {
    // The following little helper parses the data provided by the `hear_rate_measurement` service
    // https://www.bluetooth.com/specifications/gatt/viewer?attributeXmlFile=org.bluetooth.characteristic.heart_rate_measurement.xml
    const data = event.target.value;
    const flags = data.getUint8(0);
    const rate16Bits = flags & 0x1; // eslint-disable-line no-bitwise
    const result = {
      heartRate: 0,
      contactDetected: false,
      energyExpended: 0,
      rrIntervals: []
    };
    let index = 1;
    if (rate16Bits) {
      result.heartRate = data.getUint16(index, /*littleEndian=*/ true);
      index += 2;
    } else {
      result.heartRate = data.getUint8(index);
      index += 1;
    }
    const contactDetected = flags & 0x2; // eslint-disable-line no-bitwise
    const contactSensorPresent = flags & 0x4; // eslint-disable-line no-bitwise
    if (contactSensorPresent) {
      result.contactDetected = !!contactDetected;
    }
    const energyPresent = flags & 0x8; // eslint-disable-line no-bitwise
    if (energyPresent) {
      result.energyExpended = data.getUint16(index, /*littleEndian=*/ true);
      index += 2;
    }
    const rrIntervalPresent = flags & 0x10; // eslint-disable-line no-bitwise
    if (rrIntervalPresent) {
      const rrIntervals = [];
      for (; index + 1 < data.byteLength; index += 2) {
        rrIntervals.push(data.getUint16(index, /*littleEndian=*/ true));
      }
      // @ts-ignore
      result.rrIntervals = rrIntervals;
    }
    return result;
  }
  async getCharacteristics(server: any, primaryService: any, characteristicUuids: any) {
    const _characteristics = new Map();
    const service = await server.getPrimaryService(primaryService);

    const allChars = characteristicUuids.map(async (characteristicUuid: any) => {
      const characteristic = await service.getCharacteristic(characteristicUuid);
      _characteristics.set(characteristicUuid, characteristic);
    });

    await Promise.all(allChars);
    return characteristicUuids.reduce((acc: any, c: any) => {
      acc[c] = _characteristics.get(c);
      return acc;
    }, {});
  }
  async connect(services: any[]) {
    console.log('Connecting to Bluetooth Device...');
    const device = await (<any>navigator).bluetooth.requestDevice({
      filters: [
        {
          // name: "Polar",
          services
          // If your Bluetooth GATT Service is not on the list of the standardized Bluetooth GATT services though, you may provide either the full Bluetooth UUID or a short 16- or 32-bit form.
          // services: [0x1234, 0x12345678, '99999999-0000-1000-8000-00805f9b34fb']
          // optionalServices: ["heart_rate"]
        }
      ]
    });
    const server = await device.gatt.connect();
    this.device = device;
    this.server = server;
    return {
      device: this.device,
      server: this.server
    };
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
}
