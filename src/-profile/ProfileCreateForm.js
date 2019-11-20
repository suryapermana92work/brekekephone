import cloneDeep from 'lodash/cloneDeep';
import isEqual from 'lodash/isEqual';
import { observer } from 'mobx-react';
import React from 'react';

import g from '../global';
import { Text, View } from '../native/Rn';
import Layout from '../shared/Layout';
import useForm from '../shared/useForm';
import useStore from '../shared/useStore';

const ProfileCreateForm = observer(props => {
  const $ = useStore(() => ({
    observable: {
      profile: {
        ...g.genEmptyProfile(),
        ...cloneDeep(props.updatingProfile),
      },
      addingPark: ``,
    },
    //
    onAddingParkSubmit: () => {
      $.set(`profile`, p => {
        $.addingPark = $.addingPark.trim();
        if ($.addingPark) {
          p.parks.push($.addingPark);
          $.addingPark = ``;
        }
        return p;
      });
    },
    onAddingParkRemove: i => {
      g.showPrompt({
        title: `Remove Park`,
        message: (
          <React.Fragment>
            <View>
              <Text small>
                Park {i + 1}: {$.profile.parks[i]}
              </Text>
            </View>
            <Text>Do you want to remove this park?</Text>
          </React.Fragment>
        ),
        onConfirm: () => {
          $.set(`profile`, p => {
            p.parks = p.parks.filter((p, _i) => _i !== i);
            return p;
          });
        },
      });
    },
    //
    hasUnsavedChanges: () => {
      const p = props.updatingProfile || g.genEmptyProfile();
      if (!props.updatingProfile) {
        Object.assign(p, {
          id: $.profile.id,
        });
      }
      return !isEqual($.profile, p);
    },
    onBackBtnPress: () => {
      if (!$.hasUnsavedChanges()) {
        props.onBack();
        return;
      }
      g.showPrompt({
        title: `Discard Changes`,
        message: `Do you want to discard all unsaved changes and go back?`,
        onConfirm: props.onBack,
        confirmText: `DISCARD`,
      });
    },
    onValidSubmit: () => {
      props.onSave($.profile, $.hasUnsavedChanges());
    },
  }));
  const [Form, submitForm, revalidate] = useForm();
  return (
    <Layout
      footer={{
        actions: {
          onBackBtnPress: $.onBackBtnPress,
          onSaveBtnPress: props.footerLogout
            ? g.goToPageProfileSignIn
            : submitForm,
          saveText: props.footerLogout ? `LOGOUT` : null,
          saveColor: props.footerLogout ? g.redDarkBg : null,
        },
      }}
      header={{
        onBackBtnPress: $.onBackBtnPress,
        title: props.title,
        description: props.updatingProfile
          ? `${props.updatingProfile.pbxUsername} - ${props.updatingProfile.pbxHostname}`
          : `Create a new sign in profile`,
      }}
    >
      <Form
        $={$}
        fields={[
          {
            isGroup: true,
            label: `PBX`,
          },
          {
            // autoFocus: true, // TODO Animation issue
            disabled: props.footerLogout,
            name: `pbxUsername`,
            label: `USERNAME`,
            rule: `required`,
          },
          {
            disabled: props.footerLogout,
            secureTextEntry: true,
            name: `pbxPassword`,
            label: `PASSWORD`,
            rule: `required`,
          },
          {
            disabled: props.footerLogout,
            name: `pbxTenant`,
            label: `TENANT`,
            rule: `required`,
          },
          {
            disabled: props.footerLogout,
            name: `pbxHostname`,
            label: `HOSTNAME`,
            rule: `required|hostname`,
          },
          {
            disabled: props.footerLogout,
            keyboardType: `numeric`,
            name: `pbxPort`,
            label: `PORT`,
            rule: `required|port`,
          },
          {
            disabled: props.footerLogout,
            type: `Picker`,
            name: `pbxPhoneIndex`,
            label: `PHONE`,
            options: [1, 2, 3, 4].map(v => ({
              key: `${v}`,
              label: `Phone ${v}`,
            })),
          },
          {
            disabled: props.footerLogout,
            type: `Switch`,
            name: `pbxTurnEnabled`,
            label: `TURN`,
          },
          {
            disabled: props.footerLogout,
            type: `Switch`,
            name: `pushNotificationEnabled`,
            label: `PUSH NOTIFICATION`,
          },
          {
            isGroup: true,
            label: `UC`,
            hasMargin: true,
          },
          {
            disabled: props.footerLogout,
            type: `Switch`,
            name: `ucEnabled`,
            label: `UC`,
            onValueChange: v => {
              $.set(`profile`, p => {
                if (v && !p.ucHostname && !p.ucPort) {
                  p.ucHostname = p.pbxHostname;
                  p.ucPort = p.pbxPort;
                  // TODO
                  // revalidate('ucHostname', 'ucPort');
                  revalidate(`ucHostname`, p.ucHostname);
                  revalidate(`ucPort`, p.ucPort);
                }
                p.ucEnabled = v;
                return p;
              });
            },
          },
          {
            disabled: props.footerLogout || !$.profile.ucEnabled,
            name: `ucHostname`,
            label: `HOSTNAME`,
            rule: `required|hostname`,
          },
          {
            keyboardType: `numeric`,
            disabled: props.footerLogout || !$.profile.ucEnabled,
            name: `ucPort`,
            label: `PORT`,
            rule: `required|port`,
          },
          {
            isGroup: true,
            label: `PARKS (${$.profile.parks.length})`,
            hasMargin: true,
          },
          ...$.profile.parks.map((p, i) => ({
            disabled: true,
            name: `parks[${i}]`,
            value: p,
            label: `PARK ${i + 1}`,
            onRemoveBtnPress: props.footerLogout
              ? null
              : () => $.onAddingParkRemove(i),
          })),
          ...(props.footerLogout
            ? []
            : [
                {
                  name: `parks[new]`,
                  label: `NEW PARK`,
                  value: $.addingPark,
                  onValueChange: v => $.set(`addingPark`, v),
                  onCreateBtnPress: $.onAddingParkSubmit,
                },
              ]),
        ]}
        k="profile"
        onValidSubmit={$.onValidSubmit}
      />
    </Layout>
  );
});

export default ProfileCreateForm;