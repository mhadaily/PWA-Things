import { html, customElement, LitElement, property, css } from 'lit-element';

// These are the shared styles needed by this element.
import { SharedStyles } from './shared-styles.js';
import { MyoWebBluetooth } from '../utils/myo-arm-band.js';

@customElement('my-myo-arm-band')
export class MyMyoArmBand extends LitElement {
  private myoController = new MyoWebBluetooth('Myo');
  static get styles() {
    return [SharedStyles, css``];
  }

  @property({ type: Boolean })
  isConnected = false;

  @property({ type: String })
  poseImage = '';

  @property({ type: String })
  armType = 'Empty';

  @property({ type: String })
  myoDirection = 'Empty';

  @property({ type: String })
  batteryLevel = '';

  private request() {
    if (this.isConnected) {
      this.myoController.disconnect();
      this.isConnected = false;
      return;
    }
    console.log('Connecting to MyoArmBand...');
    this.myoController.connect();

    this.myoController.onStateChange((state: any) => {
      this.isConnected = true;
      this.batteryLevel = state.batteryLevel + '%';
      const poseData = state.pose;
      this.armType = state.armType;
      this.myoDirection = state.myoDirection;

      if (poseData) {
        switch (poseData) {
          case 'fist':
            this.poseImage = '/images/myo/fist.jpg';
            break;
          case 'wave out':
            this.poseImage = '/images/myo/wave-out.jpg';
            break;
          case 'wave in':
            this.poseImage = '/images/myo/wave-in.jpg';
            break;
          case 'double tap':
            this.poseImage = '/images/myo/double-tap.jpg';
            break;
          case 'fingers spread':
            this.poseImage = '/images/myo/fingers-spread.jpg';
            break;
        }
      } else {
        this.poseImage = '/images/myo/sorry.jpeg';
      }
    });
  }

  protected render() {
    return html`
      <section>
        <h2>Myo ArmBand</h2>
        <div class="text-center">
          <img style="width:200px" src="/images/myo/myo.jpg" />
        </div>
        <button class="c-button" ?hidden="${this.isConnected}" @click="${this.request}">CONNECT</button>

        ${this.isConnected
          ? html`
              <div class="row">
                <h3 ?hidden="${this.batteryLevel}"><small>Battery Level</small> ${this.batteryLevel}</h3>
                <div class="text-center">
                  <div class="col">
                    <h3>Arm Type (Left, Right)</h3>
                    <h1>${this.armType}</h1>
                    <h3>Arm Direction(wrist, Elbow)</h3>
                    <h1>${this.myoDirection}</h1>
                  </div>
                  <div class="col">
                    <h3>Arm position</h3>
                    <img width="100%" src="${this.poseImage}" />
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
