import type { ApiClient } from '../client';
import type { 
  User, 
  LoginData, 
  RegisterData, 
  GoogleAuthData,
  ApiResponse 
} from '../types';

/**
 * Authentication API endpoints
 */
export class AuthEndpoints {
  constructor(private client: ApiClient) {}

  /**
   * Register a new user account
   */
  async register(data: RegisterData): Promise<{ message: string; user: User }> {
    return this.client.post('/api/register', data);
  }

  /**
   * Login with username/email and password
   */
  async login(data: LoginData): Promise<{ message: string; user: User }> {
    return this.client.post('/api/login', data);
  }

  /**
   * Login with Google OAuth credential
   */
  async googleLogin(data: GoogleAuthData): Promise<{ message: string; user: User }> {
    return this.client.post('/api/auth/google', data);
  }

  /**
   * Logout current session
   */
  async logout(): Promise<{ message: string }> {
    return this.client.post('/api/logout');
  }

  /**
   * Get current authenticated user
   */
  async getCurrentUser(): Promise<{ user: User }> {
    return this.client.get('/api/user');
  }

  /**
   * Register user after payment completion
   */
  async registerPostPayment(data: {
    username: string;
    email: string;
    password: string;
    sessionId: string;
    subscriptionTier?: string;
    purchaseId?: string;
  }): Promise<{ message: string; user: User }> {
    return this.client.post('/api/register-post-payment', data);
  }

  /**
   * Send 2FA email
   */
  async send2FA(data: { email: string }): Promise<{ message: string }> {
    return this.client.post('/api/auth/2fa/send', data);
  }

  /**
   * Test email functionality (development only)
   */
  async testEmail(data: { email: string }): Promise<{ message: string }> {
    return this.client.post('/api/test-email', data);
  }
}