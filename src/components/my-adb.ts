import { html, customElement, LitElement, css, property } from 'lit-element';

// These are the shared styles needed by this element.
import { SharedStyles } from './shared-styles.js';
import { Adb } from '../utils/webadb.js';

@customElement('my-adb')
export class MyADB extends LitElement {
  static get styles() {
    return [
      SharedStyles,
      css`
        input {
          margin: 15px 0;
          border: 0;
          padding: 30px;
          box-shadow: 2px 4px 10px #ccc;
          width: 100%;
          font-size: 150%;
          margin-bottom: 15px;
        }
        .loading {
          width: 100%;
          height: 100%;
          position: fixed;
          top: 0;
          left: 0;
          background: rgba(0, 0, 0, 0.2);
        }
        .stdin {
          padding: 8px;
        }
        .stdout {
          padding: 12px 16px;
          font-weight: bold;
          font-size: 22px;
        }
        pre {
          white-space: pre-wrap;
          word-wrap: break-word;
          text-align: justify;
        }
      `
    ];
  }

  @property({ type: String })
  stdout = '';
  @property({ type: Boolean })
  loading = false;
  @property({ type: String })
  url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d7/Android_robot.svg/1022px-Android_robot.svg.png';
  @property()
  vm: any = null;
  @property()
  shellStr = 'ls -l /sdcard/DCIM/Camera';
  @property()
  boot: any = null;
  @property()
  sync: any = null;

  async disconnect() {
    this.vm.close();
    this.vm = null;
    this.stdout = '';
    this.loading = false;
    this.shellStr = 'ls -l /sdcard/DCIM/Camera';
    this.url = '';
    this.boot = null;
    await this.sync.quit();
    this.sync = null;
    return;
  }

  async connect() {
    if (this.vm) {
      return;
    }
    try {
      this.vm = await Adb.open('WebUSB');
      this.boot = await this.vm.connectAdb('host::');
      this.sync = await this.boot.sync();
      console.log('Conneted to WebUSB');
    } catch (error) {
      this.vm = null;
      this.boot = null;
      this.sync = null;
    }
  }

  async install(value: any) {
    if (value) {
      this.url = value;
    }
    this.loading = true;
    try {
      let res = await fetch(this.url);
      let data = await res.blob();
      let name = this.url.split('/').reverse()[0];
      let file = new File([data], name);
      this.sync.push(file, `/sdcard/Download/${name}`, '0644', (e: any) => {
        console.log(e, 'Done sending file');
        this.loading = false;
      });
    } catch (e) {
      console.log(e);
    }
    this.loading = false;
  }

  async shell(str: any) {
    if (!str) {
      return;
    }
    let shell = await this.boot.shell(str);
    let decoder = new TextDecoder();
    let html = '';
    let r = null;
    r = await shell.receive();
    while (r.cmd == 'WRTE') {
      if (r.data != null) {
        html += decoder.decode(r.data);
      }
      shell.send('OKAY');
      r = await shell.receive();
    }
    this.stdout = html;
  }

  async doshell() {}

  async list() {
    let shell = await this.boot.shell('ls /sdcard/DCIM/Camera');
    let decoder = new TextDecoder();
    let html = '';
    let r = null;
    r = await shell.receive();
    while (r.cmd == 'WRTE') {
      if (r.data != null) {
        html += `${decoder.decode(r.data)}`;
      }
      shell.send('OKAY');
      r = await shell.receive();
    }
    this.stdout = html;
  }

  async download() {
    let content = await this.sync.pull('/sdcard/Download/sample.png');
    let a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([content]));
    a.download = 'test_webadb.png';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  protected render() {
    return html`
      <section>
        <h2>ADB demo</h2>
        <div class="text-center">
          <img style="width:200px" src="/images/adb.png" />
        </div>
        <button class="c-button" ?hidden="${this.vm}" @click="${this.connect}">CONNECT</button>

        ${this.vm && this.sync
          ? html`
              <div class="box">
                <div class>
                  <button class="c-button" @click="${() => this.install('')}">install</button>
                  <div class="item">
                    <input
                      type="text"
                      @change="${(event: any) => this.install(event.target.value)}"
                      value="${this.url}"
                      placeholder="/sdcard/Download/test.apk"
                      class="stdin"
                    />
                  </div>
                </div>
                <br />
                <br />
                <div class>
                  <div class="label">
                    <button class="c-button" @click="${() => this.list()}">List Camera</button>
                    <button class="c-button" @click="${() => this.shell(this.shellStr)}">Shell</button>
                  </div>
                  <br />
                  <div class="item">
                    <input
                      type="text"
                      @change="${(event: any) => this.shell(event.target.value)}"
                      value="${this.shellStr}"
                      placeholder="ls /sdcard"
                      class="stdin"
                    />
                  </div>
                </div>
                <br />
                <br />
                <div class="doconnect box">
                  <div class>
                    <button class="c-button" @click="${() => this.download()}">Download</button>
                  </div>
                </div>
                <pre class="stdout">${this.stdout}</pre>
              </div>
              <div ?hidden="${!this.loading}" class="loading"></div>
            `
          : html``}
        ${this.vm && !this.sync
          ? html`
              <button class="c-button disconnect">
                Please accept permission on your phone
              </button>
            `
          : this.vm && this.sync
          ? html`
              <button class="c-button disconnect" @click="${this.disconnect}">
                DISCONNECT
              </button>
            `
          : html``}
      </section>
    `;
  }
}
