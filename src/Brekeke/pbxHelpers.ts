import get from 'lodash/get'

import Account, { ExtensionPropertiesPhone } from '../api/Account'
import intl, { intlDebug } from '../intl/intl'
import Rn from '../Rn'
import { Pbx } from './types'

export function pbxCreate(a: Account) {
  const {
    pbxHostname: h,
    pbxPort: p,
    pbxUsername: login_user,
    pbxTenant: tenant,
    pbxPassword: login_password,
    pbxParks: park,
    data: { accessToken: _wn },
  } = a
  const pbx = window.Brekeke.pbx.getPal(`wss://${h}:${p}/pbx/ws`, {
    tenant,
    login_user,
    login_password,
    park,
    voicemail: 'self',
    user: '*',
    status: true,
    secure_login_password: false,
    phonetype: 'webphone',
    _wn,
  })
  pbx.pal = (name, p) =>
    new Promise((resolve, reject) =>
      (get(pbx, name) as Function).call(pbx, p, resolve, reject),
    )
  return pbx
}

export async function getExtensionProperties(pbx: Pbx, a: Account) {
  if (a.data.props) {
    return
  }
  const r = (await pbx.pal('getExtensionProperties', {
    tenant: a.pbxTenant,
    extension: a.pbxUsername,
    property_names: ['p1_ptype', 'p2_ptype', 'p3_ptype', 'p4_ptype', 'pnumber'],
  })) as string[]
  const pnumber = r[4].split(',')
  a.data.props = {
    phones: [0, 1, 2, 3].map(i => ({
      id: pnumber[i],
      type: r[i],
    })),
  }
}
export function setExtensionProperties(pbx: Pbx, a: Account) {
  return pbx.pal('setExtensionProperties', {
    tenant: a.pbxTenant,
    extension: a.pbxUsername,
    properties: {
      // See ./getExtensionProperties for the detail of parameters
      pnumber: a.data.props?.phones.map(p => p.id).join(',') as string,
      [`p${a.pbxPhoneIndex}_ptype`]: a.data.props?.phones[
        (parseInt(a.pbxPhoneIndex) || 4) - 1
      ].type,
    },
  })
}

export async function updatePhoneIndex(
  pbx: Pbx,
  a: Account,
  signOut: Function,
) {
  let phone: ExtensionPropertiesPhone | null = null
  try {
    phone = await updatePhoneIndexWithoutCatch(pbx, a)
  } catch (err) {
    Rn.showError({
      message: intlDebug`Failed to update phone index`,
      err,
    })
  }
  if (!phone) {
    signOut()
  }
  return phone
}
async function updatePhoneIndexWithoutCatch(pbx: Pbx, a: Account) {
  await getExtensionProperties(pbx, a)
  const phones = a.data.props?.phones
  if (!phones) {
    throw new Error('Invalid props.phones from getExtensionProperties')
  }

  const phoneIndex = parseInt(a.pbxPhoneIndex) || 4
  const phone = phones[phoneIndex - 1]
  const isPhoneTypeCorrect = phone.type === 'Web Phone'
  const expectedPhoneId = `${a.pbxTenant}_${a.pbxUsername}_phone${phoneIndex}_webphone`
  const isPhoneIdCorrect = phone.id === expectedPhoneId

  if (isPhoneTypeCorrect && isPhoneIdCorrect) {
    return phone
  }
  if (isPhoneTypeCorrect && !isPhoneIdCorrect) {
    phone.id = expectedPhoneId
    await setExtensionProperties(pbx, a)
    return phone
  }
  if (!isPhoneTypeCorrect && !isPhoneIdCorrect) {
    phone.id = expectedPhoneId
    phone.type = 'Web Phone'
    await setExtensionProperties(pbx, a)
    return phone
  }
  try {
    await Rn.promptAsync({
      title: intl`Warning`,
      message: intl`This phone index is already in use. Do you want to continue?`,
    })
  } catch (err) {
    return null
  }
  phone.type = 'Web Phone'
  await setExtensionProperties(pbx, a)
  return phone
}
