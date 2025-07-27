// Role-Based Access Control Types

export enum UserRole {
  OWNER = 'OWNER',
  MANAGER = 'MANAGER', 
  EMPLOYEE = 'EMPLOYEE'
}

export enum Permission {
  // Dashboard Permissions
  VIEW_DASHBOARD = 'view_dashboard',
  VIEW_FINANCIAL_OVERVIEW = 'view_financial_overview',
  VIEW_RECENT_TRANSACTIONS = 'view_recent_transactions',
  
  // Financial Permissions
  VIEW_REVENUE_TOTALS = 'view_revenue_totals',
  VIEW_EXPENSE_TOTALS = 'view_expense_totals',
  VIEW_NET_PROFIT = 'view_net_profit',
  ADD_REVENUE = 'add_revenue',
  ADD_EXPENSES = 'add_expenses',
  EDIT_TRANSACTIONS = 'edit_transactions',
  DELETE_TRANSACTIONS = 'delete_transactions',
  VIEW_FINANCIAL_REPORTS = 'view_financial_reports',
  
  // HR Permissions
  VIEW_ALL_SCHEDULES = 'view_all_schedules',
  VIEW_OWN_SCHEDULE = 'view_own_schedule',
  CREATE_SCHEDULES = 'create_schedules',
  EDIT_SCHEDULES = 'edit_schedules',
  APPROVE_TIME_OFF = 'approve_time_off',
  REQUEST_TIME_OFF = 'request_time_off',
  VIEW_ALL_PAYROLL = 'view_all_payroll',
  VIEW_OWN_PAYROLL = 'view_own_payroll',
  SET_HOURLY_PAY = 'set_hourly_pay',
  VIEW_WORKED_HOURS = 'view_worked_hours',
  
  // Settings Permissions
  MANAGE_BUSINESS_SETTINGS = 'manage_business_settings',
  MANAGE_USER_SETTINGS = 'manage_user_settings',
  MANAGE_TEAM = 'manage_team',
  INVITE_USERS = 'invite_users',
  
  // System Permissions
  SWITCH_BUSINESS = 'switch_business',
  VIEW_INTEGRATIONS = 'view_integrations',
  MANAGE_INTEGRATIONS = 'manage_integrations'
}

// Role-Permission Mapping
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  [UserRole.OWNER]: [
    // Full access to everything
    Permission.VIEW_DASHBOARD,
    Permission.VIEW_FINANCIAL_OVERVIEW,
    Permission.VIEW_RECENT_TRANSACTIONS,
    Permission.VIEW_REVENUE_TOTALS,
    Permission.VIEW_EXPENSE_TOTALS,
    Permission.VIEW_NET_PROFIT,
    Permission.ADD_REVENUE,
    Permission.ADD_EXPENSES,
    Permission.EDIT_TRANSACTIONS,
    Permission.DELETE_TRANSACTIONS,
    Permission.VIEW_FINANCIAL_REPORTS,
    Permission.VIEW_ALL_SCHEDULES,
    Permission.VIEW_OWN_SCHEDULE,
    Permission.CREATE_SCHEDULES,
    Permission.EDIT_SCHEDULES,
    Permission.APPROVE_TIME_OFF,
    Permission.REQUEST_TIME_OFF,
    Permission.VIEW_ALL_PAYROLL,
    Permission.VIEW_OWN_PAYROLL,
    Permission.SET_HOURLY_PAY,
    Permission.VIEW_WORKED_HOURS,
    Permission.MANAGE_BUSINESS_SETTINGS,
    Permission.MANAGE_USER_SETTINGS,
    Permission.MANAGE_TEAM,
    Permission.INVITE_USERS,
    Permission.SWITCH_BUSINESS,
    Permission.VIEW_INTEGRATIONS,
    Permission.MANAGE_INTEGRATIONS
  ],
  
  [UserRole.MANAGER]: [
    // Limited financial access, HR management capabilities
    Permission.VIEW_DASHBOARD,
    Permission.VIEW_RECENT_TRANSACTIONS, // Can see transactions but not totals
    Permission.ADD_REVENUE,
    Permission.ADD_EXPENSES,
    Permission.VIEW_ALL_SCHEDULES,
    Permission.VIEW_OWN_SCHEDULE,
    Permission.CREATE_SCHEDULES,
    Permission.EDIT_SCHEDULES,
    Permission.APPROVE_TIME_OFF,
    Permission.REQUEST_TIME_OFF,
    Permission.VIEW_ALL_PAYROLL,
    Permission.VIEW_OWN_PAYROLL,
    Permission.SET_HOURLY_PAY,
    Permission.VIEW_WORKED_HOURS,
    Permission.MANAGE_USER_SETTINGS,
    Permission.VIEW_INTEGRATIONS
  ],
  
  [UserRole.EMPLOYEE]: [
    // HR-focused, no financial access
    Permission.VIEW_DASHBOARD, // Employee-specific dashboard
    Permission.VIEW_OWN_SCHEDULE,
    Permission.REQUEST_TIME_OFF,
    Permission.VIEW_OWN_PAYROLL,
    Permission.VIEW_WORKED_HOURS,
    Permission.MANAGE_USER_SETTINGS
  ]
};

// Screen Access by Role
export interface ScreenAccess {
  route: string;
  component: string;
  permissions: Permission[];
  icon?: string;
  label?: string;
}

export const ROLE_SCREENS: Record<UserRole, ScreenAccess[]> = {
  [UserRole.OWNER]: [
    {
      route: 'Dashboard',
      component: 'OwnerDashboard',
      permissions: [Permission.VIEW_DASHBOARD, Permission.VIEW_FINANCIAL_OVERVIEW],
      icon: 'speedometer',
      label: 'Dashboard'
    },
    {
      route: 'Revenue',
      component: 'RevenueScreen',
      permissions: [Permission.VIEW_REVENUE_TOTALS, Permission.ADD_REVENUE],
      icon: 'trending-up',
      label: 'Revenue'
    },
    {
      route: 'Expenses',
      component: 'ExpensesScreen', 
      permissions: [Permission.VIEW_EXPENSE_TOTALS, Permission.ADD_EXPENSES],
      icon: 'trending-down',
      label: 'Expenses'
    },
    {
      route: 'Reports',
      component: 'FinancialReportsScreen',
      permissions: [Permission.VIEW_FINANCIAL_REPORTS],
      icon: 'bar-chart',
      label: 'Reports'
    },
    {
      route: 'HR',
      component: 'HRManagementScreen',
      permissions: [Permission.VIEW_ALL_SCHEDULES, Permission.MANAGE_TEAM],
      icon: 'people',
      label: 'HR Management'
    },
    {
      route: 'Settings',
      component: 'OwnerSettingsScreen',
      permissions: [Permission.MANAGE_BUSINESS_SETTINGS],
      icon: 'settings',
      label: 'Settings'
    }
  ],
  
  [UserRole.MANAGER]: [
    {
      route: 'Dashboard',
      component: 'ManagerDashboard',
      permissions: [Permission.VIEW_DASHBOARD],
      icon: 'speedometer',
      label: 'Dashboard'
    },
    {
      route: 'Transactions',
      component: 'ManagerTransactionsScreen',
      permissions: [Permission.VIEW_RECENT_TRANSACTIONS, Permission.ADD_REVENUE, Permission.ADD_EXPENSES],
      icon: 'receipt',
      label: 'Transactions'
    },
    {
      route: 'Schedule',
      component: 'ScheduleManagementScreen',
      permissions: [Permission.VIEW_ALL_SCHEDULES, Permission.CREATE_SCHEDULES],
      icon: 'calendar',
      label: 'Schedules'
    },
    {
      route: 'Payroll',
      component: 'PayrollManagementScreen',
      permissions: [Permission.VIEW_ALL_PAYROLL, Permission.SET_HOURLY_PAY],
      icon: 'card',
      label: 'Payroll'
    },
    {
      route: 'Settings',
      component: 'ManagerSettingsScreen',
      permissions: [Permission.MANAGE_USER_SETTINGS],
      icon: 'settings',
      label: 'Settings'
    }
  ],
  
  [UserRole.EMPLOYEE]: [
    {
      route: 'Dashboard',
      component: 'EmployeeDashboard',
      permissions: [Permission.VIEW_DASHBOARD],
      icon: 'speedometer',
      label: 'My Dashboard'
    },
    {
      route: 'Schedule',
      component: 'MyScheduleScreen',
      permissions: [Permission.VIEW_OWN_SCHEDULE],
      icon: 'calendar',
      label: 'My Schedule'
    },
    {
      route: 'TimeOff',
      component: 'TimeOffRequestScreen',
      permissions: [Permission.REQUEST_TIME_OFF],
      icon: 'time',
      label: 'Time Off'
    },
    {
      route: 'Payroll',
      component: 'MyPayrollScreen',
      permissions: [Permission.VIEW_OWN_PAYROLL, Permission.VIEW_WORKED_HOURS],
      icon: 'card',
      label: 'My Pay'
    },
    {
      route: 'Profile',
      component: 'EmployeeProfileScreen',
      permissions: [Permission.MANAGE_USER_SETTINGS],
      icon: 'person',
      label: 'Profile'
    }
  ]
};
