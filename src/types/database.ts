// Database Schema Types for Simply Business Tracker

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  profileImage?: string;
  createdAt: Date;
  lastLoginAt: Date;
  isActive: boolean;
}

export interface Business {
  id: string;
  name: string;
  type: BusinessType;
  description?: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  logo?: string;
  timezone: string;
  currency: string;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
  // Business-specific settings
  settings: BusinessSettings;
}

export interface BusinessSettings {
  // Revenue categories based on business type
  revenueCategories: RevenueCategory[];
  // Tax settings
  taxRate?: number;
  // Fiscal year settings
  fiscalYearStart: string; // MM-DD format
  // Notification preferences
  notifications: NotificationSettings;
  // Integration settings
  integrations: IntegrationSettings;
}

export interface RevenueCategory {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  // For delivery platforms
  platformType?: DeliveryPlatform;
  // Integration status
  isIntegrated: boolean;
  lastSyncAt?: Date;
}

export interface BusinessMember {
  id: string;
  userId: string;
  businessId: string;
  role: BusinessRole;
  permissions: Permission[];
  joinedAt: Date;
  isActive: boolean;
  invitedBy?: string;
  inviteAcceptedAt?: Date;
}

export interface Transaction {
  id: string;
  businessId: string;
  type: TransactionType;
  category: string;
  amount: number;
  description: string;
  date: Date;
  // Revenue-specific fields
  revenueCategory?: string;
  platformOrderId?: string; // For delivery platform orders
  // Expense-specific fields
  vendor?: string;
  receiptUrl?: string;
  // Metadata
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  // Integration data
  sourceIntegration?: string;
  externalId?: string;
  syncedAt?: Date;
}

export interface DeliveryIntegration {
  id: string;
  businessId: string;
  platform: DeliveryPlatform;
  isActive: boolean;
  credentials: DeliveryCredentials;
  lastSyncAt?: Date;
  syncStatus: SyncStatus;
  errorMessage?: string;
  // Sync settings
  autoSync: boolean;
  syncFrequency: SyncFrequency; // minutes
  createdAt: Date;
  updatedAt: Date;
}

export interface DeliveryCredentials {
  // Uber Eats
  uberClientId?: string;
  uberClientSecret?: string;
  uberRestaurantId?: string;
  // Skip The Dishes
  skipApiKey?: string;
  skipRestaurantId?: string;
  // DoorDash
  doorDashDeveloperId?: string;
  doorDashKeyId?: string;
  doorDashSigningSecret?: string;
  doorDashRestaurantId?: string;
}

export interface SyncLog {
  id: string;
  integrationId: string;
  startedAt: Date;
  completedAt?: Date;
  status: SyncStatus;
  recordsProcessed: number;
  recordsAdded: number;
  recordsUpdated: number;
  errorMessage?: string;
  errorDetails?: any;
}

// Enums
export enum BusinessType {
  FOOD_FRANCHISE = 'FOOD_FRANCHISE',
  RESTAURANT = 'RESTAURANT',
  RETAIL = 'RETAIL',
  SERVICE = 'SERVICE',
  OTHER = 'OTHER'
}

export enum BusinessRole {
  OWNER = 'OWNER',
  MANAGER = 'MANAGER',
  EMPLOYEE = 'EMPLOYEE',
  ACCOUNTANT = 'ACCOUNTANT'
}

export enum Permission {
  VIEW_DASHBOARD = 'view_dashboard',
  VIEW_REVENUE_TOTALS = 'view_revenue_totals',
  VIEW_REVENUE_LIST = 'view_revenue_list',
  ADD_REVENUE = 'add_revenue',
  EDIT_REVENUE = 'edit_revenue',
  DELETE_REVENUE = 'delete_revenue',
  VIEW_EXPENSE_TOTALS = 'view_expense_totals',
  VIEW_EXPENSE_LIST = 'view_expense_list',
  ADD_EXPENSES = 'add_expenses',
  EDIT_EXPENSES = 'edit_expenses',
  DELETE_EXPENSES = 'delete_expenses',
  VIEW_STATISTICS = 'view_statistics',
  MANAGE_TEAM = 'manage_team',
  MANAGE_INTEGRATIONS = 'manage_integrations',
  MANAGE_SETTINGS = 'manage_settings',
  EXPORT_DATA = 'export_data'
}

export enum TransactionType {
  REVENUE = 'REVENUE',
  EXPENSE = 'EXPENSE'
}

export enum DeliveryPlatform {
  UBER_EATS = 'uber_eats',
  SKIP_THE_DISHES = 'skip_the_dishes',
  DOORDASH = 'doordash'
}

export enum SyncStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  SUCCESS = 'success',
  ERROR = 'error',
  CANCELLED = 'cancelled'
}

export enum SyncFrequency {
  EVERY_15_MINUTES = 15,
  EVERY_30_MINUTES = 30,
  EVERY_HOUR = 60,
  EVERY_2_HOURS = 120,
  EVERY_4_HOURS = 240,
  EVERY_6_HOURS = 360,
  EVERY_12_HOURS = 720,
  DAILY = 1440
}

export interface NotificationSettings {
  emailNotifications: boolean;
  pushNotifications: boolean;
  syncFailureAlerts: boolean;
  dailySummary: boolean;
  weeklyReport: boolean;
  monthlyReport: boolean;
}

export interface IntegrationSettings {
  deliveryPlatforms: {
    [key in DeliveryPlatform]?: {
      enabled: boolean;
      autoSync: boolean;
      syncFrequency: SyncFrequency;
    };
  };
}

// Default settings for different business types
export const DEFAULT_BUSINESS_SETTINGS: Record<BusinessType, Partial<BusinessSettings>> = {
  [BusinessType.FOOD_FRANCHISE]: {
    revenueCategories: [
      {
        id: 'instore',
        name: 'In-Store Sales',
        description: 'Direct sales at the restaurant location',
        isActive: true,
        isIntegrated: false
      },
      {
        id: 'call_center',
        name: 'Call Center Sales',
        description: 'Phone orders and call center sales',
        isActive: true,
        isIntegrated: false
      },
      {
        id: 'uber_eats',
        name: 'Uber Eats',
        description: 'Orders from Uber Eats platform',
        isActive: true,
        platformType: DeliveryPlatform.UBER_EATS,
        isIntegrated: false
      },
      {
        id: 'skip_dishes',
        name: 'Skip The Dishes',
        description: 'Orders from Skip The Dishes platform',
        isActive: true,
        platformType: DeliveryPlatform.SKIP_THE_DISHES,
        isIntegrated: false
      },
      {
        id: 'doordash',
        name: 'DoorDash',
        description: 'Orders from DoorDash platform',
        isActive: true,
        platformType: DeliveryPlatform.DOORDASH,
        isIntegrated: false
      }
    ],
    notifications: {
      emailNotifications: true,
      pushNotifications: true,
      syncFailureAlerts: true,
      dailySummary: true,
      weeklyReport: true,
      monthlyReport: true
    },
    integrations: {
      deliveryPlatforms: {
        [DeliveryPlatform.UBER_EATS]: {
          enabled: false,
          autoSync: true,
          syncFrequency: SyncFrequency.EVERY_30_MINUTES
        },
        [DeliveryPlatform.SKIP_THE_DISHES]: {
          enabled: false,
          autoSync: true,
          syncFrequency: SyncFrequency.EVERY_30_MINUTES
        },
        [DeliveryPlatform.DOORDASH]: {
          enabled: false,
          autoSync: true,
          syncFrequency: SyncFrequency.EVERY_30_MINUTES
        }
      }
    }
  },
  [BusinessType.RESTAURANT]: {
    revenueCategories: [
      {
        id: 'dine_in',
        name: 'Dine-In Sales',
        description: 'Restaurant dine-in sales',
        isActive: true,
        isIntegrated: false
      },
      {
        id: 'takeout',
        name: 'Takeout Sales',
        description: 'Takeout and pickup orders',
        isActive: true,
        isIntegrated: false
      }
    ]
  },
  [BusinessType.RETAIL]: {
    revenueCategories: [
      {
        id: 'in_store',
        name: 'In-Store Sales',
        description: 'Physical store sales',
        isActive: true,
        isIntegrated: false
      },
      {
        id: 'online',
        name: 'Online Sales',
        description: 'E-commerce and online sales',
        isActive: true,
        isIntegrated: false
      }
    ]
  },
  [BusinessType.SERVICE]: {
    revenueCategories: [
      {
        id: 'service_revenue',
        name: 'Service Revenue',
        description: 'Revenue from services provided',
        isActive: true,
        isIntegrated: false
      }
    ]
  },
  [BusinessType.OTHER]: {
    revenueCategories: [
      {
        id: 'general_revenue',
        name: 'General Revenue',
        description: 'General business revenue',
        isActive: true,
        isIntegrated: false
      }
    ]
  }
};

// Role-based permissions
export const ROLE_PERMISSIONS: Record<BusinessRole, Permission[]> = {
  [BusinessRole.OWNER]: [
    Permission.VIEW_DASHBOARD,
    Permission.VIEW_REVENUE_TOTALS,
    Permission.VIEW_REVENUE_LIST,
    Permission.ADD_REVENUE,
    Permission.EDIT_REVENUE,
    Permission.DELETE_REVENUE,
    Permission.VIEW_EXPENSE_TOTALS,
    Permission.VIEW_EXPENSE_LIST,
    Permission.ADD_EXPENSES,
    Permission.EDIT_EXPENSES,
    Permission.DELETE_EXPENSES,
    Permission.VIEW_STATISTICS,
    Permission.MANAGE_TEAM,
    Permission.MANAGE_INTEGRATIONS,
    Permission.MANAGE_SETTINGS,
    Permission.EXPORT_DATA
  ],
  [BusinessRole.MANAGER]: [
    Permission.VIEW_DASHBOARD,
    Permission.ADD_REVENUE,
    Permission.EDIT_REVENUE,
    Permission.ADD_EXPENSES,
    Permission.EDIT_EXPENSES,
    Permission.EXPORT_DATA
  ],
  [BusinessRole.EMPLOYEE]: [
    Permission.VIEW_DASHBOARD,
    Permission.ADD_REVENUE,
    Permission.ADD_EXPENSES
  ],
  [BusinessRole.ACCOUNTANT]: [
    Permission.VIEW_DASHBOARD,
    Permission.VIEW_REVENUE_TOTALS,
    Permission.VIEW_REVENUE_LIST,
    Permission.VIEW_EXPENSE_TOTALS,
    Permission.VIEW_EXPENSE_LIST,
    Permission.VIEW_STATISTICS,
    Permission.EXPORT_DATA
  ]
};
