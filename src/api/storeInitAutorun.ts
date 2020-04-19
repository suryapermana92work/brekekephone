import AsyncStorage from '@react-native-community/async-storage'
import get from 'lodash/get'
import set from 'lodash/set'
import { autorun, isObservableArray, toJS } from 'mobx'

import { intlDebug } from '../intl/intl'
import Rn from '../Rn'
import { keys, safeAssign } from '../utils/map'
import { Store } from '.'

const storeKey = '__SyncStore'

export default async function storeInitAutorun(this: Store) {
  try {
    const j = await AsyncStorage.getItem(storeKey)
    const v = j && JSON.parse(j)
    safeAssign(this, v)
  } catch (err) {
    Rn.showError({
      message: intlDebug`Failed to init data from storage`,
      err,
    })
  }
  let once = false
  return autorun(() => {
    if (!once) {
      once = true
      toJS(this)
      return
    }
    AsyncStorage.setItem(storeKey, toJSON(this)).catch((err: Error) => {
      Rn.showError({
        message: intlDebug`Failed to save data to storage`,
        err,
      })
    })
  })
}

export function sync(target: object, k: string) {
  setSync(target, k)
}
export function ignore(target: object, k: string) {
  setIgnore(target, k)
}

function toJSON(target: object) {
  return JSON.stringify(target, (_, v) => {
    if (
      typeof v !== 'object' ||
      !v ||
      Array.isArray(v) ||
      isObservableArray(v)
    ) {
      return v
    }
    return keys(v)
      .filter(k => (v === target ? isSync(v, k) : !isIgnore(v, k)))
      .reduce((m: object, k: string) => set(m, k, get(v, k)), {})
  })
}

const syncKey = '__sync'
function injectSyncKey(target: object) {
  if (syncKey in target) {
    return
  }
  Object.defineProperty(target, syncKey, {
    value: {},
    configurable: false,
    enumerable: false,
  })
}
function setSync(target: object, k: string) {
  injectSyncKey(target)
  set(target, `${syncKey}.${k}`, true)
}
function isSync(target: object, k: string) {
  return !!get(target, `${syncKey}.${k}`)
}
const ignoreKey = '__ignore'
function setIgnore(target: object, k: string) {
  injectSyncKey(target)
  set(target, `${syncKey}.${ignoreKey}.${k}`, true)
}
function isIgnore(target: object, k: string) {
  return !!get(target, `${syncKey}.${ignoreKey}.${k}`)
}
