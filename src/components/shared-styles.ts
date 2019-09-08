import { css } from 'lit-element';

export const SharedStyles = css`
  :host {
    display: block;
    box-sizing: border-box;
  }

  section {
    padding: 24px;
    background: var(--app-section-odd-color);
  }

  section > * {
    max-width: 600px;
    margin-right: auto;
    margin-left: auto;
  }

  section:nth-of-type(even) {
    background: var(--app-section-even-color);
  }

  h2 {
    font-size: 24px;
    text-align: center;
    color: var(--app-dark-text-color);
  }

  @media (min-width: 460px) {
    h2 {
      font-size: 36px;
    }
  }

  .circle {
    display: block;
    width: 64px;
    height: 64px;
    margin: 0 auto;
    text-align: center;
    border-radius: 50%;
    background: var(--app-primary-color);
    color: var(--app-light-text-color);
    font-size: 30px;
    line-height: 64px;
  }
  .s-button {
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    font-size: 1.2rem;
    line-height: 1.8;
    border: 1px solid #ccc;
    background: #fff;
    padding: 2rem;
    margin-bottom: 1rem;
  }

  .c-button {
    box-sizing: border-box;
    width: 100%;
    height: 55px;
    margin: 8px;
    padding: 5px 0;
    background: #15619b;
    color: #fff;
    border: 0;
    border-radius: 4px;
    font-size: 1.2em;
    font-weight: bold;
    text-transform: uppercase;
    cursor: pointer;
  }
  .c-button.disconnect {
    opacity: 0.8;
  }
  .text-center {
    text-align: center;
  }
`;
