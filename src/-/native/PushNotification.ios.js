import './callkeep'

import PushNotificationIOS from '@react-native-community/push-notification-ios'
import { AppState } from 'react-native'

import g from '../global'
import parse from './PushNotification-parse'

let apnsToken = ''
const onToken = t => {
  if (t) {
    console.error(t)
    apnsToken = t
  }
}
const onNotification = async (n, initApp) => {
  initApp()
  const msg = JSON.stringify(n)
  g.showError({
    message: msg,
  })
  n = await parse(n)
  if (!n) {
    return
  }
  //
  PushNotificationIOS.getApplicationIconBadgeNumber(badge => {
    badge = (badge || 0) + 1
    if (AppState.currentState === 'active') {
      badge = 0
    }
    PushNotificationIOS.presentLocalNotification({
      alertBody: n.body,
      alertAction: n.isCall ? 'Answer' : 'View',
      soundName: n.isCall ? 'incallmanager_ringtone.mp3' : undefined,
      applicationIconBadgeNumber: badge,
    })
    PushNotificationIOS.setApplicationIconBadgeNumber(badge)
  })
}

const PushNotification = {
  register: initApp => {
    setTimeout(initApp)
    PushNotificationIOS.addEventListener('register', onToken)
    PushNotificationIOS.addEventListener('notification', n =>
      onNotification(n, initApp),
    )
    PushNotificationIOS.addEventListener('localNotification', n =>
      onNotification(n, initApp),
    )
    PushNotificationIOS.requestPermissions()
  },
  getToken: () => {
    return Promise.resolve(apnsToken)
  },
  resetBadgeNumber: () => {
    PushNotificationIOS.setApplicationIconBadgeNumber(0)
  },
}

export default PushNotification
