// Debug helpers for development
export const DEBUG_MODE = __DEV__;

export const debugLog = (category: string, message: string, data?: any) => {
  if (DEBUG_MODE) {
    console.log(`🔍 [${category}] ${message}`, data ? data : '');
  }
};

export const debugError = (category: string, error: any) => {
  if (DEBUG_MODE) {
    console.error(`❌ [${category}] Error:`, error);
  }
};

export const debugAuth = (message: string, data?: any) => {
  debugLog('AUTH', message, data);
};

export const debugDatabase = (message: string, data?: any) => {
  debugLog('DATABASE', message, data);
};

export const debugNavigation = (message: string, data?: any) => {
  debugLog('NAVIGATION', message, data);
};

export const debugBusiness = (message: string, data?: any) => {
  debugLog('BUSINESS', message, data);
};

// State inspector for debugging
export const inspectState = (stateName: string, state: any) => {
  if (DEBUG_MODE) {
    console.group(`📊 State Inspector: ${stateName}`);
    console.log('Current state:', JSON.stringify(state, null, 2));
    console.groupEnd();
  }
};

// Performance timing
export const startTimer = (label: string) => {
  if (DEBUG_MODE) {
    console.time(`⏱️ ${label}`);
  }
};

export const endTimer = (label: string) => {
  if (DEBUG_MODE) {
    console.timeEnd(`⏱️ ${label}`);
  }
};

// Mock data inspector
export const inspectMockData = () => {
  if (DEBUG_MODE) {
    console.group('🎭 Mock Data Inspector');
    console.log('Available for inspection:');
    console.log('- Users');
    console.log('- Businesses'); 
    console.log('- Business Members');
    console.log('- Transactions');
    console.log('Call debugDatabase() functions to see specific data');
    console.groupEnd();
  }
};
