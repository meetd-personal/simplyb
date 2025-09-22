// HR Service Factory - switches between mock and real implementations
import HRService from './HRService';
import SupabaseHRService from './SupabaseHRService';

// Environment flag to switch between mock and real service
const USE_REAL_HR_SERVICE = !__DEV__; // Use real service in production, mock in development

// Export the appropriate service based on environment
export default USE_REAL_HR_SERVICE ? SupabaseHRService : HRService;

// For testing purposes, allow manual override
export const MockHRService = HRService;
export const RealHRService = SupabaseHRService;
