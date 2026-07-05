// The individual DB vars (USER/PASSWORD/DB_HOST/DB_PORT/DATABASE) are only used
// by the local dev/test Sequelize config; production connects via DATABASE_URL,
// so they are not required there (see db.config.ts).
const REQUIRED_ENV = [
  'NODE_ENV',
  'HOST',
  'PORT',
  'DATABASE_URL',
  'SMTP_HOST',
  'SMTP_USER',
  'SMTP_PASSWORD',
  'ACCESS_TOKEN_SECRET',
  'ACCESS_TOKEN_EXPIRATION',
  'REFRESH_TOKEN_SECRET',
  'REFRESH_TOKEN_EXPIRATION',
  'VERIFY_EMAIL_SECRET',
  'PASSWORD_RESET_SECRET',
  'PASSWORD_RESET_EXPIRATION',
  'FRONT_END_URL',
];

const missingEnv = REQUIRED_ENV.filter((key) => process.env[key] === undefined);
if (missingEnv.length > 0) {
  throw new Error(`Environment variables missing: ${missingEnv.join(', ')}`);
}

const env = {
  NODE_ENV: process.env.NODE_ENV,
  HOST: process.env.HOST,
  PORT: process.env.PORT,
  DATABASE_URL: process.env.DATABASE_URL,
  USER: process.env.USER ?? '',
  PASSWORD: process.env.PASSWORD ?? '',
  DB_HOST: process.env.DB_HOST ?? '',
  DB_PORT: process.env.DB_PORT ?? '',
  DATABASE: process.env.DATABASE ?? '',
  SMTP_HOST: process.env.SMTP_HOST,
  SMTP_USER: process.env.SMTP_USER,
  SMTP_PASSWORD: process.env.SMTP_PASSWORD,
  ACCESS_TOKEN_SECRET: process.env.ACCESS_TOKEN_SECRET,
  ACCESS_TOKEN_EXPIRATION: process.env.ACCESS_TOKEN_EXPIRATION,
  REFRESH_TOKEN_SECRET: process.env.REFRESH_TOKEN_SECRET,
  REFRESH_TOKEN_EXPIRATION: process.env.REFRESH_TOKEN_EXPIRATION,
  VERIFY_EMAIL_SECRET: process.env.VERIFY_EMAIL_SECRET,
  PASSWORD_RESET_SECRET: process.env.PASSWORD_RESET_SECRET,
  PASSWORD_RESET_EXPIRATION: process.env.PASSWORD_RESET_EXPIRATION,
  FRONT_END_URL: process.env.FRONT_END_URL,
};

export default env;
