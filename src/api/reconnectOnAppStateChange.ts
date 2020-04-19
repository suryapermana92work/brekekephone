import { AppState } from 'react-native'

import { Store } from '.'

export default function reconnectOnAppStateChange(this: Store) {
  if (AppState.currentState === 'active') {
    this.reconnect()
  }
}
