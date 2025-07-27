import { UserRole, Permission, ROLE_PERMISSIONS, ROLE_SCREENS, ScreenAccess } from '../types/permissions';
import { BusinessRole } from '../types/database';

class RoleBasedPermissionService {
  /**
   * Convert BusinessRole to UserRole for compatibility
   */
  private convertBusinessRoleToUserRole(businessRole: BusinessRole): UserRole {
    switch (businessRole) {
      case BusinessRole.OWNER:
        return UserRole.OWNER;
      case BusinessRole.MANAGER:
        return UserRole.MANAGER;
      case BusinessRole.EMPLOYEE:
      case BusinessRole.ACCOUNTANT:
        return UserRole.EMPLOYEE;
      default:
        return UserRole.EMPLOYEE;
    }
  }

  /**
   * Check if a user role has a specific permission
   */
  hasPermission(userRole: BusinessRole | UserRole | null, permission: Permission): boolean {
    if (!userRole) return false;
    
    // Convert BusinessRole to UserRole if needed
    const role = typeof userRole === 'string' && Object.values(BusinessRole).includes(userRole as BusinessRole)
      ? this.convertBusinessRoleToUserRole(userRole as BusinessRole)
      : userRole as UserRole;
    
    const rolePermissions = ROLE_PERMISSIONS[role];
    return rolePermissions?.includes(permission) || false;
  }

  /**
   * Check if a user role has any of the specified permissions
   */
  hasAnyPermission(userRole: BusinessRole | UserRole | null, permissions: Permission[]): boolean {
    if (!userRole) return false;
    
    return permissions.some(permission => this.hasPermission(userRole, permission));
  }

  /**
   * Check if a user role has all of the specified permissions
   */
  hasAllPermissions(userRole: BusinessRole | UserRole | null, permissions: Permission[]): boolean {
    if (!userRole) return false;
    
    return permissions.every(permission => this.hasPermission(userRole, permission));
  }

  /**
   * Get all permissions for a user role
   */
  getRolePermissions(userRole: BusinessRole | UserRole): Permission[] {
    const role = typeof userRole === 'string' && Object.values(BusinessRole).includes(userRole as BusinessRole)
      ? this.convertBusinessRoleToUserRole(userRole as BusinessRole)
      : userRole as UserRole;
    
    return ROLE_PERMISSIONS[role] || [];
  }

  /**
   * Get accessible screens for a user role
   */
  getAccessibleScreens(userRole: BusinessRole | UserRole): ScreenAccess[] {
    const role = typeof userRole === 'string' && Object.values(BusinessRole).includes(userRole as BusinessRole)
      ? this.convertBusinessRoleToUserRole(userRole as BusinessRole)
      : userRole as UserRole;
    
    return ROLE_SCREENS[role] || [];
  }

  /**
   * Check if a user can access a specific screen
   */
  canAccessScreen(userRole: BusinessRole | UserRole | null, screenRoute: string): boolean {
    if (!userRole) return false;
    
    const role = typeof userRole === 'string' && Object.values(BusinessRole).includes(userRole as BusinessRole)
      ? this.convertBusinessRoleToUserRole(userRole as BusinessRole)
      : userRole as UserRole;
    
    const accessibleScreens = this.getAccessibleScreens(role);
    const screen = accessibleScreens.find(s => s.route === screenRoute);
    
    if (!screen) return false;
    
    // Check if user has required permissions for the screen
    return this.hasAllPermissions(userRole, screen.permissions);
  }

  /**
   * Financial Data Access Helpers
   */
  canViewFinancialTotals(userRole: BusinessRole | UserRole | null): boolean {
    return this.hasAnyPermission(userRole, [
      Permission.VIEW_REVENUE_TOTALS,
      Permission.VIEW_EXPENSE_TOTALS,
      Permission.VIEW_NET_PROFIT
    ]);
  }

  canViewNetProfit(userRole: BusinessRole | UserRole | null): boolean {
    return this.hasPermission(userRole, Permission.VIEW_NET_PROFIT);
  }

  canManageTransactions(userRole: BusinessRole | UserRole | null): boolean {
    return this.hasAnyPermission(userRole, [
      Permission.EDIT_TRANSACTIONS,
      Permission.DELETE_TRANSACTIONS
    ]);
  }

  canAddTransactions(userRole: BusinessRole | UserRole | null): boolean {
    return this.hasAnyPermission(userRole, [
      Permission.ADD_REVENUE,
      Permission.ADD_EXPENSES
    ]);
  }

  /**
   * HR Access Helpers
   */
  canManageSchedules(userRole: BusinessRole | UserRole | null): boolean {
    return this.hasAnyPermission(userRole, [
      Permission.CREATE_SCHEDULES,
      Permission.EDIT_SCHEDULES
    ]);
  }

  canViewAllPayroll(userRole: BusinessRole | UserRole | null): boolean {
    return this.hasPermission(userRole, Permission.VIEW_ALL_PAYROLL);
  }

  canApproveTimeOff(userRole: BusinessRole | UserRole | null): boolean {
    return this.hasPermission(userRole, Permission.APPROVE_TIME_OFF);
  }

  canManageTeam(userRole: BusinessRole | UserRole | null): boolean {
    return this.hasPermission(userRole, Permission.MANAGE_TEAM);
  }

  /**
   * Settings Access Helpers
   */
  canManageBusinessSettings(userRole: BusinessRole | UserRole | null): boolean {
    return this.hasPermission(userRole, Permission.MANAGE_BUSINESS_SETTINGS);
  }

  canSwitchBusiness(userRole: BusinessRole | UserRole | null): boolean {
    return this.hasPermission(userRole, Permission.SWITCH_BUSINESS);
  }

  canManageIntegrations(userRole: BusinessRole | UserRole | null): boolean {
    return this.hasPermission(userRole, Permission.MANAGE_INTEGRATIONS);
  }

  /**
   * Get role-specific dashboard component
   */
  getDashboardComponent(userRole: BusinessRole | UserRole): string {
    const role = typeof userRole === 'string' && Object.values(BusinessRole).includes(userRole as BusinessRole)
      ? this.convertBusinessRoleToUserRole(userRole as BusinessRole)
      : userRole as UserRole;
    
    const screens = this.getAccessibleScreens(role);
    const dashboardScreen = screens.find(s => s.route === 'Dashboard');
    return dashboardScreen?.component || 'DashboardScreen';
  }

  /**
   * Get navigation tabs for a user role
   */
  getNavigationTabs(userRole: BusinessRole | UserRole): ScreenAccess[] {
    const role = typeof userRole === 'string' && Object.values(BusinessRole).includes(userRole as BusinessRole)
      ? this.convertBusinessRoleToUserRole(userRole as BusinessRole)
      : userRole as UserRole;
    
    return this.getAccessibleScreens(role).filter(screen => 
      screen.icon && screen.label
    );
  }

  /**
   * Filter data based on role permissions
   */
  filterFinancialData(userRole: BusinessRole | UserRole | null, data: any) {
    if (!userRole) return null;

    const filteredData = { ...data };

    // Remove financial totals for managers and employees
    if (!this.canViewFinancialTotals(userRole)) {
      delete filteredData.totalRevenue;
      delete filteredData.totalExpenses;
      delete filteredData.netProfit;
      delete filteredData.profitMargin;
    }

    // Remove net profit specifically for managers
    if (!this.canViewNetProfit(userRole)) {
      delete filteredData.netProfit;
      delete filteredData.profitMargin;
    }

    return filteredData;
  }

  /**
   * Get role display name
   */
  getRoleDisplayName(userRole: BusinessRole | UserRole): string {
    const role = typeof userRole === 'string' && Object.values(BusinessRole).includes(userRole as BusinessRole)
      ? this.convertBusinessRoleToUserRole(userRole as BusinessRole)
      : userRole as UserRole;
    
    switch (role) {
      case UserRole.OWNER:
        return 'Business Owner';
      case UserRole.MANAGER:
        return 'Manager';
      case UserRole.EMPLOYEE:
        return 'Team Member';
      default:
        return 'Unknown';
    }
  }

  /**
   * Check if role is hierarchically higher
   */
  isHigherRole(userRole: BusinessRole | UserRole, targetRole: BusinessRole | UserRole): boolean {
    const convertRole = (role: BusinessRole | UserRole): UserRole => {
      return typeof role === 'string' && Object.values(BusinessRole).includes(role as BusinessRole)
        ? this.convertBusinessRoleToUserRole(role as BusinessRole)
        : role as UserRole;
    };

    const hierarchy = {
      [UserRole.OWNER]: 3,
      [UserRole.MANAGER]: 2,
      [UserRole.EMPLOYEE]: 1
    };

    const userRoleConverted = convertRole(userRole);
    const targetRoleConverted = convertRole(targetRole);

    return hierarchy[userRoleConverted] > hierarchy[targetRoleConverted];
  }

  /**
   * Get accessible tab configuration for navigation
   */
  getTabConfiguration(userRole: BusinessRole | UserRole): Array<{
    name: string;
    component: string;
    options: {
      tabBarIcon: ({ color, size }: { color: string; size: number }) => any;
      title: string;
    };
  }> {
    const tabs = this.getNavigationTabs(userRole);
    
    return tabs.map(tab => ({
      name: tab.route,
      component: tab.component,
      options: {
        tabBarIcon: ({ color, size }: { color: string; size: number }) => {
          // This would be implemented with actual icon components
          return null; // Placeholder
        },
        title: tab.label || tab.route
      }
    }));
  }
}

export default new RoleBasedPermissionService();
