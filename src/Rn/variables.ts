import { observable } from 'mobx'
import { lighten } from 'polished'
import { Platform } from 'react-native'

export default observable({
  baseSpace: 2,
  borderRadius: 3,
  modalMaxWidth: 380,

  fontSize: 14,
  lineHeight: 20,
  get fontSizeTitle() {
    return 1.8 * this.fontSize
  },
  get lineHeightTitle() {
    return 1.8 * this.lineHeight
  },
  get fontSizeSubTitle() {
    return 1.2 * this.fontSize
  },
  get lineHeightSubTitle() {
    return 1.2 * this.lineHeight
  },
  get fontSizeSmall() {
    return 0.8 * this.fontSize
  },
  get lineHeightSmall() {
    return 0.8 * this.lineHeight
  },
  fontWeight: 'normal',
  fontFamily:
    Platform.OS === 'web'
      ? '-apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, \'Helvetica Neue\', Arial, \'Noto Sans\', sans-serif, \'Apple Color Emoji\', \'Segoe UI Emoji\', \'Segoe UI Symbol\', \'Noto Color Emoji\''
      : undefined,

  primary: '#609b3a',
  get primaryL() {
    return lighten(0.5, this.primary)
  },
  warning: '#f1af20',
  get warningL() {
    return lighten(0.5, this.warning)
  },
  danger: '#dc0f39',
  get dangerL() {
    return lighten(0.5, this.danger)
  },

  boxShadow: {
    shadowColor: 'black',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 3, // android
  },
  backdropZindex: {
    zIndex: 999,
    elevation: 999,
  },
})
