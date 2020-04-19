export default null

// handleUrlParams = async () => {
//   await api.init()
//   const urlParams = await getUrlParams()
//   if (!urlParams) {
//     return
//   }
//   //
//   const { _wn, host, phone_idx, port, tenant, user } = urlParams
//   if (!tenant || !user) {
//     return
//   }
//   //
//   const p = this.findProfile({
//     pbxUsername: user,
//     pbxTenant: tenant,
//     pbxHostname: host,
//     pbxPort: port,
//   })
//   const pbxPhoneIndex = `${parseInt(phone_idx) || 4}`
//   //
//   if (p) {
//     if (_wn) {
//       p.data.accessToken = _wn
//     }
//     if (!p.pbxHostname) {
//       p.pbxHostname = host
//     }
//     if (!p.pbxPort) {
//       p.pbxPort = port
//     }
//     p.pbxPhoneIndex = pbxPhoneIndex
//     //
//     api.updateAccount(p.id, p)
//     if (p.pbxPassword || p.data.accessToken) {
//       this.signIn(p.id)
//     } else {
//       g.goToPageProfileUpdate(p.id)
//     }
//     return
//   }
//   //
//   const newP = safeAssign(new Account(api), {
//     pbxTenant: tenant,
//     pbxUsername: user,
//     pbxHostname: host,
//     pbxPort: port,
//     pbxPhoneIndex,
//   })
//   newP.data.accessToken= _wn
//   //
//   api.insertAccount(newP)
//   if (newP.data.accessToken) {
//     this.signIn(newP.id)
//   } else {
//     g.goToPageProfileUpdate(newP.id)
//   }
// }

// @observable isSignInByNotification = false
// clearSignInByNotification = debounce(
//   () => {
//     // clearSignInByNotification will activate UC login
//     // We will only allow UC login when the app is active
//     if (AppState.currentState !== 'active') {
//       setTimeout(this.clearSignInByNotification, 17)
//     } else {
//       this.isSignInByNotification = false
//     }
//   },
//   10000,
//   {
//     maxWait: 15000,
//   },
// )

// signInByNotification = async n => {
//   const state = AppState.currentState
//   await api.init()
//   // Find account for the notification target
//   const p = this.findProfile({
//     ...n,
//     pbxUsername: n.to,
//     pbxTenant: n.tenant,
//   })
//   if (!p?.id || !p.notificationEnabled) {
//     return false
//   }
//   // Use isSignInByNotification to disable UC auto sign in for a while
//   if (n.isCall) {
//     this.isSignInByNotification = true
//     this.clearSignInByNotification()
//   }
//   // In case the app is already signed in
//   if (this.signedInId) {
//     // Always show notification if the signed in id is another account
//     if (this.signedInId !== p.id) {
//       return true
//     }
//     // Attempt to reconnect on notification if state is currently failure
//     this.reconnect()
//     return state !== 'active'
//   }
//   // Call signIn
//   return this.signIn(p?.id)
// }
