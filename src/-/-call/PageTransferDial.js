import { mdiPhone, mdiPhoneForward } from '@mdi/js'
import orderBy from 'lodash/orderBy'
import { observer } from 'mobx-react'
import React from 'react'

import UserItem from '../-contact/UserItem'
import g from '../global'
import callStore from '../global/callStore'
import contactStore from '../global/contactStore'
import intl from '../intl/intl'
import Field from '../shared/Field'
import Layout from '../shared/Layout'

@observer
class PageTransferDial extends React.Component {
  componentDidMount() {
    this.componentDidUpdate()
  }
  componentDidUpdate() {
    if (this.prevId && this.prevId !== callStore.currentCall?.id) {
      g.backToPageCallManage()
    }
    this.prevId = callStore.currentCall?.id
  }

  resolveMatch = id => {
    const match = contactStore.getPBXUser(id)
    const ucUser = contactStore.getUCUser(id) || {}
    return {
      name: match.name,
      avatar: ucUser.avatar,
      number: id,
      calling: !!match.talkers?.filter(t => t.status === 'calling').length,
      ringing: !!match.talkers?.filter(t => t.status === 'ringing').length,
      talking: !!match.talkers?.filter(t => t.status === 'talking').length,
      holding: !!match.talkers?.filter(t => t.status === 'holding').length,
    }
  }

  render() {
    const users = contactStore.pbxUsers.map(u => u.id).map(this.resolveMatch)
    const map = {}
    users.forEach(u => {
      u.name = u.name || u.number || ''
      let c0 = u.name.charAt(0).toUpperCase()
      if (!/[A-Z]/.test(c0)) {
        c0 = '#'
      }
      if (!map[c0]) {
        map[c0] = []
      }
      map[c0].push(u)
    })
    let groups = Object.keys(map).map(k => ({
      key: k,
      users: map[k],
    }))
    groups = orderBy(groups, 'key')
    groups.forEach(g => {
      g.users = orderBy(g.users, 'name')
    })
    return (
      <Layout
        description={intl`Select target to start transfer`}
        onBack={g.backToPageCallManage}
        title={intl`Transfer`}
      >
        {groups.map(_g => (
          <React.Fragment key={_g.key}>
            <Field isGroup label={_g.key} />
            {_g.users.map((u, i) => (
              <UserItem
                iconFuncs={[
                  () => callStore.currentCall?.transferAttended(u.number),
                  () => callStore.currentCall?.transferBlind(u.number),
                ]}
                icons={[mdiPhoneForward, mdiPhone]}
                key={i}
                {...u}
              />
            ))}
          </React.Fragment>
        ))}
      </Layout>
    )
  }
}

export default PageTransferDial
