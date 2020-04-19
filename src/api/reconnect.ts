import { runInAction } from 'mobx'

import { Store } from '.'

export default function reconnect(this: Store) {
  runInAction(() => {
    this.pbxTotalFailure = 0
    this.sipTotalFailure = 0
    this.ucTotalFailure = 0
  })
}
