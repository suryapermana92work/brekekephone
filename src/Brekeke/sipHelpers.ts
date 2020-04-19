import { Platform } from 'react-native'

import json from '../../package.json'
import Account from '../api/Account'
import turnConfig from '../api/turnConfig'
import { intlDebug } from '../intl/intl'
import Rn from '../Rn'
import { CallOptions, Pbx, Sip } from './types'

export async function sipCreate(a: Account) {
  const sourceId = await findFrontCamera()
  const sip = new window.Brekeke.WebrtcClient.Phone({
    logLevel: 'all',
    multiSession: true,
    defaultOptions: {
      videoOptions: {
        call: {
          mediaConstraints: sipCreateMediaConstraints(sourceId),
        },
        answer: {
          mediaConstraints: sipCreateMediaConstraints(sourceId),
        },
      },
    },
    dtmfSendMode: true,
    ctiAutoAnswer: true,
    eventTalk: true,
  })
  const { sipTurnEnabled } = a
  const callOptions: CallOptions = sipTurnEnabled ? turnConfig : {}
  if (!callOptions.pcConfig) {
    callOptions.pcConfig = {}
  }
  if (!Array.isArray(callOptions.pcConfig.iceServers)) {
    callOptions.pcConfig.iceServers = []
  }
  callOptions.pcConfig.bundlePolicy = 'balanced'
  sip.setDefaultCallOptions(callOptions)
  return sip
}
function sipCreateMediaConstraints(sourceId: string) {
  return ({
    audio: false,
    video: {
      mandatory: {
        minWidth: 0,
        minHeight: 0,
        minFrameRate: 0,
      },
      facingMode: Platform.OS === 'web' ? undefined : 'user',
      optional: sourceId ? [{ sourceId }] : [],
    },
  } as unknown) as MediaStreamConstraints
}

async function findFrontCamera() {
  if (!window.navigator.mediaDevices) {
    Rn.showError({
      message: intlDebug`Failed to get front camera information`,
      err: new Error(
        'Can not access window.navigator.mediaDevices, check if your connection is https secured',
      ),
    })
    return ''
  }
  try {
    const a = await window.navigator.mediaDevices.enumerateDevices()
    const i = ((a as unknown) as RnCompatibleDeviceInfo[]).find(
      i =>
        /video/i.test(i.kind) &&
        (/front/i.test(i.label) || /front/i.test(i.facing)),
    )
    return i?.deviceId || i?.id || ''
  } catch (err) {
    Rn.showError({
      message: intlDebug`Failed to get front camera information`,
      err,
    })
    return ''
  }
}
interface RnCompatibleDeviceInfo extends MediaDeviceInfo {
  id: string
  facing: string
}

export async function sipStartWebRTC(
  sip: Sip,
  pbx: Pbx,
  a: Account,
  user?: string,
) {
  if (!user) {
    throw new Error('Invalid response from api.updatePhoneIndex')
  }
  const auth = await pbx.pal('createAuthHeader', { username: user })
  if (!auth) {
    throw new Error('Invalid response from pbx.createAuthHeader')
  }
  const info = await pbx.pal('getProductInfo', null)
  const port = info?.['sip.wss.port']
  if (!port) {
    throw new Error('Invalid response from pbx.getProductInfo')
  }
  const { pbxHostname: host, pbxTenant: tenant } = a
  const os =
    Platform.OS === 'ios'
      ? 'iOS'
      : Platform.OS === 'android'
      ? 'Android'
      : Platform.OS === 'web'
      ? 'Web'
      : Platform.OS
  const v = json.version
  const jssipv = '3.2.15'
  const userAgent = `Brekeke Phone ${v} for ${os}, JsSIP ${jssipv}`
  sip.startWebRTC({
    user,
    auth,
    tenant,
    host,
    port,
    userAgent,
    tls: true,
    useVideoClient: true,
  })
}
