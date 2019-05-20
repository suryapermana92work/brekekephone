### Environment requirement
- Install `yarn` and use it instead of `npm`.
- Install node packages:
```sh
# We may need to clear yarn cache as well
#   because we use some git repos like jssip or some other forks
#   and sometimes yarn has cache issue with those repos
yarn cache clean
# IMPORTANT: Do not run react-native link, the automation link has issues, we already link them manually
cd \path\to\test-brekeke-phone
yarn install

# Start the metro bundler and let it running
react-native start
# Error: Unable to resolve module `./index.native` from `.../react-native/...`
react-native start --reset-cache
```


### Keystores and other credentials keys
- You need to contact us to download or generate your own following files:
  - `android/app/google-services.json`
  - `android/keystores/development.keystore`
  - `android/keystores/release.keystore`
  - `app/apis/turn.js`


### Android on Windows
- The binary tools are located at the following locations. To use them directly in the command line, we should add them into the PATH environment variable:
  - `%USERPROFILE%\AppData\Local\Android\Sdk\platform-tools`
  - `%USERPROFILE%\AppData\Local\Android\Sdk\tools`
  - `%USERPROFILE%\AppData\Local\Android\Sdk\tools\bin`

##### Run and debug app in Android Emulator:
- To create a virtual device:
  - Option 1: Using Android Studio: Go to `Tools > AVD Manager` to install a new virtual device.
  - Option 2: Using command line tool: Follow the instruction at: https://developer.android.com/studio/command-line/avdmanager
- To run the virtual device:
  - Option 1: Using Android Studio: In AVD Manager, click the Run button on the Emulator we want to run.
  - Option 2: Using command line tool: First `cd %USERPROFILE%\AppData\Local\Android\Sdk\emulator`. Then execute `emulator -list-avds` to list all virtual devices. Then execute `emulator -avd <DEVICE_NAME>` to run it.
- Start the react native bundle at the project root: `react-native run-android`.

- Some errors:
  - If we can not run the emulator and it throws an error like: `Emulator: ERROR: x86 emulation currently requires hardware acceleration!`. Try to follow these steps to fix:
    - In Android Studio, go to SDK Manager and make sure the option `Intel x86 Emulator Accelerator` is checked.
    - Open folder `%USERPROFILE%\AppData\Local\Android\sdk\extras\intel\Hardware_Accelerated_Execution_Manager\`.
    - Open `intelhaxm-android.exe`. If it shows that the installation is completed, we need to click the remove button to remove it, then reopen and reinstall it again.
    - When reinstalling, if it shows an error like: `... Intel Virtualization Technology (VT-x) is not turned on`: We need to restart the computer, enter the BIOS and configure the CPU to support Virtualization. After that try to reopen and reinstall `intelhaxm-android.exe` again.
  - The device starts up but the Command Line shows endless loop of `VCPU shutdown request`
    - This is a bug of Intel HAXM: https://issuetracker.google.com/issues/37124550
    - Remove the old HAXM then download and reinstall the latest HAXM version should fix this.
  - `You have not accepted the license agreements of the following SDK components`: Execute `cd %USERPROFILE%\AppData\Local\Android\Sdk\tools\bin` then `sdkmanager --licenses` then press y and enter for all licenses.

##### Run and debug app in a real device:
- Prepare with the phone:
  - Go to Settings > Privacy
  - Enable "Unknown Sources (Allow installation of apps from unknown sources)"
- Then run those commands on the computer:
```sh
adb devices
adb -s DEVICE_ID reverse tcp:8081 tcp:8081
react-native run-android --deviceId=DEVICE_ID
```

##### Build the app in release mode and install it in the real device:
- At the project root execute: `cd android && gradlew clean && gradlew assembleRelease`.
- After the build is finished, the apk file is located at: `android\app\build\outputs\apk\release`.
- To enable LogCat: https://stackoverflow.com/questions/25610936


### iOS
- Start the react native bundle at the project root: `react-native run-ios`.
- To clear cache: `rm -rf ios/build/* && rm -rf ~/Library/Developer/Xcode/DerivedData/*`.

##### Build iOS app for distribution
- Request for distribution certificate and install it correctly on local machine if haven't
- Archive and distribute for Ad-hoc / Team distribution


### TODO
- [x] Add enable TURN option in profile pages and handle it. Add turn config to git ignore
- [x] Join to group chat call (video/voice). If we make a call to a number as below, we can join to the conference call: `var number = ChatClient.getConference(conf_id).conf_ext || (ChatClient.PREFIX_CONFERENCE_EXTENSION + conf_id);`
- [ ] Refactor code for group chat call
- [ ] Add jsc-android for mobx: https://github.com/react-native-community/jsc-android-buildscripts#how-to-use-it-with-my-react-native-app
- [x] Move push notification service_id to 11 12 13
- [ ] Refactor code for fcm to normalize the push notification => Speed up startup time see deeplink.js for the comparision of the current logged in user
- [x] UC doesn't work (cannot even show the user's list) when we have made a group on the body list with the desktop version of UC
- [x] Research and implement a feature to open the app via url, parse the url parameters (Deep link)
- [ ] Userversal Links and App Links
- [x] Add a feature to switch to the loud speaker (and back to the front speaker)
- [x] Fix header space is too small so it becomes overflow by the status bar
- [ ] It goes down when it fails to connect - at least with iOS editon (when we reconnect after the sleep mode)
- [ ] Change the sound for push notification. Research more about if we can use default sound in the OS
- [ ] Add documentation for self signed certificate
- [ ] Make automatically archive script for iOS
- [ ] Handle duplicated resources accross ios android and web
- [ ] Add a loop and use RNFS.exist to check file exists before write in saveBlob.js
