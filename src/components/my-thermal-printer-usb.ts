import { html, customElement, LitElement, property, css } from 'lit-element';

// These are the shared styles needed by this element.
import { SharedStyles } from './shared-styles.js';

@customElement('my-thermal-printer-usb')
export class MyThermalPrinterUSB extends LitElement {
  private readonly ENDPOINT = 3;
  static get styles() {
    return [SharedStyles, css``];
  }

  @property({ type: Boolean })
  isConnected = false;

  @property({ type: Object })
  private device: any = null;

  @property({ type: String })
  private message: any = 'USB Printer! POS58 USB Printer!';

  async disconnect() {
    this.isConnected = false;
    this.device = null;
  }

  async connect() {
    if (this.device === null) {
      // get all connected usb devices
      const rawdevice = await (<any>navigator).usb.requestDevice({
        filters: [
          {
            serialNumber: 'Printer'
          }
        ]
      });
      // do the setup procedure on the connected device
      return this.setup(rawdevice);
    }
    return this.device;
  }

  async print() {
    // fetch value from input
    const string = this.message.trim();
    // use the built in TextEncoder to
    // convert a String to an Uint8Array containing utf-8 encoded text
    const encoder = new TextEncoder();
    const data = encoder.encode(string);
    // send the bytes to the printer
    await this.device.transferOut(this.ENDPOINT, data);
    console.log('Printing is done!');
  }

  async setup(rawdevice: any) {
    // open the device (initiate communication)
    await rawdevice.open();
    // select the devices configuration descriptor
    await rawdevice.selectConfiguration(1);
    // claim the device interfaces
    rawdevice = await this.claimInterface(rawdevice);
    this.device = rawdevice;
    this.isConnected = true;
    return rawdevice;
  }

  // walk over all interfaces of the device
  // check if they're claimed (and do claim them, if they're not yet)
  async claimInterface(d: any) {
    for (const config of d.configurations) {
      for (const iface of config.interfaces) {
        if (!iface.claimed) {
          await d.claimInterface(iface.interfaceNumber);
          return d;
        }
      }
    }
    return d;
  }

  protected render() {
    return html`
      <section>
        <h2>USB Printer</h2>
        <div class="text-center">
          <img style="width:200px" src="/images/printer.png" />
        </div>
        <button class="c-button" ?hidden="${this.isConnected}" @click="${this.connect}">CONNECT</button>

        ${this.isConnected
          ? html`
              <div class="row">
                <div class="text-center">
                  <div class="col">
                    <h3>Connected!</h3>
                    <button class="c-button disconnect" @click="${this.print}">PRINT SOMETHING</button>
                  </div>
                </div>
              </div>
            `
          : html``}

        <button ?hidden="${!this.isConnected}" class="c-button disconnect" @click="${this.disconnect}">DISCONNECT</button>
      </section>
    `;
  }
}
