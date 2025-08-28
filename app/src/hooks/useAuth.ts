import { useState, useEffect } from 'react';

export const useAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const accessKey = localStorage.getItem('accessKey');
    setIsAuthenticated(!!accessKey);
    setLoading(false);
  }, []);

  const login = (accessKey: string) => {
    localStorage.setItem('accessKey', accessKey);
    setIsAuthenticated(true);
  };

  const logout = () => {
    localStorage.removeItem('accessKey');
    setIsAuthenticated(false);
  };

  return {
    isAuthenticated,
    loading,
    login,
    logout,
  };
};
