import './AppWeb.scss';

import { mdiAndroidHead, mdiApple, mdiWeb } from '@mdi/js';
import Icon from '@mdi/react';
import React from 'react';
import { isAndroid, isIOS } from 'react-device-detect';

import App from './App';
import brandSrc from './assets/brand.png';
import iconSrc from './assets/icon.png';

class AppWeb extends React.Component {
  state = {
    useWebVersion: !isIOS && !isAndroid,
  };
  enableWebVersion = e => {
    e.preventDefault();
    this.setState({
      useWebVersion: true,
    });
  };

  render() {
    if (this.state.useWebVersion) {
      return <App />;
    }
    const q = window.location.search;
    const appUrl = isIOS
      ? `brekekeapp://open${q}`
      : `intent://open${q}#Intent;scheme=brekekeapp;package=com.brekeke.phone;end`;
    return (
      <div className="AppWeb">
        <img className="icon" src={iconSrc} alt="Brekeke Phone" />
        <img className="brand" src={brandSrc} alt="Brekeke Phone" />
        <div className="btns">
          <a href={appUrl}>
            <div className="btn app">
              Open in app
              <Icon path={isIOS ? mdiApple : mdiAndroidHead} />
            </div>
          </a>
          <a href="." onClick={this.enableWebVersion}>
            <div className="btn browser">
              Open in browser
              <Icon path={mdiWeb} />
            </div>
          </a>
        </div>
      </div>
    );
  }
}

export default AppWeb;
