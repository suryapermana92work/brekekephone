import stringify from 'json-stable-stringify'
import { action, computed, observable } from 'mobx'
import { v4 as uuid } from 'react-native-uuid'

import { batchRender } from '../utils/timeout'
import { cacheSize } from '../variables'
import { Store } from '.'
import { ignore } from './storeInitAutorun'

export default class Account {
  @observable id = uuid()
  @observable pbxUsername = ''
  @observable pbxPassword = ''
  @observable pbxTenant = ''
  @observable pbxHostname = ''
  @observable pbxPort = ''
  @observable pbxPhoneIndex: '' | '1' | '2' | '3' | '4' = ''
  @observable pbxParks: string[] = []
  @observable sipTurnEnabled = false
  @observable ucEnabled = false
  @observable ucHostname = ''
  @observable ucPort = ''
  @observable notificationEnabled = true
  @ignore private api: Store

  constructor(api: Store) {
    this.api = api
  }

  @computed get dataId() {
    return stringify({
      u: this.pbxUsername,
      t: this.pbxTenant,
      h: this.pbxHostname,
      p: this.pbxPort,
    })
  }

  @computed get data(): AccountData {
    const { api, dataId } = this
    const d =
      api.accountData.find(d => d.id === dataId) || new AccountData(dataId)
    if (d !== api.accountData[0]) {
      batchRender(() => {
        const arr2 = [d, ...api.accountData.filter(d2 => d2 !== d)]
        if (arr2.length > cacheSize) {
          arr2.pop()
        }
        api.accountData = arr2
      })
    }
    return d
  }
}

export class AccountData {
  @observable id = ''
  @observable accessToken = ''
  @observable recentCalls: RecentCall[] = []
  @observable recentChats: RecentChat[] = []
  @ignore @observable voicemail = {
    new: 0,
  }
  @ignore props?: ExtensionProperties

  constructor(id: string) {
    this.id = id
  }

  @action insertRecentCall(c: RecentCall) {
    const arr = [c, ...this.recentCalls]
    if (arr.length > cacheSize) {
      arr.pop()
    }
    this.recentCalls = arr
  }
  @action insertRecentChat(c: RecentChat) {
    const arr = [c, ...this.recentChats]
    if (arr.length > cacheSize) {
      arr.pop()
    }
    this.recentChats = arr
  }
}

export interface RecentCall {
  id: string
  number: string
  name: string
  isIncoming: boolean
  isAnswered: boolean
  duration: number
  createdAt: number
}

export interface RecentChat {
  id: string
  name: string
  text: string
  isGroup: boolean
  isUnread: boolean
  createdAt: number
}

export interface ExtensionProperties {
  phones: ExtensionPropertiesPhone[]
}
export interface ExtensionPropertiesPhone {
  id: string
  type: string
}
