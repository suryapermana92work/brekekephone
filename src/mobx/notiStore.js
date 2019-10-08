import AsyncStorage from '@react-native-community/async-storage';
import { action, observable, runInAction } from 'mobx';
import shortid from 'shortid';

class NotiStore {
  @observable notiArr = [];
  @action addNoti = n => {
    if (!n) {
      return;
    }
    if (!n.id) {
      n.id = shortid();
    }
    n.read = false;
    this.notiArr.unshift(n);
    while (this.notiArr.length > 20) {
      this.notiArr.pop();
    }
    AsyncStorage.set(`NotiStore.notiArr`, JSON.stringify(this.notiArr));
  };
  @action markAsRead = id => {
    const n = this.notiArr.find(n => n.id === id);
    if (n) {
      n.read = true;
      AsyncStorage.set(`NotiStore.notiArr`, JSON.stringify(this.notiArr));
    }
  };
  loadNotiFromStorage = async () => {
    let arr = null;
    try {
      arr = await AsyncStorage.get(`NotiStore.notiArr`);
      arr = JSON.parse(arr);
    } catch (err) {
      arr = null;
    }
    if (!Array.isArray(arr)) {
      arr = [];
      await AsyncStorage.set(`NotiStore.notiArr`, JSON.stringify(arr));
    }
    runInAction(() => {
      this.notiArr = arr;
    });
  };
}

const notiStore = new NotiStore();
notiStore.loadNotiFromStorage();

export default notiStore;
