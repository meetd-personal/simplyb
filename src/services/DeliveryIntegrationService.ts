import {
  DeliveryPlatform,
  DeliveryIntegration,
  DeliveryCredentials,
  SyncStatus,
  SyncFrequency,
  Transaction,
  TransactionType,
  SyncLog
} from '../types/database';
import DatabaseService from './DatabaseServiceFactory';

// Mock delivery platform APIs (in production, these would be real API calls)
interface DeliveryOrder {
  id: string;
  platformOrderId: string;
  amount: number;
  date: Date;
  customerName?: string;
  items?: string[];
  fees?: {
    deliveryFee: number;
    serviceFee: number;
    commission: number;
  };
}

class DeliveryIntegrationService {
  private syncIntervals: Map<string, NodeJS.Timeout> = new Map();

  // Setup Integration
  async setupIntegration(
    businessId: string,
    platform: DeliveryPlatform,
    credentials: DeliveryCredentials
  ): Promise<{ success: boolean; integration?: DeliveryIntegration; error?: string }> {
    try {
      // Validate credentials
      const isValid = await this.validateCredentials(platform, credentials);
      if (!isValid) {
        return { success: false, error: 'Invalid credentials provided' };
      }

      // Create integration
      const integration = await DatabaseService.createDeliveryIntegration({
        businessId,
        platform,
        isActive: true,
        credentials,
        syncStatus: SyncStatus.PENDING,
        autoSync: true,
        syncFrequency: SyncFrequency.EVERY_30_MINUTES
      });

      // Start auto-sync if enabled
      if (integration.autoSync) {
        this.startAutoSync(integration);
      }

      return { success: true, integration };
    } catch (error) {
      console.error('Setup integration error:', error);
      return { success: false, error: 'Failed to setup integration' };
    }
  }

  // Manual Sync
  async syncOrders(integrationId: string): Promise<{ success: boolean; recordsAdded: number; error?: string }> {
    try {
      const integrations = await DatabaseService.getDeliveryIntegrations();
      const integration = integrations.find(i => i.id === integrationId);
      
      if (!integration) {
        return { success: false, recordsAdded: 0, error: 'Integration not found' };
      }

      // Update sync status
      await DatabaseService.updateDeliveryIntegration(integrationId, {
        syncStatus: SyncStatus.IN_PROGRESS
      });

      // Fetch orders from platform
      const orders = await this.fetchOrdersFromPlatform(integration);
      
      // Convert to transactions and save
      let recordsAdded = 0;
      for (const order of orders) {
        const existingTransactions = await DatabaseService.getBusinessTransactions(
          integration.businessId,
          { limit: 1000 }
        );
        
        // Check if order already exists
        const exists = existingTransactions.some(t => t.externalId === order.platformOrderId);
        if (!exists) {
          await DatabaseService.createTransaction({
            businessId: integration.businessId,
            type: TransactionType.REVENUE,
            category: this.getPlatformCategoryName(integration.platform),
            amount: order.amount,
            description: `${integration.platform} Order #${order.platformOrderId}`,
            date: order.date,
            revenueCategory: this.getPlatformCategoryId(integration.platform),
            platformOrderId: order.platformOrderId,
            createdBy: 'system',
            sourceIntegration: integrationId,
            externalId: order.platformOrderId,
            syncedAt: new Date()
          });
          recordsAdded++;
        }
      }

      // Update integration status
      await DatabaseService.updateDeliveryIntegration(integrationId, {
        syncStatus: SyncStatus.SUCCESS,
        lastSyncAt: new Date()
      });

      return { success: true, recordsAdded };
    } catch (error) {
      console.error('Sync orders error:', error);
      
      // Update integration with error status
      await DatabaseService.updateDeliveryIntegration(integrationId, {
        syncStatus: SyncStatus.ERROR,
        errorMessage: error instanceof Error ? error.message : 'Unknown error'
      });

      return { success: false, recordsAdded: 0, error: 'Sync failed' };
    }
  }

  // Auto-sync Management
  startAutoSync(integration: DeliveryIntegration): void {
    if (!integration.autoSync || this.syncIntervals.has(integration.id)) {
      return;
    }

    const intervalMs = integration.syncFrequency * 60 * 1000; // Convert minutes to milliseconds
    
    const interval = setInterval(async () => {
      console.log(`Auto-syncing ${integration.platform} for business ${integration.businessId}`);
      await this.syncOrders(integration.id);
    }, intervalMs);

    this.syncIntervals.set(integration.id, interval);
  }

  stopAutoSync(integrationId: string): void {
    const interval = this.syncIntervals.get(integrationId);
    if (interval) {
      clearInterval(interval);
      this.syncIntervals.delete(integrationId);
    }
  }

  // Get Integration Status
  async getIntegrationStatus(businessId: string): Promise<{
    [key in DeliveryPlatform]?: {
      isConnected: boolean;
      lastSync?: Date;
      status: SyncStatus;
      recordsToday: number;
    };
  }> {
    const integrations = await DatabaseService.getBusinessDeliveryIntegrations(businessId);
    const status: any = {};

    for (const integration of integrations) {
      // Get today's synced records
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const todayTransactions = await DatabaseService.getBusinessTransactions(businessId, {
        startDate: today,
        endDate: tomorrow
      });

      const recordsToday = todayTransactions.filter(t => 
        t.sourceIntegration === integration.id
      ).length;

      status[integration.platform] = {
        isConnected: integration.isActive,
        lastSync: integration.lastSyncAt,
        status: integration.syncStatus,
        recordsToday
      };
    }

    return status;
  }

  // Private helper methods
  private async validateCredentials(platform: DeliveryPlatform, credentials: DeliveryCredentials): Promise<boolean> {
    // Mock validation - in production, this would make actual API calls
    switch (platform) {
      case DeliveryPlatform.UBER_EATS:
        return !!(credentials.uberClientId && credentials.uberClientSecret && credentials.uberRestaurantId);
      case DeliveryPlatform.SKIP_THE_DISHES:
        return !!(credentials.skipApiKey && credentials.skipRestaurantId);
      case DeliveryPlatform.DOORDASH:
        return !!(credentials.doorDashDeveloperId && credentials.doorDashKeyId && credentials.doorDashSigningSecret);
      default:
        return false;
    }
  }

  private async fetchOrdersFromPlatform(integration: DeliveryIntegration): Promise<DeliveryOrder[]> {
    // Mock API calls - in production, these would be real API integrations
    const mockOrders: DeliveryOrder[] = [];
    const now = new Date();
    
    // Generate mock orders for the last 24 hours
    for (let i = 0; i < Math.floor(Math.random() * 10) + 5; i++) {
      const orderDate = new Date(now.getTime() - Math.random() * 24 * 60 * 60 * 1000);
      mockOrders.push({
        id: `${integration.platform}_${Date.now()}_${i}`,
        platformOrderId: `${integration.platform.toUpperCase()}-${Math.random().toString(36).substr(2, 9)}`,
        amount: Math.floor(Math.random() * 5000) + 1000, // $10-$60 in cents
        date: orderDate,
        customerName: `Customer ${i + 1}`,
        items: [`Item ${i + 1}`, `Item ${i + 2}`],
        fees: {
          deliveryFee: Math.floor(Math.random() * 300) + 200, // $2-$5
          serviceFee: Math.floor(Math.random() * 200) + 100, // $1-$3
          commission: Math.floor(Math.random() * 500) + 300  // $3-$8
        }
      });
    }

    return mockOrders;
  }

  private getPlatformCategoryName(platform: DeliveryPlatform): string {
    switch (platform) {
      case DeliveryPlatform.UBER_EATS:
        return 'Uber Eats';
      case DeliveryPlatform.SKIP_THE_DISHES:
        return 'Skip The Dishes';
      case DeliveryPlatform.DOORDASH:
        return 'DoorDash';
      default:
        return 'Delivery Platform';
    }
  }

  private getPlatformCategoryId(platform: DeliveryPlatform): string {
    switch (platform) {
      case DeliveryPlatform.UBER_EATS:
        return 'uber_eats';
      case DeliveryPlatform.SKIP_THE_DISHES:
        return 'skip_dishes';
      case DeliveryPlatform.DOORDASH:
        return 'doordash';
      default:
        return 'delivery';
    }
  }

  // Cleanup on app close
  cleanup(): void {
    for (const [integrationId, interval] of this.syncIntervals) {
      clearInterval(interval);
    }
    this.syncIntervals.clear();
  }
}

export default new DeliveryIntegrationService();
