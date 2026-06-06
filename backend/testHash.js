const bcrypt = require('bcrypt');
const hash = '$2b$12$BUl2uN/q6I7XOMJWMexp0eUf3qUWgc4rI.RvNd..Rz6TEGjv/dTiW';
const pass = 'Demo@12345';
bcrypt.compare(pass, hash).then(res => console.log('Match?', res));
