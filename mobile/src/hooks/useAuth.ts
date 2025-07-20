import { useUser, useLogin, useRegister, useLogout, useGoogleLogin } from '@hruf/api';
import { api } from '../lib/api';

/**
 * Authentication hook for mobile app
 * Uses shared API package with proper mobile configuration
 */
export function useAuth() {
  const { data: user, isLoading: isUserLoading, error: userError } = useUser(api.endpoints.auth);
  
  const { 
    mutate: login, 
    isPending: isLoginLoading, 
    error: loginError 
  } = useLogin(api.endpoints.auth);
  
  const { 
    mutate: register, 
    isPending: isRegisterLoading, 
    error: registerError 
  } = useRegister(api.endpoints.auth);
  
  const { 
    mutate: logout, 
    isPending: isLogoutLoading 
  } = useLogout(api.endpoints.auth);
  
  const { 
    mutate: googleLogin, 
    isPending: isGoogleLoginLoading, 
    error: googleLoginError 
  } = useGoogleLogin(api.endpoints.auth);
  
  return {
    // User state
    user,
    isLoading: isUserLoading,
    isAuthenticated: !!user,
    
    // Auth actions
    login,
    register,
    logout,
    googleLogin,
    
    // Loading states
    isLoginLoading,
    isRegisterLoading,
    isLogoutLoading,
    isGoogleLoginLoading,
    
    // Error states
    loginError,
    registerError,
    userError,
    googleLoginError,
  };
}