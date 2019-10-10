import humanizeDuration from 'humanize-duration';
import { action } from 'mobx';
import { observer } from 'mobx-react';
import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity as Btn, View } from 'react-native';
import { createModelView } from 'redux-model';
import shortid from 'shortid';
import useInterval from 'use-interval';

import notiStore from '../../mobx/notiStore';
import * as routerUtils from '../../mobx/routerStore';
import Alert from '../../nativeModules/alert';
import { std } from '../../styleguide';
import { st } from '../pbx-auth/ui';
import { compareNotiProfile } from '../profiles-manage/getset';

const formatDuration = d =>
  humanizeDuration(Date.now() - d.getTime(), { round: true, largest: 1 });

const DurationText = ({ d, ...p }) => {
  d = d ? new Date(d) : new Date();
  const [t, set] = useState(formatDuration(d));
  useInterval(() => {
    const t2 = formatDuration(d);
    if (t2 !== t) {
      set(t2);
    }
  }, 60000);
  return <Text {...p}>{t} ago</Text>;
};

const s = StyleSheet.create({
  Noti: {
    borderColor: std.color.shade4,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  Noti_Item: {
    backgroundColor: std.color.shade0,
    paddingHorizontal: std.gap.sm,
    paddingTop: 2 * std.gap.sm,
    paddingBottom: 2 * std.gap.sm - 4,
  },
  Noti_ItemMsg: {
    // override st.message
    lineHeight: std.gap.lg + std.gap.sm,
    margin: 0,
  },
});

const mapGetter = getter => state => ({
  profile: getter.auth.profile(state),
  profileIds: getter.profiles.idsByOrder(state),
  profileById: getter.profiles.detailMapById(state),
});

const mapAction = action => emit => ({
  setAuthProfile(profile) {
    emit(action.auth.setProfile(profile));
  },
  showToast(message) {
    emit(action.toasts.create({ id: shortid(), message }));
  },
});

@createModelView(mapGetter, mapAction)
@observer
class Noti extends React.Component {
  onView = n => {
    //
    let found = null;
    this.props.profileIds.forEach(id => {
      if (found) {
        return;
      }
      const p = this.props.profileById[id];
      if (compareNotiProfile(n, p)) {
        found = p;
      }
    });
    //
    if (!found) {
      this.props.showToast(`Profile not found for ${n.to}`);
      return;
    }
    //
    const fn = () => {
      notiStore.remove(n.id);
      this.props.setAuthProfile(found);
      routerUtils.goToAuth();
    };
    if (this.props.profile) {
      Alert.alert(
        `Switch profile`,
        `Do you want to sign out from current profile and sign in to ${n.to}`,
        [
          {
            text: `Cancel`,
            onPress: () => {},
            style: `cancel`,
          },
          {
            text: `OK`,
            onPress: fn,
          },
        ],
        {
          cancelable: true,
        },
      );
    } else {
      fn();
    }
  };
  onDimiss = n => {
    notiStore.remove(n.id);
  };

  updateStoreTimeoutId = 0;
  @action updateStore = a => {
    this.updateStoreTimeoutId = 0;
    notiStore.notiArr = a;
    notiStore.saveNotiToStorage();
  };

  render() {
    let a = notiStore.notiArr;
    this.props.profileIds.forEach(id => {
      const p = this.props.profileById[id];
      if (!p.pushNotificationEnabled) {
        a = a.filter(n => !compareNotiProfile(n, p));
      }
    });
    if (a.length !== notiStore.notiArr.length) {
      if (this.updateStoreTimeoutId) {
        clearTimeout(this.updateStoreTimeoutId);
      }
      this.updateStoreTimeoutId = setTimeout(() => this.updateStore(a), 300);
    }
    //
    if (!a.length) {
      return null;
    }
    const n = a[0];
    return (
      <View style={s.Noti}>
        <View style={s.Noti_Item}>
          <DurationText style={[st.message, s.Noti_ItemMsg]} d={n.createdAt} />
          <Text style={[st.message, s.Noti_ItemMsg]}>
            To {n.to}: {(n.body || ``).replace(/\W+$/, ``)}...
          </Text>
          <View style={st.buttons}>
            <Btn style={st.retry} onPress={() => this.onView(n)}>
              <Text style={st.retryText}>View</Text>
            </Btn>
            <Btn style={st.abort} onPress={() => this.onDimiss(n)}>
              <Text style={st.abortText}>Dismiss</Text>
            </Btn>
          </View>
        </View>
      </View>
    );
  }
}

export default Noti;
