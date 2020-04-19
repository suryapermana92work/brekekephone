import { action, observable, runInAction } from 'mobx'
import { ReactElement } from 'react'

import { IntlDebug } from '../intl/intl'

export class RnUtils {
  @observable alertsCount = 0
  alerts: Alert[] = []
  @action prompt = (prompt: AlertPromptProps) => {
    this.alerts.push({ prompt })
    this.alertsCount += 1
  }
  promptAsync = (prompt: AlertPromptAsyncProps) =>
    new Promise((resolve, reject) => {
      this.alerts.push({
        prompt: {
          ...prompt,
          onConfirm: resolve,
          onDismiss: reject,
        },
      })
      runInAction(() => {
        this.alertsCount += 1
      })
    })
  @action showError = (error: AlertErrorProps) => {
    const err = error.unexpectedErr || error.err
    if (err) {
      const k = error.message?.en || error.message
      console.error(...(k ? [k, err] : [err]))
    }
    this.alerts.push({
      error: {
        ...error,
        message: error.message?.label,
      },
    })
    this.alertsCount += 1
  }
  @action dismissAlert = () => {
    this.alerts.shift()
    this.alertsCount -= 1
  }

  @observable picker?: PickerOptions
  @action openPicker = (picker: PickerOptions) => {
    this.picker = picker
  }
  @action dismissPicker = () => {
    this.picker = undefined
  }
}

export interface AlertPromptProps {
  title: string | ReactElement
  message: string | ReactElement
  onConfirm: Function
  onDismiss?: Function
}
export type AlertPromptAsyncProps = Omit<
  Omit<AlertPromptProps, 'onConfirm'>,
  'onDismiss'
>
export interface AlertErrorProps {
  message?: IntlDebug
  err?: Error
  unexpectedErr?: Error
}
export interface AlertErrorProps0 extends Omit<AlertErrorProps, 'message'> {
  message?: string
}

export interface AlertPrompt {
  prompt: AlertPromptProps
}
export interface AlertError {
  error: AlertErrorProps0
}
export type Alert = AlertPrompt | AlertError

export interface PickerOptions {
  options: {
    key: string
    label: string
    icon?: string // MdiIcon
  }[]
  cancelLabel?: string
  selectedKey?: string
  onSelect: Function
}
