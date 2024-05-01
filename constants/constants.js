require('dotenv').config();

let envFile = '.env';
switch (process.env.NODE_ENV) {
  case 'development':
    envFile = '.env.dev';
    break;
  case 'sandbox':
    envFile = '.env.sandbox';
    break;
  case 'production':
    envFile = '.env.prod';
    break;
  // No default case needed as '.env' is the default
}

require('dotenv').config({ path: envFile });
module.exports = {
    SERVER_PORT: process.env.PORT || 8000,
    MAIL_SETTINGS: {
        service: 'Gmail',
        auth: {
          user: process.env.MAIL_EMAIL,
          pass: process.env.MAIL_PASSWORD
        },
      }
}