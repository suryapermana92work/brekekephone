import { observe } from 'mobx'
import { observer } from 'mobx-react'
import React from 'react'

import api from '../../api'
import Rn from '../../Rn'
import pbx from '../api/pbx'
import authStore from '../global/authStore'
import { intlDebug } from '../intl/intl'

@observer
class AuthPBX extends React.Component {
  constructor() {
    // TODO notification login not work
    super()
    this.autoAuth()
    this.clearObserve = observe(authStore, 'pbxShouldAuth', this.autoAuth)
  }
  componentWillUnmount() {
    this.clearObserve()
    pbx.disconnect()
    api.pbxSignInState = 'stopped'
  }
  auth = () => {
    pbx.disconnect()
    api.pbxSignInState = 'connecting'
    pbx
      .connect(authStore.currentProfile)
      .then(() => {
        api.pbxSignInState = 'success'
      })
      .catch(err => {
        api.pbxSignInState = 'failure'
        authStore.pbxTotalFailure += 1
        Rn.showError({
          message: intlDebug`Failed to connect to pbx`,
          err,
        })
      })
  }
  autoAuth = () => authStore.pbxShouldAuth && this.auth()

  render() {
    return null
  }
}

export default AuthPBX
