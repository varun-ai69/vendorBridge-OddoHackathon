const axios = require('axios');
axios.post('http://localhost:5000/api/v1/auth/login', {
  email: 'admin@vendorbridge.com',
  password: 'Demo@12345'
}).then(res => console.log('SUCCESS:', res.data))
  .catch(err => console.log('ERROR:', err.response ? err.response.data : err.message));
