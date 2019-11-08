import { html, customElement, property } from 'lit-element';
import { PageViewElement } from './page-view-element.js';

// These are the shared styles needed by this element.
import { SharedStyles } from './shared-styles.js';

import './my-heart-rate.js';
import './my-myo-band.js';
import './my-thermal-printer.js';

enum WebBluetoothDemo {
  heartRate = 'heartRate',
  MyoBand = 'MyoBand',
  Drone = 'Drone',
  ThermalPrinter = 'ThermalPrinter',
  NordicThingy = 'NordicThingy'
}

@customElement('my-web-bluetooth')
export class MyWebBluetooth extends PageViewElement {
  static get styles() {
    return [SharedStyles];
  }

  @property({ type: String })
  demo: WebBluetoothDemo | null = null;

  @property({ type: Boolean })
  showDemo: boolean = false;

  setDemo(demoName: WebBluetoothDemo) {
    this.demo = demoName;
    this.showDemo = true;
  }

  back() {
    this.demo = null;
    this.showDemo = false;
  }

  protected render() {
    return html`
      <section>
        ${this.showDemo
          ? html`
              <a @click="${this.back}">
                < Back
              </a>
            `
          : html`
              <h2>WebBluetooth Demo</h2>
              <button class="s-button" @click="${() => this.setDemo(WebBluetoothDemo.heartRate)}">
                Heart Rate Zone tracker
                <img style="width:200px" src="/images/polar.jpg" />
              </button>

              <button class="s-button" @click="${() => this.setDemo(WebBluetoothDemo.MyoBand)}">
                Myo Band
                <img style="width:200px" src="/images/myo/myo.jpg" />
              </button>

              <button class="s-button" @click="${() => this.setDemo(WebBluetoothDemo.NordicThingy)}">
                Nordic Thingy
                <img style="width:200px" src="/images/nordicthingy.jpeg" />
              </button>

              <button class="s-button" @click="${() => this.setDemo(WebBluetoothDemo.ThermalPrinter)}">
                Thermal Printer
                <img style="width:200px" src="/images/printer.png" />
              </button>

              <button class="s-button" @click="${() => this.setDemo(WebBluetoothDemo.Drone)}">
                Drone
                <img style="width:200px" src="/images/drone.jpg" />
              </button>
            `}
        ${this.demo === WebBluetoothDemo.heartRate
          ? html`
              <my-heart-rate></my-heart-rate>
            `
          : this.demo === WebBluetoothDemo.MyoBand
          ? html`
              <my-myo-arm-band></my-myo-arm-band>
            `
          : this.demo === WebBluetoothDemo.NordicThingy
          ? html`
              NordicThingy
            `
          : this.demo === WebBluetoothDemo.Drone
          ? html`
              Drone
            `
          : this.demo === WebBluetoothDemo.ThermalPrinter
          ? html`
              <my-thermal-printer></my-thermal-printer>
            `
          : html``}
      </section>
    `;
  }
}
