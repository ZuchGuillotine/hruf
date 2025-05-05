
import axios from 'axios';

async function testPostPaymentRegistration() {
  try {
    const testUser = {
      username: "testuser" + Math.floor(Math.random() * 1000),
      email: `test${Math.floor(Math.random() * 1000)}@example.com`,
      password: "testpassword123",
      sessionId: "test_session",
      subscriptionTier: "starter"
    };

    console.log('Testing post-payment registration with data:', testUser);

    const response = await axios.post(
      'http://0.0.0.0:5000/api/post-payment/register?test=true',
      testUser,
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('Registration successful!');
    console.log('Response:', response.data);
    
    if (response.data.isAuthenticated) {
      console.log('User is authenticated and should be redirected to dashboard');
    }

  } catch (error: any) {
    console.error('Error testing post-payment registration:', error.response?.data || error.message);
  }
}

testPostPaymentRegistration();
