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

// Required vars are validated above, so the assertions here are safe. (The
// array-filter check does not narrow types the way an inline `if` would.)
const env = {
  NODE_ENV: process.env.NODE_ENV as string,
  HOST: process.env.HOST as string,
  PORT: process.env.PORT as string,
  DATABASE_URL: process.env.DATABASE_URL as string,
  USER: process.env.USER ?? '',
  PASSWORD: process.env.PASSWORD ?? '',
  DB_HOST: process.env.DB_HOST ?? '',
  DB_PORT: process.env.DB_PORT ?? '',
  DATABASE: process.env.DATABASE ?? '',
  SMTP_HOST: process.env.SMTP_HOST as string,
  SMTP_USER: process.env.SMTP_USER as string,
  SMTP_PASSWORD: process.env.SMTP_PASSWORD as string,
  ACCESS_TOKEN_SECRET: process.env.ACCESS_TOKEN_SECRET as string,
  ACCESS_TOKEN_EXPIRATION: process.env.ACCESS_TOKEN_EXPIRATION as string,
  REFRESH_TOKEN_SECRET: process.env.REFRESH_TOKEN_SECRET as string,
  REFRESH_TOKEN_EXPIRATION: process.env.REFRESH_TOKEN_EXPIRATION as string,
  VERIFY_EMAIL_SECRET: process.env.VERIFY_EMAIL_SECRET as string,
  PASSWORD_RESET_SECRET: process.env.PASSWORD_RESET_SECRET as string,
  PASSWORD_RESET_EXPIRATION: process.env.PASSWORD_RESET_EXPIRATION as string,
  FRONT_END_URL: process.env.FRONT_END_URL as string,
};

export default env;
