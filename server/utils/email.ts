// Placeholder for future email integration
export function generateVerificationToken(): string {
  return require('crypto').randomBytes(32).toString('hex');
}