import { useEffect } from 'react';
import { useSocketStore } from '@store/socket.store';

export const useSocket = (event, callback) => {
  const { socket, on, off } = useSocketStore();

  useEffect(() => {
    if (socket && event && callback) {
      on(event, callback);
    }

    return () => {
      if (socket && event) {
        off(event, callback);
      }
    };
  }, [socket, event, callback]);
};