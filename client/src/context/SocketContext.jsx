import { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    if (user) {
      const token = localStorage.getItem('ecoloop_token');
      const serverUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5001';
      const newSocket = io(serverUrl, {
        auth: { token },
        transports: ['websocket', 'polling'],
      });

      // Join personal room immediately so messages are received on ANY page
      const joinRoom = () => newSocket.emit('joinUser', user._id);
      newSocket.on('connect', joinRoom);

      setSocket(newSocket);

      return () => newSocket.close();
    } else if (socket) {
      socket.close();
      setSocket(null);
    }
  }, [user]);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useSocket = () => {
  return useContext(SocketContext);
};
