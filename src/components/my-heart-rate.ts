import { html, customElement, LitElement, css, property } from 'lit-element';

// These are the shared styles needed by this element.
import { SharedStyles } from './shared-styles.js';

import { WebBluetoothHelper } from '../utils/web-bluetooth-helper.js';

@customElement('my-heart-rate')
export class MyHeartRate extends LitElement {
  private $webBluetooth: WebBluetoothHelper = new WebBluetoothHelper();
  static get styles() {
    return [
      SharedStyles,
      css`
        input {
          border: 0;
          padding: 30px 0;
          box-shadow: 2px 4px 10px #ccc;
          width: 100%;
          font-size: 150%;
          margin-bottom: 15px;
          text-align: center;
        }
        .bigButton {
          position: relative;
          color: rgba(1, 1, 1, 1);
          text-decoration: none;
          font-family: monospace;
          font-weight: 700;
          font-size: 3em;
          text-transform: capitalize;
          display: block;
          padding: 4px;
          border-radius: 8px;
          width: 100%;
          text-align: center;
          transition: all 0.1s ease;
          background-color: #f5f5f5;
          box-shadow: 0px 9px 0px #dedede, 0px 9px 25px rgba(0, 0, 0, 0.7);
          transition: background-color 0.5s ease;
        }
        .bigButton:active {
          box-shadow: 0px 3px 0px rgba(245, 245, 245, 1), 0px 3px 6px rgba(0, 0, 0, 0.9);
          position: relative;
          top: 6px;
        }
        .maximum {
          color: rgba(255, 255, 255, 1);
          background-color: #cd2834;
          box-shadow: 0px 9px 0px #b52231, 0px 9px 25px rgba(0, 0, 0, 0.7);
          text-shadow: #b52231 1px, 1px, 2px;
        }
        .maximum:active {
          box-shadow: 0px 3px 0px rgba(219, 31, 5, 1), 0px 3px 6px rgba(0, 0, 0, 0.9);
        }

        .hard {
          color: rgba(255, 255, 255, 1);
          background-color: #ff8c00;
          box-shadow: 0px 9px 0px #e77f00, 0px 9px 25px rgba(0, 0, 0, 0.7);
          text-shadow: #e77f00 1px, 1px, 2px;
        }
        .hard:active {
          box-shadow: 0px 3px 0px rgba(255, 140, 0, 1), 0px 3px 6px rgba(0, 0, 0, 0.9);
        }

        .moderate {
          color: rgba(255, 255, 255, 1);
          background-color: #3cb371;
          box-shadow: 0px 9px 0px #36a266, 0px 9px 25px rgba(0, 0, 0, 0.7);
          text-shadow: #36a266 1px, 1px, 2px;
        }
        .moderate:active {
          box-shadow: 0px 3px 0px rgba(60, 179, 113, 1), 0px 3px 6px rgba(0, 0, 0, 0.9);
        }

        .light {
          color: rgba(255, 255, 255, 1);
          background-color: #1e90ff;
          box-shadow: 0px 9px 0px #1b82e7, 0px 9px 25px rgba(0, 0, 0, 0.7);
          text-shadow: #1b82e7 1px, 1px, 2px;
        }
        .light:active {
          box-shadow: 0px 3px 0px rgba(30, 144, 255, 1), 0px 3px 6px rgba(0, 0, 0, 0.9);
        }

        .resting {
          color: rgba(255, 255, 255, 1);
          background-color: #808080;
          box-shadow: 0px 9px 0px #747474, 0px 9px 25px rgba(0, 0, 0, 0.7);
          text-shadow: #747474 1px, 1px, 2px;
        }
        .resting:active {
          box-shadow: 0px 3px 0px rgba(128, 128, 128, 1), 0px 3px 6px rgba(0, 0, 0, 0.9);
        }
        .heart {
          position: relative;
          width: 100px;
          height: 90px;
          float: left;
          animation: one 1s infinite;
          animation-direction: alternate;
        }
        .heart-light {
          animation: one 0.8s infinite;
        }
        .heart-moderate {
          animation: one 0.6s infinite;
        }
        .heart-hard {
          animation: one 0.4s infinite;
        }
        .heart-maximum {
          animation: one 0.2s infinite;
        }
        .heart:before,
        .heart:after {
          position: absolute;
          content: '';
          left: 50px;
          top: 0;
          width: 50px;
          height: 80px;
          background: #fc2e5a;
          border-radius: 50px 50px 0 0;
          transform: rotate(-45deg);
          transform-origin: 0 100%;
        }
        .heart:after {
          left: 0;
          transform: rotate(45deg);
          transform-origin: 100% 100%;
        }
        .row {
          display: flex;
          justify-content: center;
        }
        @keyframes one {
          0% {
            transform: scale(0.8);
          }
          100% {
            transform: scale(1);
          }
        }
      `
    ];
  }

  @property({ type: String })
  discountedMessage: String = '';

  @property({ type: Number })
  heartRate: number = 0;

  @property({ type: Number })
  age: number = 34;

  @property({ type: String })
  body_location: String = '';

  @property({ type: Number })
  targetHR: number = 220 - this.age;

  @property({ type: Boolean })
  isConnected: boolean = false;

  private onParseSensorLocation(sensorLocation: Number) {
    switch (sensorLocation) {
      case 0:
        return 'Other';
      case 1:
        return 'Chest';
      case 2:
        return 'Wrist';
      case 3:
        return 'Finger';
      case 4:
        return 'Hand';
      case 5:
        return 'Ear Lobe';
      case 6:
        return 'Foot';
      default:
        return 'Unknown';
    }
  }

  private async request() {
    if (this.isConnected) {
      this.discountedMessage = await this.$webBluetooth.disconnect();
      if (this.discountedMessage) {
        this.isConnected = false;
        this.body_location = '';
        this.heartRate = 0;
      }
    } else {
      try {
        this.discountedMessage = '';
        const { device, server } = await this.$webBluetooth.connect(['heart_rate']);

        device.onGattserverdisconnected = (event: any) => {
          const device = event.target;
          this.discountedMessage = `Device ${device.name} is disconnected, please try again`;
          this.isConnected = false;
          this.body_location = '';
          this.heartRate = 0;
        };

        const { heart_rate_measurement, body_sensor_location } = await this.$webBluetooth.getCharacteristics(
          server,
          'heart_rate',
          ['heart_rate_measurement', 'body_sensor_location']
        );

        const sensorLocation = await this.$webBluetooth.readValue(body_sensor_location);
        this.body_location = this.onParseSensorLocation(sensorLocation);

        this.isConnected = true;

        await heart_rate_measurement.startNotifications();

        heart_rate_measurement.oncharacteristicvaluechanged = (event: any) => {
          this.heartRate = this.$webBluetooth.parseValue(event).heartRate;
        };
      } catch (e) {
        console.error(e);
      }
    }
  }

  private currentHearRateZoneFn(): String {
    const current_target_hr_pct = (this.heartRate * 100) / this.targetHR;
    if (current_target_hr_pct > 90) {
      return 'maximum';
    } else if (current_target_hr_pct > 80) {
      return 'hard';
    } else if (current_target_hr_pct > 70) {
      return 'moderate';
    } else if (current_target_hr_pct > 60) {
      return 'light';
    } else {
      return 'resting';
    }
  }

  private inputChange(event: any) {
    this.age = event.target.value;
    this.targetHR = 220 - this.age;
  }

  protected render() {
    const currentHearRateZone = this.currentHearRateZoneFn();
    return html`
      <section>
        <h2>Heart Rate Zone tracker</h2>
        <div class="text-center" ?hidden="${this.isConnected}">
          <img style="width:200px" src="/images/polar.jpg" />
        </div>
        <button class="c-button" ?hidden="${this.isConnected}" @click="${this.request}">CONNECT</button>
        <p>
          We all have a personal resting heart rate, “a minimum heart rate” ,and a maximum heart rate. And between these
          values are different heart rate zones that correspond to training intensity and training benefit.
        </p>
        <input value="${this.age}" type="text" @input=${this.inputChange} placeholder="Enter your age" />
        <br />
        <div ?hidden="${!this.isConnected}">
          <h2 ?hidden="${!this.body_location}">
            <small>Located at:</small>
            ${this.body_location}
            <br />
            <small>Maximum HR:</small>
            ${this.targetHR}
          </h2>
          <div class="row">
            <div class="heart heart-${currentHearRateZone}"></div>
          </div>
          <div class="row bigButton ${currentHearRateZone}">
            ${this.heartRate}
            <br />
            ${currentHearRateZone}
          </div>
        </div>
        <h2 ?hidden="${this.discountedMessage}">${this.discountedMessage}</h2>
        <br />
        <button ?hidden="${!this.isConnected}" class="c-button disconnect" @click="${this.request}">DISCONNECT</button>
      </section>
    `;
  }
}
