/**
 * Authentication configuration for different environments
 */

export const AUTH_CONFIG = {
  // Production domain - always use this for password reset emails
  PRODUCTION_DOMAIN: 'https://apps.simplyb.meetdigrajkar.ca',
  
  // Password reset redirect URL
  PASSWORD_RESET_REDIRECT: 'https://apps.simplyb.meetdigrajkar.ca/reset-password',
  
  // Email confirmation redirect URL  
  EMAIL_CONFIRM_REDIRECT: 'https://apps.simplyb.meetdigrajkar.ca/confirm-email',
  
  // Invitation acceptance redirect URL
  INVITATION_REDIRECT: 'https://apps.simplyb.meetdigrajkar.ca/invite',
};

/**
 * Get the appropriate redirect URL for password reset
 * Always returns production domain to avoid localhost issues
 */
export const getPasswordResetRedirectUrl = (): string => {
  // Always use production domain for password reset emails
  // This ensures emails work regardless of development environment
  return AUTH_CONFIG.PASSWORD_RESET_REDIRECT;
};

/**
 * Get the current app origin
 */
export const getCurrentOrigin = (): string => {
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  return AUTH_CONFIG.PRODUCTION_DOMAIN;
};

/**
 * Check if we're in development environment
 */
export const isDevelopment = (): boolean => {
  if (typeof window !== 'undefined') {
    return window.location.hostname === 'localhost' || 
           window.location.hostname === '127.0.0.1' ||
           window.location.hostname.includes('localhost');
  }
  return false;
};

/**
 * Check if we're in production environment
 */
export const isProduction = (): boolean => {
  if (typeof window !== 'undefined') {
    return window.location.hostname === 'apps.simplyb.meetdigrajkar.ca';
  }
  return false;
};

/**
 * Get environment-appropriate base URL
 */
export const getBaseUrl = (): string => {
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  return AUTH_CONFIG.PRODUCTION_DOMAIN;
};

/**
 * Log environment information for debugging
 */
export const logEnvironmentInfo = (): void => {
  if (typeof window !== 'undefined') {
    console.log('🌍 Environment Info:', {
      hostname: window.location.hostname,
      origin: window.location.origin,
      isDevelopment: isDevelopment(),
      isProduction: isProduction(),
      passwordResetUrl: getPasswordResetRedirectUrl(),
    });
  }
};
