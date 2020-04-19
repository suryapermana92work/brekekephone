import { observe } from 'mobx'
import { observer } from 'mobx-react'
import React from 'react'

import api from '../../api'
import Rn from '../../Rn'
import pbx from '../api/pbx'
import sip from '../api/sip'
import updatePhoneIndex from '../api/updatePhoneIndex'
import authStore from '../global/authStore'
import { intlDebug } from '../intl/intl'

@observer
class AuthSIP extends React.Component {
  constructor() {
    // TODO notification login not work
    super()
    this.autoAuth()
    this.clearObserve = observe(authStore, 'sipShouldAuth', this.autoAuth)
  }
  componentWillUnmount() {
    this.clearObserve()
    api.sipSignInState = 'stopped'
    sip.disconnect()
  }

  _auth = async () => {
    api.sipSignInState = 'connecting'
    //
    const pbxConfig = await pbx.getConfig()
    if (!pbxConfig) {
      console.error('Invalid PBX config')
      return
    }
    //
    const sipWSSPort = pbxConfig['sip.wss.port']
    if (!sipWSSPort) {
      console.error('Invalid SIP WSS port')
      return
    }
    //
    const pbxUserConfig = await pbx.getUserForSelf(
      authStore.currentProfile.pbxTenant,
      authStore.currentProfile.pbxUsername,
    )
    if (!pbxUserConfig) {
      console.error('Invalid PBX user config')
      return
    }
    api.signedInAccount.data.props = pbxUserConfig
    //
    const language = pbxUserConfig.language
    void language
    //
    const webPhone = await updatePhoneIndex()
    if (!webPhone) {
      return
    }
    //
    const sipAccessToken = await pbx.createSIPAccessToken(webPhone.id)
    if (!sipAccessToken) {
      console.error('Invalid SIP access token')
      return
    }
    //
    await sip.connect({
      hostname: authStore.currentProfile.pbxHostname,
      port: sipWSSPort,
      tenant: authStore.currentProfile.pbxTenant,
      username: webPhone.id,
      accessToken: sipAccessToken,
      sipTurnEnabled: authStore.currentProfile.sipTurnEnabled,
    })
  }
  auth = () => {
    this._auth().catch(err => {
      api.sipSignInState = 'failure'
      authStore.sipTotalFailure += 1
      sip.disconnect()
      Rn.showError({
        message: intlDebug`Failed to connect to SIP`,
        err,
      })
    })
  }
  autoAuth = () => authStore.sipShouldAuth && this.auth()

  render() {
    return null
  }
}

export default AuthSIP
