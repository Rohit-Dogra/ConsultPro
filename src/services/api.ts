const API_BASE_URL = import.meta.env.VITE_API_URL;

export const fetchSeekerProfile = async (userId: string, token: string) => {
  const response = await fetch(`${API_BASE_URL}/api/profiles/seeker/${userId}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch profile data');
  }
  
  return response.json();
};

export const fetchRecommendedExperts = async (token: string) => {
  const response = await fetch(`${API_BASE_URL}/api/experts/recommended`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch recommended experts');
  }
  
  return response.json();
};

export const fetchAllExperts = async (token: string, query = '') => {
  const response = await fetch(`${API_BASE_URL}/api/experts?search=${query}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch experts');
  }
  
  return response.json();
};

export const fetchUserSessions = async (userId: string, token: string) => {
  const response = await fetch(`${API_BASE_URL}/api/sessions/user/${userId}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch sessions');
  }
  
  return response.json();
};
