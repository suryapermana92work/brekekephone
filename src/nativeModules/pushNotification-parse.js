import get from 'lodash/get';
import { Platform } from 'react-native';

import { getCurrentAuthProfile } from '../components/pbx-auth/getset';
import {
  compareNotiProfile,
  getProfiles,
} from '../components/profiles-manage/getset';
import notiStore from '../mobx/notiStore';

const keysInCustomNoti = [
  `body`,
  `message`, // body fallback
  `title`, // body fallback
  `to`,
  `tenant`,
  `pbxHostname`,
  `pbxPort`,
  // ...
  `my_custom_data`,
  `is_local_notification`,
];

const parse = (...p) => {
  return p
    .filter(i => !!i)
    .map(i => {
      if (typeof i === `string`) {
        try {
          return JSON.parse(i);
        } catch (err) {}
      }
      return i;
    })
    .reduce((m, i) => {
      if (!i || typeof i !== `object`) {
        return m;
      }
      keysInCustomNoti.forEach(k => {
        const v = i[k];
        if (!(k in m) && v) {
          m[k] = v;
        }
      });
      return m;
    }, {});
};

const parseCustomNoti = n => {
  let c = {};
  if (Platform.OS === `android`) {
    c = parse(
      n,
      get(n, `fcm`),
      get(n, `data`),
      get(n, `alert`),
      get(n, `data.alert`),
      get(n, `custom_notification`),
      get(n, `data.custom_notification`),
    );
  } else if (Platform.OS === `ios`) {
    c = parse(
      n,
      get(n, `_data`),
      get(n, `_alert`),
      get(n, `_data.custom_notification`),
    );
  }
  if (!c.body) {
    c.body = c.message || c.title;
  }
  if (!c.body && !c.to) {
    return null;
  }
  //
  if (
    n.my_custom_data ||
    n.is_local_notification ||
    c.my_custom_data ||
    c.is_local_notification
  ) {
    // Added from ./pushNotification.android
    // TODO handle user click
    return null;
  }
  //
  const p1 = getCurrentAuthProfile();
  const p2 = getProfiles().find(p => compareNotiProfile(c, p));
  if (
    (p1 && compareNotiProfile(c, p1)) ||
    (p2 && !p2.pushNotificationEnabled)
  ) {
    return null;
  }
  notiStore.addNoti(c);
  return c;
};

export default parseCustomNoti;
