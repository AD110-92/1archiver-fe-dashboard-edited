export const config = {
  port: parseInt(process.env.PORT || '8080', 10),
  jwtSecret: process.env.JWT_SECRET || '1archiver-dev-secret-change-in-production',
  jwtExpiresIn: '8h',
  dbPath: process.env.DB_PATH || './1archiver.db',
};
