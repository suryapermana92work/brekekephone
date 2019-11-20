import { computed } from 'mobx';
import { observer } from 'mobx-react';
import PropTypes from 'prop-types';
import React from 'react';

import chatStore from '../-/chatStore';
import contactStore from '../-/contactStore';
import g from '../global';
import { StyleSheet, Text, TouchableOpacity, View } from '../native/Rn';
import Field from '../shared/Field';
import ItemUser from '../shared/ItemUser';
import Layout from '../shared/Layout';
import v from '../variables';

const s = StyleSheet.create({
  GroupInvite: {},
  GroupInvite_TextInput: {
    padding: 10,
    ...v.boxShadow,
  },
  GroupInvite_Outer: {
    paddingTop: 5,
    paddingHorizontal: 10,
  },
  GroupInvite_BtnSave: {
    marginTop: 15,
    padding: 10,
    borderRadius: v.borderRadius,
    backgroundColor: g.mainDarkBg,
  },
  GroupInvite_BtnText: {
    alignItems: `center`,
  },
  GroupInvite_GroupName: {
    fontSize: v.fontSizeTitle,
    padding: 5,
  },
  GroupInvite_Text: {
    paddingTop: 15,
    fontSize: v.fontSizeTitle,
  },
});

@observer
class GroupChatInvite extends React.Component {
  @computed get buddyIds() {
    return contactStore.ucUsers.map(u => u.id).filter(this.isNotMember);
  }
  static contextTypes = {
    uc: PropTypes.object.isRequired,
  };

  state = {
    selectedBuddy: {},
  };

  render() {
    return (
      <Layout
        footer={{}}
        header={{
          onBackBtnPress: this.back,
          title: `Inviting Group member`,
        }}
      >
        <View style={s.GroupInvite_Outer}>
          <Text style={s.GroupInvite_GroupName}>
            {chatStore.getGroup(this.props.groupId).name}
          </Text>
          <TouchableOpacity onPress={this.invite} style={s.GroupInvite_BtnSave}>
            <Text style={s.GroupInvite_BtnText}>Invite</Text>
          </TouchableOpacity>
          <Text style={s.GroupInvite_Text}>Members</Text>
        </View>
        <Field isGroup />
        {this.buddyIds.map((id, i) => (
          <TouchableOpacity onPress={() => this.toggleBuddy(id)}>
            <ItemUser
              key={id}
              last={i === this.buddyIds.length - 1}
              {...this.resolveBuddy(id)}
              selected={this.state.selectedBuddy[id]}
            />
          </TouchableOpacity>
        ))}
      </Layout>
    );
  }

  isNotMember = buddy =>
    !chatStore.getGroup(this.props.groupId).members?.includes(buddy);
  resolveBuddy = buddy => contactStore.getUCUser(buddy);

  toggleBuddy = buddy => {
    let { selectedBuddy } = this.state;

    selectedBuddy = {
      ...selectedBuddy,
      [buddy]: !selectedBuddy[buddy],
    };

    this.setState({
      selectedBuddy,
    });
  };

  invite = () => {
    const { selectedBuddy } = this.state;

    const members = Object.keys(selectedBuddy);

    if (!members.length) {
      g.showError({ message: `No buddy selectedBuddy` });
      return;
    }

    const { uc } = this.context;

    uc.inviteChatGroupMembers(this.props.groupId, members)
      .catch(this.onInviteFailure)
      .then(this.back);
  };

  onInviteFailure = err => {
    console.error(err);
    g.showError({ message: err.message || `with unknown error` });
  };

  back = () => {
    g.goToChatGroupsRecent({ groupId: this.props.groupId });
  };
}

export default GroupChatInvite;