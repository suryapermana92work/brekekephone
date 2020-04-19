import { AppState } from 'react-native'

import { Store } from '.'

export default async function initReconnect(this: Store) {
  AppState.addEventListener('change', this.reconnectOnAppStateChange)
  return () => {
    AppState.removeEventListener('change', this.reconnectOnAppStateChange)
  }
}
