import 'brekekejs/lib/webrtcclient';

import EventEmitter from 'eventemitter3';
import { Platform } from 'react-native';

import turnConfig from './turnConfig';

const getFrontSourceId = () => {
  const asyncFn = async () =>
    window.navigator.mediaDevices.enumerateDevices().then(infos => {
      let sourceId;

      infos.forEach(i => {
        if (i.kind === `video` && i.facing === `front`) {
          sourceId = i.id;
        }
      });

      return sourceId;
    });

  return asyncFn().catch(err => {
    console.error(`getFrontSourceId`, err);
  });
};

class CreatingSessions {
  _items;

  constructor() {
    this._items = [];
  }

  __add() {
    const currentTime = new Date().getTime();
    const expireVal = currentTime + 100000;

    const itm = {
      expire: expireVal,
    };

    this._items.push(itm);
  }

  __removeFirst() {
    this._items.splice(0, 1);
  }

  __refresh() {
    const currentTime = new Date().getTime();

    for (let i = 0; i < this._items.length; ) {
      const item = this._items[i];

      if (currentTime > item.expire) {
        this._items.splice(i, 1);
      } else {
        i++;
      }
    }
  }

  isEmpty() {
    this.__refresh();
    return this._items.length === 0;
  }

  __clear() {
    this._items.splice(0, this._items.length);
  }
}

class SIP extends EventEmitter {
  _creatingSessions;

  init = async () => {
    const sourceId = await getFrontSourceId();
    this._creatingSessions = new CreatingSessions();

    this.phone = new window.Brekeke.WebrtcClient.Phone({
      logLevel: `all`,
      multiSession: true,

      defaultOptions: {
        videoOptions: {
          call: {
            mediaConstraints: {
              audio: false,

              video: {
                mandatory: {
                  minWidth: 0,
                  minHeight: 0,
                  minFrameRate: 0,
                },

                facingMode: Platform.OS === `web` ? undefined : `user`,

                optional: sourceId
                  ? [
                      {
                        sourceId,
                      },
                    ]
                  : [],
              },
            },
          },

          answer: {
            mediaConstraints: {
              audio: false,

              video: {
                mandatory: {
                  minWidth: 0,
                  minHeight: 0,
                  minFrameRate: 0,
                },

                facingMode: Platform.OS === `web` ? undefined : `user`,

                optional: sourceId
                  ? [
                      {
                        sourceId,
                      },
                    ]
                  : [],
              },
            },
          },
        },
      },
    });

    this.phone.addEventListener(`phoneStatusChanged`, ev => {
      if (!ev) {
        return;
      }

      if (ev.phoneStatus === `started`) {
        return this.emit(`connection-started`);
      }

      if (ev.phoneStatus === `stopped`) {
        return this.emit(`connection-stopped`);
      }
    });

    this.phone.addEventListener(`sessionCreated`, ev => {
      if (!ev) {
        return;
      }

      if (ev.rtcSession.direction === `outgoing`) {
        this._creatingSessions.__removeFirst();
      }

      this.emit(`session-started`, {
        id: ev.sessionId,
        incoming: ev.rtcSession.direction === `incoming`,
        partyNumber: ev.rtcSession.remote_identity.uri.user,
        partyName: ev.rtcSession.remote_identity.display_name,
        remoteVideoEnabled: ev.remoteWithVideo,
        createdAt: Date.now(),
      });
    });

    this.phone.addEventListener(`sessionStatusChanged`, ev => {
      if (!ev) {
        return;
      }

      if (ev.sessionStatus === `terminated`) {
        return this.emit(`session-stopped`, ev.sessionId);
      }

      const patch = {
        answered: ev.sessionStatus === `connected`,
        remoteVideoEnabled: ev.remoteWithVideo,
        voiceStreamObject: ev.remoteStreamObject,
        localVideoEnabled: ev.withVideo,
      };

      if (ev.incomingMessage) {
        const pbxSessionInfo = ev.incomingMessage.getHeader(
          `X-PBX-Session-Info`,
        );

        if (typeof pbxSessionInfo === `string`) {
          const infos = pbxSessionInfo.split(`;`);
          patch.pbxTenant = infos[0];
          patch.pbxRoomId = infos[1];
          patch.pbxTalkerId = infos[2];
          patch.pbxUsername = infos[3];
        }
      }

      this.emit(`session-updated`, {
        id: ev.sessionId,
        ...patch,
      });

      this.emit(`video-session-updated`, ev);
    });

    this.phone.addEventListener(`videoClientSessionCreated`, ev => {
      if (!ev) {
        return;
      }

      const session = this.phone.getSession(ev.sessionId);
      const videoSession =
        session.videoClientSessionTable[ev.videoClientSessionId];

      this.emit(`session-updated`, {
        id: ev.sessionId,
        remoteVideoStreamObject: videoSession.remoteStreamObject,
      });

      this.emit(`video-session-created`, {
        id: ev.sessionId,
        videoSessionId: ev.videoClientSessionId,
        remoteVideoStreamObject: videoSession.remoteStreamObject,
      });
    });

    this.phone.addEventListener(`videoClientSessionEnded`, ev => {
      if (!ev) {
        return;
      }

      this.emit(`session-updated`, {
        id: ev.sessionId,
      });

      this.emit(`video-session-ended`, {
        id: ev.sessionId,
        videoSessionId: ev.videoClientSessionId,
      });
    });

    this.phone.addEventListener(`rtcErrorOccurred`, ev => {
      console.error(ev);
    });

    this._makeCallOptionsForAndoirOrIos = {
      rtcOfferConstraints: {
        mandatory: {
          OfferToReceiveAudio: true,
          OfferToReceiveVideo: false,
          _____SKIP_Adapter_fixRTCOfferOptions_____: true,
        },

        optional: [],
      },
    };
  };

  getCreatingSessions() {
    return this._creatingSessions;
  }

  connect(profile) {
    this._creatingSessions.__clear();
    let platformOs = Platform.OS;

    if (platformOs === `ios`) {
      platformOs = `iOS`;
    } else if (platformOs === `android`) {
      platformOs = `Android`;
    } else if (platformOs === `web`) {
      platformOs = `Web`;
    }

    const jssipVersion = `3.2.15`;
    const appPackageJson = require(`../../package.json`);
    const appVersion = appPackageJson.version;
    const lUseragent =
      `Brekeke Phone for ` +
      platformOs +
      ` ` +
      appVersion +
      `/JsSIP ` +
      jssipVersion;
    const config = profile.pbxTurnEnabled ? turnConfig : {};

    if (!config.pcConfig) {
      config.pcConfig = {};
    }

    if (!Array.isArray(config.pcConfig.iceServers)) {
      config.pcConfig.iceServers = [];
    }

    config.pcConfig.bundlePolicy = `balanced`;
    this.phone.setDefaultCallOptions(config);

    this.phone.startWebRTC({
      host: profile.hostname,
      port: profile.port,
      tls: true,
      tenant: profile.tenant,
      user: profile.username,
      password: profile.password,
      auth: profile.accessToken,
      useVideoClient: true,
      userAgent: lUseragent,
    });
  }

  disconnect() {
    this.phone.stopWebRTC();
  }

  createSession(number, opts = {}) {
    const options =
      Platform.OS === `android` || Platform.OS === `ios`
        ? this._makeCallOptionsForAndoirOrIos
        : null;
    this.phone.makeCall(number, options, opts.videoEnabled, undefined, ``);
    this._creatingSessions.__add();
  }

  hangupSession(sessionId) {
    const session = this.phone.getSession(sessionId);
    const rtcSession = session && session.rtcSession;
    rtcSession && rtcSession.terminate();
  }

  answerSession(sessionId, opts = {}) {
    this.phone.answer(sessionId, null, opts.videoEnabled);
  }

  sendDTMF(dtmf, sessionId) {
    this.phone.sendDTMF(dtmf, sessionId);
  }

  enableVideo(sessionId) {
    this.phone.setWithVideo(sessionId, true);
  }

  disableVideo(sessionId) {
    this.phone.setWithVideo(sessionId, false);
  }

  setMuted(muted, sessionId) {
    this.phone.setMuted({ main: muted }, sessionId);
  }
}

const sip = new SIP();
sip.init();
export default sip;