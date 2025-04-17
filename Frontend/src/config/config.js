const config = {
  apiBaseUrl: import.meta.env.PROD ? '/api' : 'http://localhost:5000/api',
  authEndpoints: {
    login: '/auth/login',
    adminLogin: '/auth/login',
    partnerLogin: '/partners/login'
  }
};

export default config;
