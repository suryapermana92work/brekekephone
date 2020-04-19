import get from 'lodash/get'
import { has } from 'mobx'

export function safeAssign<T extends object | null | undefined>(
  t: T,
  o: unknown,
) {
  keys(t)
    .filter(k => get(o, k) !== undefined && get(o, k) !== null)
    .forEach(k => Object.assign(t, { [k]: get(o, k) }))
  return t
}

export function safeAssignArr<T extends object>(arr: unknown[], t: Function) {
  return arr.map(o => safeAssign(t(o) as T, o))
}

export function keys(v?: object | null) {
  const keys: string[] = []
  if (!v) {
    return keys
  }
  for (let k in v) {
    if (v.hasOwnProperty(k) || has(v, k)) {
      keys.push(k)
    }
  }
  return keys
}
