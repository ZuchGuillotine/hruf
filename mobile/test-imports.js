// Simple test to verify imports work
const { createMobileApi } = require('@hruf/api');

console.log('Testing API imports...');

try {
  const api = createMobileApi({
    baseURL: 'http://localhost:3000',
    storage: {
      getItem: (key) => Promise.resolve(null),
      setItem: (key, value) => Promise.resolve(),
      removeItem: (key) => Promise.resolve(),
    }
  });
  
  console.log('✅ API successfully created');
  console.log('✅ API endpoints available:', Object.keys(api.endpoints));
  
  // Test if auth endpoints exist
  if (api.endpoints.auth) {
    console.log('✅ Auth endpoints available:', Object.keys(api.endpoints.auth));
  }
  
} catch (error) {
  console.error('❌ Error:', error.message);
}