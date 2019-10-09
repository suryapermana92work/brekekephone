import AsyncStorage from '@react-native-community/async-storage';
import { action, observable, runInAction } from 'mobx';
import shortid from 'shortid';

import { compareNotiProfile } from '../components/profiles-manage/getset';

class NotiStore {
  @observable notiArr = [];

  addNoti = n => {
    this.loadNotiFromStorage().then(() => this._addNoti(n));
  };
  @action _addNoti = n => {
    if (!n) {
      return;
    }
    if (!n.id) {
      n.id = shortid();
    }
    if (!n.createdAt) {
      n.createdAt = new Date();
    }
    this.notiArr.unshift(n);
    while (this.notiArr.length > 100) {
      this.notiArr.pop();
    }
    this.saveNotiToStorage();
  };

  remove = id => {
    this.loadNotiFromStorage().then(() => this._remove(id));
  };
  @action _remove = id => {
    this.notiArr = this.notiArr.filter(n => n.id !== id);
    this.saveNotiToStorage();
  };

  @action removeByProfile = p => {
    this.notiArr = this.notiArr.filter(n => !compareNotiProfile(n, p));
    this.saveNotiToStorage();
  };

  _loadingPromise = null;
  _loadNotiFromStorage = async () => {
    let arr = null;
    try {
      arr = await AsyncStorage.getItem(`NotiStore.notiArr`);
      arr = JSON.parse(arr);
    } catch (err) {
      arr = null;
    }
    if (!Array.isArray(arr)) {
      arr = [];
      await this.saveNotiToStorage(arr);
    }
    runInAction(() => {
      this.notiArr = arr;
    });
  };
  loadNotiFromStorage = () => {
    if (!this._loadingPromise) {
      this._loadingPromise = this._loadNotiFromStorage();
    }
    return this._loadingPromise;
  };

  saveNotiToStorage = (arr = this.notiArr) => {
    return AsyncStorage.setItem(`NotiStore.notiArr`, JSON.stringify(arr));
  };
}

const notiStore = new NotiStore();
notiStore.loadNotiFromStorage();

export default notiStore;
