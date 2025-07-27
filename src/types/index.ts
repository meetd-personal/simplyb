export interface Transaction {
  id: string;
  type: 'revenue' | 'expense';
  amount: number;
  description?: string; // Optional - category is the main identifier
  category: string;
  date: Date;
  receiptUri?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Revenue extends Omit<Transaction, 'type'> {
  type: 'revenue';
  source?: string;
}

export interface Expense extends Omit<Transaction, 'type'> {
  type: 'expense';
  vendor?: string;
  isBusinessExpense: boolean;
}

export interface Category {
  id: string;
  name: string;
  type: 'revenue' | 'expense';
  color: string;
  icon?: string;
}

export interface BusinessStats {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  profitMargin: number;
  monthlyRevenue: number[];
  monthlyExpenses: number[];
  topRevenueCategories: CategoryStat[];
  topExpenseCategories: CategoryStat[];
}

export interface CategoryStat {
  category: string;
  amount: number;
  percentage: number;
  color: string;
}

export interface DateRange {
  startDate: Date;
  endDate: Date;
}

export interface FilterOptions {
  dateRange?: DateRange;
  categories?: string[];
  minAmount?: number;
  maxAmount?: number;
}

// User and Authentication Types
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  createdAt: Date;
  lastLoginAt: Date;
  isActive: boolean;
  // Role and business associations are now handled through BusinessMember relationships
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  businesses: import('./database').Business[];
  currentBusiness: import('./database').Business | null;
  currentUserRole: import('./database').BusinessRole | null;
  needsBusinessSelection: boolean;
  navigationKey?: string; // Used to force app refresh when business switches
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  businessName: string;
  role: UserRole;
}

export interface Business {
  id: string;
  name: string;
  ownerId: string;
  createdAt: Date;
  teamMembers: User[];
}

// Navigation Types
export type RootStackParamList = {
  Auth: undefined;
  Login: { email?: string; message?: string } | undefined;
  Signup: undefined;
  BusinessOnboarding: undefined;
  WaitingForInvitation: undefined;
  AcceptInvitation: { token: string };
  InvitationAcceptance: { token: string };
  MainTabs: undefined;
  AddTransaction: { type: 'revenue' | 'expense' };
  TransactionDetail: { transactionId: string };
  Settings: undefined;
  UserProfile: undefined;
  ManageTeam: undefined;
  Integrations: undefined;
  ConnectPlatform: { platform: import('./database').DeliveryPlatform };
  BusinessSelection: {
    businesses: import('./database').Business[];
    userId: string;
    source?: 'settings' | 'onboarding'; // Track where the user came from
  };
  CreateBusiness: {
    userId: string;
  };
};

export type AuthStackParamList = {
  Login: undefined;
  Signup: undefined;
  TeamMemberSignup: {
    invitationToken?: string;
    businessName?: string;
    inviterName?: string;
    role?: string;
  };
  AcceptInvitation: { token: string };
  BusinessSelection: {
    businesses: import('./database').Business[];
    userId: string;
    source?: 'settings' | 'onboarding'; // Track where the user came from
  };
  CreateBusiness: {
    userId: string;
  };
};

export type MainTabParamList = {
  Dashboard: undefined;
  Revenue: undefined;
  Expenses: undefined;
  Statistics: undefined;
  Settings: undefined;
};
