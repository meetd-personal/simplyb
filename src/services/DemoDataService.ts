import { 
  BusinessType, 
  BusinessRole, 
  TransactionType, 
  DeliveryPlatform,
  SyncStatus,
  SyncFrequency 
} from '../types/database';
import DatabaseService from './DatabaseServiceFactory';
import DeliveryIntegrationService from './DeliveryIntegrationService';

class DemoDataService {
  async setupDemoData() {
    try {
      // Create demo users
      const owner = await DatabaseService.createUser({
        email: 'owner@pizzapalace.com',
        firstName: 'John',
        lastName: 'Smith',
        isActive: true
      });

      const manager = await DatabaseService.createUser({
        email: 'manager@pizzapalace.com',
        firstName: 'Sarah',
        lastName: 'Johnson',
        isActive: true
      });

      // Create demo businesses
      const pizzaFranchise = await DatabaseService.createBusiness({
        name: 'Pizza Palace Downtown',
        type: BusinessType.FOOD_FRANCHISE,
        description: 'Premium pizza franchise location in downtown core',
        address: '123 Main St, Toronto, ON',
        phone: '(416) 555-0123',
        email: 'downtown@pizzapalace.com',
        website: 'https://pizzapalace.com',
        timezone: 'America/Toronto',
        currency: 'CAD',
        isActive: true,
        ownerId: owner.id
      });

      const cafeShop = await DatabaseService.createBusiness({
        name: 'Cozy Corner Cafe',
        type: BusinessType.RESTAURANT,
        description: 'Local neighborhood cafe serving artisan coffee and pastries',
        address: '456 Queen St, Toronto, ON',
        phone: '(416) 555-0456',
        email: 'hello@cozycorner.com',
        timezone: 'America/Toronto',
        currency: 'CAD',
        isActive: true,
        ownerId: owner.id
      });

      // Add manager to pizza franchise
      await DatabaseService.addBusinessMember({
        userId: manager.id,
        businessId: pizzaFranchise.id,
        role: BusinessRole.MANAGER,
        permissions: [
          'view_dashboard',
          'view_revenue',
          'add_revenue',
          'edit_revenue',
          'view_expenses',
          'add_expenses',
          'edit_expenses',
          'view_statistics',
          'export_data'
        ]
      });

      // Create demo transactions for pizza franchise
      const today = new Date();
      const transactions = [];

      // In-store sales
      for (let i = 0; i < 15; i++) {
        const date = new Date(today.getTime() - Math.random() * 7 * 24 * 60 * 60 * 1000);
        transactions.push({
          businessId: pizzaFranchise.id,
          type: TransactionType.REVENUE,
          category: 'In-Store Sales',
          amount: Math.floor(Math.random() * 8000) + 2000, // $20-$100
          description: `In-store order #${1000 + i}`,
          date,
          revenueCategory: 'instore',
          createdBy: owner.id
        });
      }

      // Call center sales
      for (let i = 0; i < 8; i++) {
        const date = new Date(today.getTime() - Math.random() * 7 * 24 * 60 * 60 * 1000);
        transactions.push({
          businessId: pizzaFranchise.id,
          type: TransactionType.REVENUE,
          category: 'Call Center Sales',
          amount: Math.floor(Math.random() * 6000) + 1500, // $15-$75
          description: `Phone order #${2000 + i}`,
          date,
          revenueCategory: 'call_center',
          createdBy: manager.id
        });
      }

      // Delivery platform orders (mock integrated data)
      const deliveryOrders = [
        { platform: 'Uber Eats', category: 'uber_eats', count: 12 },
        { platform: 'Skip The Dishes', category: 'skip_dishes', count: 8 },
        { platform: 'DoorDash', category: 'doordash', count: 6 }
      ];

      for (const platform of deliveryOrders) {
        for (let i = 0; i < platform.count; i++) {
          const date = new Date(today.getTime() - Math.random() * 7 * 24 * 60 * 60 * 1000);
          transactions.push({
            businessId: pizzaFranchise.id,
            type: TransactionType.REVENUE,
            category: platform.platform,
            amount: Math.floor(Math.random() * 5000) + 1200, // $12-$62
            description: `${platform.platform} Order #${platform.platform.toUpperCase()}-${3000 + i}`,
            date,
            revenueCategory: platform.category,
            platformOrderId: `${platform.platform.toUpperCase()}-${3000 + i}`,
            createdBy: 'system',
            sourceIntegration: 'demo',
            externalId: `${platform.platform.toLowerCase()}_${3000 + i}`,
            syncedAt: new Date()
          });
        }
      }

      // Expenses
      const expenses = [
        { category: 'Food Supplies', amount: 45000, description: 'Weekly food inventory' },
        { category: 'Utilities', amount: 12000, description: 'Monthly electricity bill' },
        { category: 'Rent', amount: 350000, description: 'Monthly rent payment' },
        { category: 'Staff Wages', amount: 280000, description: 'Bi-weekly payroll' },
        { category: 'Marketing', amount: 8000, description: 'Social media advertising' },
        { category: 'Equipment', amount: 15000, description: 'Kitchen equipment maintenance' }
      ];

      for (const expense of expenses) {
        const date = new Date(today.getTime() - Math.random() * 30 * 24 * 60 * 60 * 1000);
        transactions.push({
          businessId: pizzaFranchise.id,
          type: TransactionType.EXPENSE,
          category: expense.category,
          amount: expense.amount,
          description: expense.description,
          date,
          vendor: `${expense.category} Supplier`,
          createdBy: owner.id
        });
      }

      // Create all transactions
      for (const transaction of transactions) {
        await DatabaseService.createTransaction(transaction);
      }

      // Setup demo delivery integrations
      const integrations = [
        {
          platform: DeliveryPlatform.UBER_EATS,
          credentials: {
            uberClientId: 'demo_client_id',
            uberClientSecret: 'demo_client_secret',
            uberRestaurantId: 'demo_restaurant_123'
          }
        },
        {
          platform: DeliveryPlatform.SKIP_THE_DISHES,
          credentials: {
            skipApiKey: 'demo_api_key_skip',
            skipRestaurantId: 'demo_skip_456'
          }
        }
      ];

      for (const integration of integrations) {
        await DatabaseService.createDeliveryIntegration({
          businessId: pizzaFranchise.id,
          platform: integration.platform,
          isActive: true,
          credentials: integration.credentials,
          lastSyncAt: new Date(),
          syncStatus: SyncStatus.SUCCESS,
          autoSync: true,
          syncFrequency: SyncFrequency.EVERY_30_MINUTES
        });
      }

      console.log('Demo data setup completed successfully!');
      return {
        users: [owner, manager],
        businesses: [pizzaFranchise, cafeShop],
        transactionCount: transactions.length
      };

    } catch (error) {
      console.error('Error setting up demo data:', error);
      throw error;
    }
  }

  async clearDemoData() {
    try {
      // This would clear all demo data in a real implementation
      console.log('Demo data cleared');
    } catch (error) {
      console.error('Error clearing demo data:', error);
    }
  }

  async createDemoAccount(email: string, businessName: string) {
    try {
      // Create user
      const user = await DatabaseService.createUser({
        email,
        firstName: 'Demo',
        lastName: 'User',
        isActive: true
      });

      // Create business
      const business = await DatabaseService.createBusiness({
        name: businessName,
        type: BusinessType.FOOD_FRANCHISE,
        description: 'Demo business for testing',
        timezone: 'America/Toronto',
        currency: 'CAD',
        isActive: true,
        ownerId: user.id
      });

      // Add some sample transactions
      const sampleTransactions = [
        {
          type: TransactionType.REVENUE,
          category: 'In-Store Sales',
          amount: 4500,
          description: 'Daily sales',
          revenueCategory: 'instore'
        },
        {
          type: TransactionType.REVENUE,
          category: 'Uber Eats',
          amount: 2800,
          description: 'Delivery orders',
          revenueCategory: 'uber_eats'
        },
        {
          type: TransactionType.EXPENSE,
          category: 'Food Supplies',
          amount: 1200,
          description: 'Ingredient purchase'
        }
      ];

      for (const transaction of sampleTransactions) {
        await DatabaseService.createTransaction({
          businessId: business.id,
          type: transaction.type,
          category: transaction.category,
          amount: transaction.amount,
          description: transaction.description,
          date: new Date(),
          revenueCategory: transaction.revenueCategory,
          createdBy: user.id
        });
      }

      return { user, business };
    } catch (error) {
      console.error('Error creating demo account:', error);
      throw error;
    }
  }
}

export default new DemoDataService();
