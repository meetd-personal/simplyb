// Crash Reporting Utility
// This provides a unified interface for crash reporting
// Can be easily extended to use services like Sentry, Crashlytics, etc.

interface CrashReport {
  error: Error;
  context?: Record<string, any>;
  userId?: string;
  businessId?: string;
  timestamp: Date;
  appVersion?: string;
  platform?: string;
}

class CrashReportingService {
  private isEnabled: boolean = !__DEV__;
  private userId?: string;
  private businessId?: string;

  initialize(config?: { userId?: string; businessId?: string }) {
    this.userId = config?.userId;
    this.businessId = config?.businessId;
    
    if (this.isEnabled) {
      console.log('📊 Crash reporting initialized for production');
      // In production, initialize your crash reporting service here
      // Example: Sentry.init({ dsn: 'your-dsn' });
    } else {
      console.log('🔧 Crash reporting disabled in development');
    }
  }

  setUser(userId: string, businessId?: string) {
    this.userId = userId;
    this.businessId = businessId;
    
    if (this.isEnabled) {
      // Update user context in crash reporting service
      // Example: Sentry.setUser({ id: userId, businessId });
    }
  }

  recordError(error: Error, context?: Record<string, any>) {
    const report: CrashReport = {
      error,
      context,
      userId: this.userId,
      businessId: this.businessId,
      timestamp: new Date(),
      appVersion: '1.0.0', // Should come from app config
      platform: 'mobile',
    };

    if (this.isEnabled) {
      // Send to crash reporting service
      this.sendToCrashService(report);
    } else {
      // Log to console in development
      console.error('🚨 Crash Report (DEV):', {
        message: error.message,
        stack: error.stack,
        context,
        userId: this.userId,
        businessId: this.businessId,
      });
    }
  }

  recordException(message: string, context?: Record<string, any>) {
    const error = new Error(message);
    this.recordError(error, context);
  }

  addBreadcrumb(message: string, category: string = 'default', data?: Record<string, any>) {
    if (this.isEnabled) {
      // Add breadcrumb to crash reporting service
      // Example: Sentry.addBreadcrumb({ message, category, data });
    } else {
      console.log(`🍞 Breadcrumb (${category}):`, message, data);
    }
  }

  private async sendToCrashService(report: CrashReport) {
    try {
      // In production, send to your crash reporting service
      // Example implementations:
      
      // Sentry:
      // Sentry.captureException(report.error, { contexts: { report } });
      
      // Custom API:
      // await fetch('/api/crash-reports', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(report)
      // });
      
      console.log('📊 Crash report sent to service');
    } catch (sendError) {
      console.error('❌ Failed to send crash report:', sendError);
    }
  }

  // Utility method to wrap async operations with error reporting
  async withErrorReporting<T>(
    operation: () => Promise<T>,
    context?: Record<string, any>
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      this.recordError(error as Error, context);
      throw error; // Re-throw so the caller can handle it
    }
  }

  // Utility method to wrap sync operations with error reporting
  withSyncErrorReporting<T>(
    operation: () => T,
    context?: Record<string, any>
  ): T {
    try {
      return operation();
    } catch (error) {
      this.recordError(error as Error, context);
      throw error; // Re-throw so the caller can handle it
    }
  }
}

// Global instance
export const CrashReporting = new CrashReportingService();

// React Hook for error reporting
export function useErrorReporting() {
  return {
    recordError: CrashReporting.recordError.bind(CrashReporting),
    recordException: CrashReporting.recordException.bind(CrashReporting),
    addBreadcrumb: CrashReporting.addBreadcrumb.bind(CrashReporting),
    withErrorReporting: CrashReporting.withErrorReporting.bind(CrashReporting),
  };
}

// Global error handler for unhandled promise rejections
if (typeof global !== 'undefined') {
  const originalHandler = global.ErrorUtils?.getGlobalHandler();
  
  global.ErrorUtils?.setGlobalHandler((error: Error, isFatal?: boolean) => {
    CrashReporting.recordError(error, { 
      isFatal, 
      source: 'global_error_handler' 
    });
    
    // Call original handler if it exists
    if (originalHandler) {
      originalHandler(error, isFatal);
    }
  });
}

export default CrashReporting;
