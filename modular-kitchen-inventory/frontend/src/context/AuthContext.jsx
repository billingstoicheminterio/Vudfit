import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Validate session on mount
  useEffect(() => {
    const checkUserSession = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const response = await api.get('/auth/me');
          setUser(response.data);
        } catch (error) {
          console.error("Session verification failed", error);
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setUser(null);
        }
      }
      setLoading(false);
    };

    checkUserSession();
  }, []);

  const login = async (username, password, rememberMe = false) => {
    try {
      const formData = new FormData();
      formData.append('username', username);
      formData.append('password', password);

      const response = await api.post('/auth/login', formData);
      const { access_token } = response.data;

      localStorage.setItem('token', access_token);
      
      // Fetch user profile
      const userResponse = await api.get('/auth/me');
      const userData = userResponse.data;
      
      setUser(userData);
      
      if (rememberMe) {
        localStorage.setItem('remembered_username', username);
      } else {
        localStorage.removeItem('remembered_username');
      }
      
      return { success: true };
    } catch (error) {
      let message = "Invalid username or password";
      if (!error.response) {
        message = "Cannot connect to server. Please verify the backend API is running on port 8000.";
      } else if (error.response.data?.detail) {
        message = error.response.data.detail;
      }
      return { success: false, error: message };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
