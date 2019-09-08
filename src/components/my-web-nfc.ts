import { html, customElement } from 'lit-element';
import { PageViewElement } from './page-view-element.js';
// These are the shared styles needed by this element.
import { SharedStyles } from './shared-styles.js';
import { ButtonSharedStyles } from './button-shared-styles.js';

import './my-webshop-nfc.js';

@customElement('my-web-nfc')
export class MyWebNFC extends PageViewElement {
  static get styles() {
    return [SharedStyles, ButtonSharedStyles];
  }

  protected render() {
    return html`
      <section>
        <my-webshop-nfc></my-webshop-nfc>
      </section>
    `;
  }
}
