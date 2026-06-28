import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL;

export const refreshToken = async () => {
  try {
    const userData = localStorage.getItem('user');
    if (!userData) return null;

    const { refreshToken } = JSON.parse(userData);
    
    const response = await axios.post(`${API_BASE_URL}/api/auth/refresh`, {
      refreshToken
    });

    if (response.data.success) {
      const newUserData = {
        ...JSON.parse(userData),
        token: response.data.token,
        refreshToken: response.data.refreshToken
      };
      
      localStorage.setItem('user', JSON.stringify(newUserData));
      return response.data.token;
    }
    
    return null;
  } catch (error) {
    console.error('Token refresh failed:', error);
    return null;
  }
};