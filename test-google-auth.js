// Test Google Authentication Endpoint
const axios = require('axios');

async function testGoogleAuth() {
  try {
    console.log('Testing Google Auth endpoint...');
    
    const response = await axios.post('http://localhost:5175/api/auth/google', {
      token: 'test-token'
    });
    
    console.log('Response:', response.data);
  } catch (error) {
    console.log('Error:', error.response?.data || error.message);
    console.log('Status:', error.response?.status);
  }
}

testGoogleAuth();
