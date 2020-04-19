import { observer } from 'mobx-react'
import React from 'react'

import api from '../../api'
import g from '../global'
import intl from '../intl/intl'
import ProfileCreateForm from './ProfileCreateForm'

const PageProfileUpdate = observer(props => (
  <ProfileCreateForm
    onBack={g.backToPageProfileSignIn}
    onSave={p => {
      api.updateAccount(p.id, p)
      g.backToPageProfileSignIn()
    }}
    title={intl`Update Account`}
    updatingProfile={api.accounts.find(a => a.id === props.id)}
  />
))

export default PageProfileUpdate
