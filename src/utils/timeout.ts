import { action } from 'mobx'

export const batchRender = (fn: Function) => setTimeout(action(fn))

export const waitTimeout = (time = 300) =>
  new Promise(resolve => {
    setTimeout(resolve, time)
  })
