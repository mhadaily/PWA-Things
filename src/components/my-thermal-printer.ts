import { html, customElement, LitElement, property, css } from 'lit-element';

// These are the shared styles needed by this element.
import { SharedStyles } from './shared-styles.js';

@customElement('my-thermal-printer')
export class MyThermalPrinter extends LitElement {
  static get styles() {
    return [SharedStyles, css``];
  }

  @property({ type: Boolean })
  isConnected = false;

  @property({ type: Object })
  private printCharacteristic: any = null;

  private sendTextData() {
    const message = 'Hello World! I am Thermal Printer Via Web Bluetooth';
    let long = '';
    for (let i = 0; i < 50; i++) {
      long += message + '  ' + i;
      i++;
    }
    let encoder = new TextEncoder();
    let command = encoder.encode(long);

    const maxLength = 100;
    let chunks = Math.ceil(command.length / maxLength);

    if (chunks === 1) {
      this._queue(command);
    } else {
      for (let i = 0; i < chunks; i++) {
        let byteOffset = i * maxLength;
        let length = Math.min(command.length, byteOffset + maxLength);
        this._queue(command.slice(byteOffset, length));
      }
    }

    console.log('Write done.');
  }

  _QUEUE = <any>[];
  _WORKING = false;

  _queue(f: any) {
    const run = () => {
      if (!this._QUEUE.length) {
        this._WORKING = false;
        return;
      }

      this._WORKING = true;
      this.printCharacteristic.writeValue(this._QUEUE.shift()).then(() => run());
    };

    this._QUEUE.push(f);

    if (!this._WORKING) {
      run();
    }
  }

  private request() {
    if (this.isConnected) {
      this.isConnected = false;
      return;
    }
    console.log('Connecting to ThermalPrinter...');
    if (this.printCharacteristic === null) {
      (<any>navigator).bluetooth
        .requestDevice({
          filters: [
            {
              services: ['000018f0-0000-1000-8000-00805f9b34fb']
            }
          ]
        })
        .then((device: any) => {
          console.log('> Found ' + device.name);
          console.log('Connecting to GATT Server...');
          return device.gatt.connect();
        })
        .then((server: any) => server.getPrimaryService('000018f0-0000-1000-8000-00805f9b34fb'))
        .then((service: any) => service.getCharacteristic('00002af1-0000-1000-8000-00805f9b34fb'))
        .then((characteristic: any) => {
          // Cache the characteristic
          console.log('printer characteristic', characteristic);
          this.isConnected = true;
          this.printCharacteristic = characteristic;
        })
        .catch((e: any) => console.log(e));
    }
  }

  protected render() {
    return html`
      <section>
        <h2>Bluetooth Printer</h2>
        <div class="text-center">
          <img style="width:200px" src="/images/printer.png" />
        </div>
        <button class="c-button" ?hidden="${this.isConnected}" @click="${this.request}">CONNECT</button>

        ${this.isConnected
          ? html`
              <div class="row">
                <div class="text-center">
                  <div class="col">
                    <h3>Connected!</h3>
                    <button class="c-button disconnect" @click="${this.sendTextData}">PRINT SOMETHING</button>
                  </div>
                </div>
              </div>
            `
          : html``}

        <button ?hidden="${!this.isConnected}" class="c-button disconnect" @click="${this.request}">DISCONNECT</button>
      </section>
    `;
  }
}
