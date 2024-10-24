// Not sure why I needed to console.log dotenv for the import of .env.test to work
// Create a .env.test file with local DB URL
console.log(require('dotenv').config());
require('dotenv').config({ path: '.env.test' });
console.log(process.env); // This should print your test database URL
