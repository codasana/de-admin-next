import axios from 'axios'

const api = axios.create({
  baseURL: process.env.NODE_ENV === 'production' ? 'https://api.deepenglish.com' : 'http://localhost:5000',
  timeout: 60000,
})

// Basic retry for CORS/network errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error?.config;
    
    if (
      config && 
      !config._retry && 
      (error.code === 'ERR_NETWORK' || 
       error.message?.includes('CORS') ||
       error.message?.includes('Cross-Origin Request Blocked'))
    ) {
      config._retry = true;
      await new Promise(resolve => setTimeout(resolve, 1000));
      return api(config);
    }
    
    return Promise.reject(error);
  }
);

export default api
