import AsyncStorage from '@react-native-community/async-storage'

import { safeAssign } from '../utils/map'
import { Store } from '.'
import Account from './Account'

export default async function backwardCompatibility(api: Store) {
  await Promise.all([
    (async () => {
      const v = await AsyncStorage.getItem('_api_profiles')
      await AsyncStorage.removeItem('_api_profiles')
      interface Account0 extends Account {
        parks: Account['pbxParks']
        pbxTurnEnabled: Account['sipTurnEnabled']
        pushNotificationEnabled: Account['notificationEnabled']
      }
      return ((v ? JSON.parse(v) : []) as Account0[]).forEach(a => {
        api.accounts.push(
          safeAssign(new Account(api), {
            ...a,
            pbxParks: a.parks,
            sipTurnEnabled: a.pbxTurnEnabled,
            notificationEnabled: a.pushNotificationEnabled,
          }),
        )
      })
    })(),
    AsyncStorage.removeItem('locale'),
    AsyncStorage.removeItem('captureDebugLog'),
    AsyncStorage.removeItem('remoteVersion'),
    AsyncStorage.removeItem('androidBadgeNumber'),
  ])
}
