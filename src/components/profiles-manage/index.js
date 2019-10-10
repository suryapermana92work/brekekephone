import React, { Component } from 'react';
import { AppState } from 'react-native';
import { createModelView } from 'redux-model';
import createId from 'shortid';

import notiStore from '../../mobx/notiStore';
import * as routerUtils from '../../mobx/routerStore';
import { getUrlParams, setUrlParams } from '../../nativeModules/deeplink';
import { resetBadgeNumber } from '../../nativeModules/pushNotification';
import { compareNotiProfile, setProfiles, setProfilesManager } from './getset';
import UI from './ui';

const mapGetter = getter => (state, props) => ({
  profileIds: getter.profiles.idsByOrder(state),
  profileById: getter.profiles.detailMapById(state),
  callIds: getter.runningCalls.idsByOrder(state).filter(id => {
    const call = getter.runningCalls.detailMapById(state)[id];
    return call && call.incoming && !call.answered;
  }),
  callById: getter.runningCalls.detailMapById(state),
});

const mapAction = action => emit => ({
  createProfile(profile) {
    emit(action.profiles.create(profile));
  },
  updateProfile(profile) {
    emit(action.profiles.update(profile));
  },
  removeProfile(id) {
    emit(action.profiles.remove(id));
  },
  setAuthProfile(profile) {
    emit(action.auth.setProfile(profile));
  },
  updateCall(call) {
    emit(action.runningCalls.update(call));
  },
  showToast(message) {
    emit(action.toasts.create({ id: createId(), message }));
  },
});

let signinAtLeastOnce = false;

class View extends Component {
  async componentDidMount() {
    setProfilesManager(this);
    AppState.addEventListener(`change`, this.onAppStateChange);
    await this.handleUrlParams();
  }
  componentWillUnmount() {
    setProfilesManager(null);
    setUrlParams(null);
    AppState.removeEventListener(`change`, this.onAppStateChange);
  }

  onAppStateChange = () => {
    if (
      AppState.currentState === `active` &&
      !signinAtLeastOnce &&
      notiStore.notiArr.length
    ) {
      const n = notiStore.notiArr[0];
      const diff = Date.now() - new Date(n.createdAt).getTime();
      if (diff < 180000) {
        this.signinByCustomNoti(n);
      }
    }
  };

  handleUrlParams = async () => {
    //
    const urlParams = await getUrlParams();
    if (!urlParams) {
      return false;
    }
    const { tenant, user, _wn, host, port } = urlParams;
    if (!user || !tenant) {
      return false;
    }
    //
    const u = this.getProfileByCustomNoti({
      tenant,
      to: user,
      pbxHostname: host,
      pbxPort: port,
    });
    if (u) {
      if (_wn) {
        u.accessToken = _wn;
      }
      if (!u.pbxHostname) {
        u.pbxHostname = host;
      }
      if (!u.pbxPort) {
        u.pbxPort = port;
      }
      this.props.updateProfile(u);
      if (u.pbxPassword || u.accessToken) {
        this.signin(u.id);
      } else {
        routerUtils.goToProfileUpdate(u.id);
      }
      return true;
    }
    //
    const newU = {
      //
      id: createId(),
      pbxTenant: tenant,
      pbxUsername: user,
      //
      pbxHostname: host,
      pbxPort: port,
      pbxPassword: ``,
      pbxPhoneIndex: `4`,
      pbxTurnEnabled: false,
      pushNotificationEnabled: true,
      parks: [],
      ucEnabled: false,
      ucHostname: ``,
      ucPort: ``,
      //
      accessToken: _wn,
    };
    //
    this.props.createProfile(newU);
    if (newU.accessToken) {
      this.signin(newU.id);
    } else {
      routerUtils.goToProfileUpdate(newU.id);
    }
    return true;
  };

  getProfileByCustomNoti = n => {
    //
    const ids = Object.keys(this.props.profileById);
    for (let i = 0; i < ids.length; i++) {
      const id = ids[i];
      const profile = this.props.profileById[id];
      if (compareNotiProfile(n, profile)) {
        return profile;
      }
    }
    //
    return null;
  };

  signinByCustomNoti = n => {
    if (!n || !n.tenant || !n.to) {
      return false;
    }
    const u = this.getProfileByCustomNoti(n);
    if (!u) {
      return false;
    }
    return this.signin(u.id);
  };

  resolveProfile = id => {
    return this.props.profileById[id];
  };

  signin = id => {
    signinAtLeastOnce = true;
    const u = this.props.profileById[id];
    if (!u) {
      return false;
    }
    if (!u.pbxPassword && !u.accessToken) {
      routerUtils.goToProfileUpdate(u.id);
      this.props.showToast(`The profile password is empty`);
      return true;
    }
    this.props.setAuthProfile(u);
    routerUtils.goToAuth();
    resetBadgeNumber();
    return true;
  };

  render() {
    setProfiles(this.props.profileIds.map(id => this.props.profileById[id]));
    return (
      <UI
        profileIds={this.props.profileIds}
        resolveProfile={this.resolveProfile}
        create={routerUtils.goToProfilesCreate}
        update={routerUtils.goToProfileUpdate}
        signin={this.signin}
        remove={this.props.removeProfile}
      />
    );
  }
}

export { compareNotiProfile };
export default createModelView(mapGetter, mapAction)(View);
