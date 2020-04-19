import './__keyboard'
import './__stacker'

import Rn from '../../Rn'
import { BackHandler, Keyboard } from '../Rn'
import v from '../variables'
import g from './_'

g.extends(v)

// Handle android hardware back button press
BackHandler.addEventListener('hardwareBackPress', () => {
  if (g.isKeyboardShowing) {
    Keyboard.dismiss()
    return true
  }
  if (Rn.alerts.length) {
    Rn.dismissAlert()
    return true
  }
  if (Rn.picker) {
    Rn.dismissPicker()
    return true
  }
  if (g.stacks.length > 1) {
    g.stacks.pop()
    return true
  }
  return false
})

export default g
