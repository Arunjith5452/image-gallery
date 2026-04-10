import React, { createContext, useContext, useState, useEffect } from 'react';

interface AuthContextType {
  user: any;
  token: string | null;
  login: (userData: any, token: string) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

interface JwtPayload {
  id: string;
  exp: number;
  iat: number;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const storedToken = localStorage.getItem('token');
    
    if (storedUser && storedToken) {
      setUser(JSON.parse(storedUser));
      setToken(storedToken);
      checkTokenValidity(storedToken);
    }
  }, []);

  const checkTokenValidity = (tokenToCheck: string) => {
    try {
      const base64Url = tokenToCheck.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const decoded = JSON.parse(window.atob(base64)) as JwtPayload;
      
      const currentTime = Date.now() / 1000;

      if (decoded.exp < currentTime) {
        console.log('Token expired, logging out');
        logout();
      } else {
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.error('Invalid token:', error);
      logout();
    }
  };

  useEffect(() => {
    if (!token) return;

    const interval = setInterval(() => checkTokenValidity(token), 60 * 1000);
    
    return () => clearInterval(interval);
  }, [token]);

  const login = (userData: any, userToken: string) => {
    setUser(userData);
    setToken(userToken);
    setIsAuthenticated(true);
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('token', userToken);
    checkTokenValidity(userToken);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    setIsAuthenticated(false);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
