import debounce from 'lodash/debounce'
import { computed, observable } from 'mobx'

import api from '../../api'
import Account from '../../api/Account'
import Rn from '../../Rn'
import { safeAssign } from '../../utils/map'
import sip from '../api/sip'
import { intlDebug } from '../intl/intl'
import { getUrlParams } from '../native/deeplink'
import { AppState } from '../Rn'
import { arrToMap } from '../utils/toMap'
import g from './_'
import callStore from './callStore'

const compareField = (p1, p2, field) => {
  const v1 = p1[field]
  const v2 = p2[field]
  return !v1 || !v2 || v1 === v2
}
const compareProfile = (p1, p2) => {
  return (
    p1.pbxUsername && // Must have pbxUsername
    compareField(p1, p2, 'pbxUsername') &&
    compareField(p1, p2, 'pbxTenant') &&
    compareField(p1, p2, 'pbxHostname') &&
    compareField(p1, p2, 'pbxPort')
  )
}

class AuthStore {
  @observable pbxTotalFailure = 0
  @observable sipTotalFailure = 0
  @observable ucTotalFailure = 0
  @computed get pbxShouldAuth() {
    return (
      this.signedInId &&
      (api.pbxSignInState === 'stopped' ||
        (api.pbxSignInState === 'failure' && !this.pbxTotalFailure))
    )
  }
  @computed get pbxConnectingOrFailure() {
    return ['connecting', 'failure'].some(s => s === api.pbxSignInState)
  }
  @computed get sipShouldAuth() {
    return (
      api.pbxSignInState === 'success' &&
      (api.sipSignInState === 'stopped' ||
        (api.sipSignInState === 'failure' && !this.sipTotalFailure))
    )
  }
  @computed get sipConnectingOrFailure() {
    return ['connecting', 'failure'].some(s => s === api.sipSignInState)
  }
  @computed get ucShouldAuth() {
    return (
      this.currentProfile?.ucEnabled &&
      api.ucSignInState !== 'signed-in-from-other-place' &&
      !this.isSignInByNotification &&
      (api.ucSignInState === 'stopped' ||
        (api.ucSignInState === 'failure' && !this.ucTotalFailure))
    )
  }
  @computed get ucConnectingOrFailure() {
    return (
      this.currentProfile?.ucEnabled &&
      ['connecting', 'failure'].some(s => s === api.ucSignInState)
    )
  }
  @computed get shouldShowConnStatus() {
    return (
      this.pbxConnectingOrFailure ||
      this.sipConnectingOrFailure ||
      this.ucConnectingOrFailure
    )
  }
  @computed get isConnFailure() {
    return [
      api.pbxSignInState,
      api.sipSignInState,
      this.currentProfile?.ucEnabled && api.ucSignInState,
    ].some(s => s === 'failure')
  }

  findProfile = _p => {
    return api.accounts.find(p => compareProfile(p, _p))
  }
  pushRecentCall = call => {
    return api.signedInAccount?.data.insertRecentCall(call)
  }
  //
  @computed get _profilesMap() {
    return arrToMap(api.accounts, 'id', p => p)
  }
  getProfile = id => {
    return this._profilesMap[id]
  }

  @observable signedInId = null
  @computed get currentProfile() {
    return this.getProfile(this.signedInId)
  }
}

const authStore = new AuthStore()

export { compareProfile }
export default authStore
