import { html, customElement, LitElement, property, css } from 'lit-element';
import { repeat } from 'lit-html/directives/repeat';

// These are the shared styles needed by this element.
import { SharedStyles } from './shared-styles.js';

declare const NDEFReader: any;
declare const NDEFWriter: any;

@customElement('my-webshop-nfc')
export class MyMyoArmBand extends LitElement {
  static get styles() {
    return [
      SharedStyles,
      css`
        .webshop {
          border: 1px solid #ccc;
        }
        .row {
          display: flex;
          flex-direction: column;
          padding: 10px;
        }
        .col {
          flex: 1;
        }
        .operator {
          flex: 1;
          justify-content: center;
        }
        .error {
          background: red;
          border-radius: 15px;
          padding: 10px;
          color: #fff;
        }
        .success {
          border: 1px solid #77e10e;
          border-radius: 15px;
          padding: 10px;
        }
        .items {
          font-size: 25px;
          @media (max-width: 600px) {
            font-size: 15px;
          }
          font-weight: bold;
          text-align: left;
          line-height: 1.8;
        }
      `
    ];
  }

  @property({ type: Boolean })
  isAuth = false;

  @property({ type: Object })
  operator = { name: '', id: '', role: '' };

  @property({ type: String })
  rowItems = '';

  @property({ type: String })
  receipt = '';

  @property({ type: String })
  operatorNotAllow = '';

  printCharacteristic: any = null;

  @property({ type: Boolean })
  isPrinterConnected = false;

  @property({ type: Array })
  items = <any>[];

  connectPrinter() {
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
          this.printCharacteristic = characteristic;
          this.isPrinterConnected = true;
        })
        .catch((e: any) => console.log(e));
    }
  }

  _QUEUE = <any>[];
  _WORKING = false;

  async print() {
    try {
      const itemsText = 'Item Sample 1';
      const lines = '-------------';
      const total = 'total: $200';
      const all = itemsText + lines + total;
      let long = '';
      for (let i = 0; i < 1500; i++) {
        long += all;
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
      console.log(`Write done.`);
    } catch (e) {
      console.error('Writting to printer: ', e);
    }
  }

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

  async writeToNFC() {
    const writer = new NDEFWriter();
    const encoder = new TextEncoder();
    await writer.push(
      {
        records: [
          {
            id: '/pwathing/web-nfc',
            recordType: 'mime',
            mediaType: 'application/json',
            data: encoder.encode(
              JSON.stringify({
                id: '12345678900987654321',
                name: 'Majid',
                role: 'Cashier'
              })
            )
          },
          { recordType: 'url', data: 'https://w3c.github.io/web-nfc/' },
          { recordType: 'text', data: 'Hello World' },
          {
            id: '/pwathing/web-nfc',
            recordType: 'mime',
            mediaType: 'application/json',
            data: encoder.encode(
              JSON.stringify({
                id: '12345678900987654322',
                name: 'John',
                role: 'Unknown'
              })
            )
          }
        ]
      },
      {
        target: 'tag',
        ignoreRead: true,
        compatibility: 'any'
      }
    );
    console.log('Done Writing to Tag!');
  }

  async firstUpdated() {
    if (typeof NDEFReader !== 'undefined' || typeof NDEFWriter !== 'undefined') {
      console.log('NFC Supported!');
      try {
        const reader = new NDEFReader();
        reader.onreading = ({ message }: any) => {
          console.log('NFC message is coming...', message.records.length);
          if (message.records.length == 0 || message.records[0].recordType == 'empty') {
            return;
          }

          const decoder = new TextDecoder();
          for (let record of message.records) {
            console.log('RecordType', record.recordType, record);
            if (record.recordType === 'json') {
              if (record.mediaType === 'application/json') {
                const _record = JSON.parse(decoder.decode(record.data));
                console.log(_record);
                if (_record.id === '12345678900987654321') {
                  console.log('Auth Employee');
                  this.operator = _record;
                  this.isAuth = true;
                } else if (_record.id === '12345678900987654322') {
                  console.log('nonAuth Employee');
                  this.operatorNotAllow = `${_record.name}, sorry you are not allowed`;
                } else {
                  console.log('Products detected!');
                  this.items = [
                    ...this.items,
                    {
                      id: _record.id,
                      price: _record.price,
                      name: _record.name
                    }
                  ];
                }
              }
            }
          }
        };
        reader.scan({
          mediaType: 'application/json'
          // recordType: "w3.org:webnfc",
          // id: "/pwathing/web-nfc",
        });
      } catch (err) {
        console.log('Reading Failed: ' + err);
      }
    } else {
      this.operatorNotAllow = 'NFC Not Supported';
      console.log('NFC Not Supported');
    }
  }

  protected render() {
    return html`
      <section>
        <h2>WebNFC Shop Demo</h2>
        ${this.isAuth
          ? html`
              <div class="webshop">
                <div class="row">
                  <h4 class="s-button operator success">
                    Operator ID: ${this.operator.name} </br>
                    Operator Name: ${this.operator.id}<br/>
                     Operator Role: ${this.operator.role}
                  </h4>
                </div>
                <div class="row print-area">
                  <div class="col">
                    <h2>Items</h2>
                    <div class="row">
                    <ol>
                    ${repeat(this.items, (item: any) => {
                      return html`
                        <li>${item.name}, $${item.price}</li>
                      `;
                    })}
                    <ol>
                    </div>
                    <br>
                    ------------------------------- <br><br>
                    <b>Total: $${this.items.reduce((acc: any, item: any) => (acc += item.price), 0)}</b>
                    <br><br><br>
                  </div>
                  
                  <div class="col">
                  ${
                    this.isPrinterConnected
                      ? html`
                          <button class="c-button" @click="${this.print}">print</button>
                        `
                      : html`
                          <button class="c-button disconnect" @click="${this.connectPrinter}">
                            Connect Printer
                          </button>
                        `
                  }
                  </div>
                </div>
              </div>
            `
          : html`
              <h2 class="s-button operator">
                Please authenticate yourself first.Simply touch your ID card to your phone.
                <br />
              </h2>
              <h2 class="s-button operator error">
                ${this.operatorNotAllow}
              </h2>
            `}
      </section>
    `;
  }
}
