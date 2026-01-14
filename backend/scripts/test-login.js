const axios = require('axios');

async function testLogin() {
  try {
    console.log('🔐 Testing login with familia@educonecta.com...');
    
    const response = await axios.post('http://localhost:3000/api/auth/login', {
      email: 'familia@educonecta.com',
      password: 'Familia2026!'
    });

    console.log('✅ Login successful!');
    console.log('\n📋 User Info:');
    console.log(JSON.stringify(response.data.user, null, 2));
    
    console.log('\n🎫 Token generated:');
    console.log(response.data.token.substring(0, 50) + '...');
    
    // Decode the token to see the payload
    const tokenParts = response.data.token.split('.');
    const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString());
    
    console.log('\n🔍 Token payload:');
    console.log(JSON.stringify(payload, null, 2));
    
    // Test the AI endpoint with the token
    console.log('\n🤖 Testing AI endpoint...');
    const aiResponse = await axios.post(
      'http://localhost:3000/api/ai/performance-report/1',
      {},
      {
        headers: {
          'Authorization': `Bearer ${response.data.token}`
        }
      }
    );
    
    console.log('✅ AI endpoint accessible!');
    console.log('Report type:', aiResponse.data.reportType);
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
    }
  }
}

testLogin();
