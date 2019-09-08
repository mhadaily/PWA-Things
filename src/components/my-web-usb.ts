import { html, property, customElement } from 'lit-element';
import { PageViewElement } from './page-view-element.js';

// These are the shared styles needed by this element.
import { SharedStyles } from './shared-styles.js';
import './my-adb.js';

enum WebUSBDemo {
  adb = 'adb',
  printer = 'printer'
}

@customElement('my-web-usb')
export class MyWebUSB extends PageViewElement {
  static get styles() {
    return [SharedStyles];
  }

  @property({ type: String })
  demo: WebUSBDemo | null = null;

  @property({ type: Boolean })
  showDemo: boolean = false;

  setDemo(demoName: WebUSBDemo) {
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
              <h2>WebUSB Demo</h2>
              <button class="s-button" @click="${() => this.setDemo(WebUSBDemo.adb)}">
                Android Debug Bridge
                <img style="width:200px" src="/images/adb.png" />
              </button>
              <button class="s-button" @click="${() => this.setDemo(WebUSBDemo.printer)}">
                Thermal Printer (USB)
                <img style="width:200px" src="/images/printer.png" />
              </button>
            `}
        ${this.demo === WebUSBDemo.adb
          ? html`
              <my-adb></my-adb>
            `
          : this.demo === WebUSBDemo.printer
          ? html`
              coming soon...
            `
          : html``}
      </section>
    `;
  }
}
