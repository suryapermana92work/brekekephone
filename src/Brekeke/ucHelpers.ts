import Account from '../api/Account'
import { UcChatClient } from './types'

export function ucSignIn(
  uc: UcChatClient,
  a: Account,
  onSuccess: () => void,
  onFailure: (err: Error) => void,
) {
  uc.signIn(
    `https://${a.ucHostname}:${a.ucPort}`,
    'uc',
    a.pbxTenant,
    a.pbxUsername,
    a.pbxPassword,
    null,
    onSuccess,
    onFailure,
  )
}
