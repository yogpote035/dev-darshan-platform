const bcrypt = require('bcrypt');
const password = 'admin123';
bcrypt.hash(password, 10, (err, hash) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.log('Generated Bcrypt Hash for admin123:');
  console.log(hash);
  process.exit(0);
});
