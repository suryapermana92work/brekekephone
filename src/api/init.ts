import { action } from 'mobx'

import { Store } from '.'

export default function init(this: Store) {
  if (this.initPromise) {
    return this.initPromise
  }
  this.initPromise = build(this.initFuncs).then(
    action(() => {
      this.isInitLoading = false
    }),
  )
  return this.initPromise
}

interface Init {
  (): Promise<unknown>
  dependencies?: Init[]
  promise?: Promise<unknown>
}

function build(f: Init | Init[]): Promise<unknown> {
  if (Array.isArray(f)) {
    return Promise.all(f.map(build))
  }
  if (f.promise) {
    // Already cached
  } else if (!f.dependencies?.length) {
    f.promise = f()
  } else {
    f.promise = build(f.dependencies).then(f)
  }
  return f.promise
}
