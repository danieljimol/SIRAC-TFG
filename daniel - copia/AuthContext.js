import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuthStatus = async () => {
      const userToken = await AsyncStorage.getItem('userToken');
      setIsAuthenticated(!!userToken);
    };

    checkAuthStatus();
  }, []);

  const signIn = async (token) => {
    await AsyncStorage.setItem('userToken', token); // Guarda el token en el almacenamiento (simula un token real)
    setIsAuthenticated(true);
  };

  const signOut = async () => {
    await AsyncStorage.removeItem('userToken'); // Elimina el token del almacenamiento
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
