import 'brekekejs/lib/jsonrpc'
import 'brekekejs/lib/webrtcclient'
import 'brekekejs/lib/pal'

import UcClient from 'brekekejs/lib/ucclient'
import uniqBy from 'lodash/uniqBy'
import { action, autorun, computed, observable } from 'mobx'

import {
  Pbx,
  pbxCreate,
  PbxEvent,
  Sip,
  sipCreate,
  SipEventMap,
  sipStartWebRTC,
  UcChatClient,
  UcEventMap,
  ucSignIn,
  updatePhoneIndex,
} from '../Brekeke'
import { intlDebug } from '../intl/intl'
import Rn from '../Rn'
import { safeAssign, safeAssignArr } from '../utils/map'
import { batchRender } from '../utils/timeout'
import {
  pbxSignInTimeout,
  sipSignInTimeout,
  ucSignInTimeout,
} from '../variables'
import Account, { AccountData } from './Account'
import backwardCompatibility from './backwardCompatibility'
import init, { Init } from './init'
import reconnect from './reconnect'
import reconnectInitOnAppStateChange from './reconnectInitOnAppStateChange'
import reconnectOnAppStateChange from './reconnectOnAppStateChange'
import syncInitStore, { initSyncStore, sync } from './storeInitAutorun'

export class Store {
  protected initSyncStore = async () => {
    await initSyncStore(this)
    await backwardCompatibility(this)
    this.accounts = safeAssignArr(
      uniqBy(this.accounts, 'id'),
      () => new Account(this),
    )
    this.accountData = safeAssignArr(
      uniqBy(this.accountData, 'id'),
      (d: AccountData) => new AccountData(d.id),
    )
  }

  protected initAutorunAuth = async () => {
    autorun(() => {
      if (!this.signedInAccount) {
        batchRender(this.pbxSignOut)
        batchRender(this.sipSignOut)
        batchRender(this.ucSignOut)
        return
      }
      if (
        this.pbxSignInState === 'stopped' ||
        (this.pbxSignInState === 'failure' && !this.pbxTotalFailure)
      ) {
        batchRender(this.pbxSignIn)
      }
      if (
        this.pbxSignInState === 'success' &&
        (this.sipSignInState === 'stopped' ||
          (this.sipSignInState === 'failure' && !this.sipTotalFailure))
      ) {
        batchRender(this.sipSignIn)
      }
      if (
        this.signedInAccount.ucEnabled &&
        (this.ucSignInState === 'stopped' ||
          (this.ucSignInState === 'failure' && !this.ucTotalFailure))
      ) {
        batchRender(this.ucSignIn)
      }
    })
  }

  /* AUTH */
  /* ----------------------------------------------------------------------- */
  /* ----------------------------------------------------------------------- */
  @sync @observable accounts: Account[] = []
  @sync @observable accountData: AccountData[] = []
  @observable protected signedInAccountId = ''
  @computed get signedInAccount() {
    return this.accounts.find(a => a.id === this.signedInAccountId)
  }
  @action signIn = (a: Account) => {
    this.signedInAccountId = a.id
    if (!a.pbxPassword && !a.data.accessToken) {
      // g.goToPageProfileUpdate(a.id) // TODO
      Rn.showError({
        message: intlDebug`The account password is empty`,
      })
      return true
    }
    if (a.ucEnabled && (!a.ucHostname || !a.ucPort)) {
      // g.goToPageProfileUpdate(a.id) // TODO
      Rn.showError({
        message: intlDebug`The UC config is missing`,
      })
      return true
    }
  }
  @action signOut = () => {
    this.signedInAccountId = ''
    // TODO hangup pending call show/hide loader
    // TODO reinit state
  }
  @action insertAccount = (a: Account) => {
    this.accounts.push(a)
  }
  @action updateAccount = (id: string, a: Partial<Account>) => {
    safeAssign(
      this.accounts.find(a => a.id === id),
      a,
    )
  }
  @action removeAccount = (id: string) => {
    this.accounts = this.accounts.filter(a => a.id !== id)
  }
  reconnect = reconnect.bind(this)
  reconnectOnAppStateChange = reconnectOnAppStateChange.bind(this)
  reconnectInitOnAppStateChange = reconnectInitOnAppStateChange.bind(this)

  /* PBX */
  /* ----------------------------------------------------------------------- */
  /* ----------------------------------------------------------------------- */
  protected pbx?: Pbx
  @observable pbxSignInState: SignInState = 'stopped'
  @observable protected pbxTotalFailure = 0
  protected pbxSignInTimeoutId = 0

  @action protected pbxSignIn = () => {
    if (!this.signedInAccount) {
      return
    }
    this.pbxSignOut()
    this.pbxSignInState = 'connecting'
    const pbx = pbxCreate(this.signedInAccount)
    pbx.onClose = this.pbxOnClose
    pbx.onError = this.pbxOnError
    pbx.notify_serverstatus = this.pbxOnServerStatus
    pbx.notify_status = this.pbxOnUserStatus
    pbx.notify_park = this.pbxOnPark
    pbx.notify_voicemail = this.pbxOnVoicemail
    this.pbx = pbx
    this.pbxSignInTimeoutId = setTimeout(
      () => this.pbxSignInFailure(new Error('Connection timeout')),
      pbxSignInTimeout,
    )
    this.pbx.login(this.pbxSignInSuccess, this.pbxSignInFailure)
  }
  @action protected pbxSignInSuccess = () => {
    if (this.pbxSignInState !== 'connecting') {
      return
    }
    clearTimeout(this.pbxSignInTimeoutId)
    this.pbxSignInTimeoutId = 0
    this.pbxSignInState = 'success'
  }
  @action protected pbxSignInFailure = (err: Error) => {
    Rn.showError({
      message: intlDebug`Failed to connect to PBX`,
      err,
    })
    this.pbxSignOut()
    this.pbxSignInState = 'failure'
    this.pbxTotalFailure += 1
  }
  @action protected pbxSignOut = () => {
    const { pbx } = this
    if (pbx) {
      pbx.onClose = undefined
      pbx.onError = undefined
      pbx.notify_serverstatus = undefined
      pbx.notify_status = undefined
      pbx.notify_park = undefined
      pbx.notify_voicemail = undefined
      pbx.close()
      this.pbx = undefined
    }
    this.pbxSignInSuccess()
    this.pbxSignInState = 'stopped'
  }

  protected pbxOnClose = () => {
    this.pbxSignOut()
  }
  protected pbxOnError = (unexpectedErr: Error) => {
    Rn.showError({ unexpectedErr })
  }
  @action protected pbxOnServerStatus = (e: PbxEvent['serverStatus']) => {
    if (e.status === 'inactive') {
      this.pbxSignOut()
    }
  }
  @action protected pbxOnUserStatus = (e: PbxEvent['userStatus']) => {
    void e // TODO
  }
  @action protected pbxOnPark = (e: PbxEvent['park']) => {
    void e // TODO
  }
  @action protected pbxOnVoicemail = (e: PbxEvent['voicemail']) => {
    Object.assign(this.signedInAccount?.data.voicemail, e)
  }

  /* SIP */
  /* ----------------------------------------------------------------------- */
  /* ----------------------------------------------------------------------- */
  protected sip?: Sip
  @observable sipSignInState: SignInState = 'stopped'
  @observable protected sipTotalFailure = 0
  protected sipSignInTimeoutId = 0

  protected sipSignIn = async () => {
    if (!this.signedInAccount || !this.pbx) {
      return
    }
    this.sipSignOut()
    this.sipSignInState = 'connecting'
    const sip = await sipCreate(this.signedInAccount)
    sip.addEventListener('phoneStatusChanged', this.sipOnPhoneStatusChange)
    sip.addEventListener('sessionCreated', this.sipOnSessionCreated)
    sip.addEventListener('sessionStatusChanged', this.sipOnSessionStatusChanged)
    sip.addEventListener(
      'videoClientSessionCreated',
      this.sipOnVideoClientSessionCreated,
    )
    sip.addEventListener(
      'videoClientSessionEnded',
      this.sipOnVideoClientSessionEnded,
    )
    sip.addEventListener('rtcErrorOccurred', this.sipOnRtcErrorOccurred)
    this.sip = sip
    this.sipSignInTimeoutId = setTimeout(
      () => this.sipSignInFailure(new Error('Connection timeout')),
      sipSignInTimeout,
    )
    const phone = await updatePhoneIndex(
      this.pbx,
      this.signedInAccount,
      this.signOut,
    )
    await sipStartWebRTC(sip, this.pbx, this.signedInAccount, phone?.id)
  }
  @action protected sipSignInSuccess = () => {
    if (this.sipSignInState !== 'connecting') {
      return
    }
    clearTimeout(this.sipSignInTimeoutId)
    this.sipSignInTimeoutId = 0
    this.sipSignInState = 'success'
  }
  @action protected sipSignInFailure = (err: Error) => {
    Rn.showError({
      message: intlDebug`Failed to connect to SIP`,
      err,
    })
    this.sipSignOut()
    this.sipSignInState = 'failure'
    this.sipTotalFailure += 1
  }
  sipSignOut = () => {
    const { sip } = this
    if (sip) {
      sip.removeEventListener('phoneStatusChanged', this.sipOnPhoneStatusChange)
      sip.removeEventListener('sessionCreated', this.sipOnSessionCreated)
      sip.removeEventListener(
        'sessionStatusChanged',
        this.sipOnSessionStatusChanged,
      )
      sip.removeEventListener(
        'videoClientSessionCreated',
        this.sipOnVideoClientSessionCreated,
      )
      sip.removeEventListener(
        'videoClientSessionEnded',
        this.sipOnVideoClientSessionEnded,
      )
      sip.removeEventListener('rtcErrorOccurred', this.sipOnRtcErrorOccurred)
      sip.stopWebRTC()
      this.sip = undefined
    }
    this.sipSignInSuccess()
    this.sipSignInState = 'stopped'
  }

  protected sipOnPhoneStatusChange = (e: SipEventMap['phoneStatusChanged']) => {
    if (e.phoneStatus === 'started') {
      this.sipSignInState = 'success'
    } else if (e.phoneStatus === 'stopping' || e.phoneStatus === 'stopped') {
      this.sipSignOut()
    }
  }
  protected sipOnSessionCreated = (e: SipEventMap['sessionCreated']) => {
    void e // TODO
  }
  protected sipOnSessionStatusChanged = (
    e: SipEventMap['sessionStatusChanged'],
  ) => {
    void e // TODO
  }
  protected sipOnVideoClientSessionCreated = (
    e: SipEventMap['videoClientSessionCreated'],
  ) => {
    void e // TODO
  }
  protected sipOnVideoClientSessionEnded = (
    e: SipEventMap['videoClientSessionEnded'],
  ) => {
    void e // TODO
  }
  protected sipOnRtcErrorOccurred = (unexpectedErr: Error) => {
    Rn.showError({ unexpectedErr })
  }

  /* UC */
  /* ----------------------------------------------------------------------- */
  /* ----------------------------------------------------------------------- */
  protected uc?: UcChatClient
  @observable ucSignInState: SignInState | UcSignInState = 'stopped'
  @observable protected ucTotalFailure = 0
  protected ucSignInTimeoutId = 0

  protected ucSignIn = () => {
    if (!this.signedInAccount) {
      return
    }
    this.ucSignOut()
    const uc = new UcClient.ChatClient(new UcClient.Logger('all'))
    uc.setEventListeners({
      forcedSignOut: this.onUcForcedSignOut,
      buddyStatusChanged: this.onUcBuddyStatusChanged,
      receivedTyping: this.onUcReceivedTyping,
      receivedText: this.onUcReceivedText,
      fileReceived: this.onUcFileReceived,
      fileInfoChanged: this.onUcFileInfoChanged,
      fileTerminated: this.onUcFileTerminated,
      invitedToConference: this.onUcInvitedToConference,
      conferenceMemberChanged: this.onUcConferenceMemberChanged,
    })
    this.uc = uc
    this.ucSignInTimeoutId = setTimeout(
      () => this.ucSignInFailure(new Error('Connection timeout')),
      ucSignInTimeout,
    )
    ucSignIn(
      uc,
      this.signedInAccount,
      this.ucSignInSuccess,
      this.ucSignInFailure,
    )
  }
  @action protected ucSignInSuccess = () => {
    if (this.ucSignInState !== 'connecting') {
      return
    }
    clearTimeout(this.ucSignInTimeoutId)
    this.ucSignInTimeoutId = 0
    this.ucSignInState = 'success'
  }
  @action protected ucSignInFailure = (err: Error) => {
    Rn.showError({
      message: intlDebug`Failed to connect to UC`,
      err,
    })
    this.ucSignOut()
    this.ucSignInState = 'failure'
    this.ucTotalFailure += 1
  }
  @action protected ucSignOut = () => {
    const { uc } = this
    if (uc) {
      uc.setEventListeners({
        forcedSignOut: undefined,
        buddyStatusChanged: undefined,
        receivedTyping: undefined,
        receivedText: undefined,
        fileReceived: undefined,
        fileInfoChanged: undefined,
        fileTerminated: undefined,
        invitedToConference: undefined,
        conferenceMemberChanged: undefined,
      })
      uc.signOut()
      this.uc = undefined
    }
    this.ucSignInSuccess()
    this.ucSignInState = 'stopped'
  }

  protected onUcForcedSignOut = (e: UcEventMap['forcedSignOut']) => {
    void e // TODO
  }
  protected onUcBuddyStatusChanged = (e: UcEventMap['buddyStatusChanged']) => {
    void e // TODO
  }
  protected onUcReceivedTyping = (e: UcEventMap['receivedTyping']) => {
    void e // TODO
  }
  protected onUcReceivedText = (e: UcEventMap['receivedText']) => {
    void e // TODO
  }
  protected onUcFileReceived = (e: UcEventMap['fileReceived']) => {
    void e // TODO
  }
  protected onUcFileInfoChanged = (e: UcEventMap['fileInfoChanged']) => {
    void e // TODO
  }
  protected onUcFileTerminated = (e: UcEventMap['fileTerminated']) => {
    void e // TODO
  }
  protected onUcInvitedToConference = (
    e: UcEventMap['invitedToConference'],
  ) => {
    void e // TODO
  }
  protected onUcConferenceMemberChanged = (
    e: UcEventMap['conferenceMemberChanged'],
  ) => {
    void e // TODO
  }

  /* LOCALE */
  /* ----------------------------------------------------------------------- */
  /* ----------------------------------------------------------------------- */
  @sync @observable locale = 'en'

  /* DEBUG */
  /* ----------------------------------------------------------------------- */
  /* ----------------------------------------------------------------------- */
  @sync @observable captureDebugLog = false
  @sync @observable dataForAutoUpdate = {
    remoteVersion: '',
    lastCheck: 0,
  }

  /* NAV */
  /* ----------------------------------------------------------------------- */
  /* ----------------------------------------------------------------------- */
  @sync @observable nav = {
    index: 1 as 0 | 1 | 2,
    subMenus: [] as number[],
  }

  /* OTHERS */
  /* ----------------------------------------------------------------------- */
  /* ----------------------------------------------------------------------- */
  @sync @observable displaySharedPhonebooks = false
  @sync @observable displayOfflineUsers = false

  syncInitStore = syncInitStore.bind(this)

  /* INIT */
  /* ----------------------------------------------------------------------- */
  /* ----------------------------------------------------------------------- */
  @observable isInitLoading = true
  protected initPromise?: Promise<unknown>
  protected initFuncs: Init[] = [
    this.initSyncStore,
    this.initAutorunAuth,
    this.reconnectInitOnAppStateChange,
  ]
  init = init.bind(this)
}

type SignInState = 'stopped' | 'connecting' | 'success' | 'failure'
type UcSignInState = 'signed-in-from-other-place' | 'pending-from-notification'

export default new Store() as Readonly<Store>
