import { useEffect } from 'react';

let isLoading = true;

let resolve = null;
const promise = new Promise(r => {
  resolve = r;
});
const waitReduxPersist = () => promise;

const Loading = () => {
  useEffect(
    () => () => {
      if (!isLoading) {
        return;
      }
      isLoading = false;
      // wait for a while so the components are rendered
      setTimeout(resolve, 500);
    },
    [],
  );
  return null;
};

export { Loading, waitReduxPersist };
