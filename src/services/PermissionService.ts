import { Permission, BusinessRole, ROLE_PERMISSIONS } from '../types/database';
import DatabaseService from './DatabaseServiceFactory';

class PermissionService {
  // Check if user has specific permission for a business
  async hasPermission(
    userId: string, 
    businessId: string, 
    permission: Permission
  ): Promise<boolean> {
    try {
      const permissions = await DatabaseService.getUserPermissions(userId, businessId);
      return permissions.includes(permission);
    } catch (error) {
      console.error('Permission check error:', error);
      return false;
    }
  }

  // Check multiple permissions at once
  async hasPermissions(
    userId: string, 
    businessId: string, 
    permissions: Permission[]
  ): Promise<{ [key in Permission]?: boolean }> {
    try {
      const userPermissions = await DatabaseService.getUserPermissions(userId, businessId);
      const result: { [key in Permission]?: boolean } = {};
      
      permissions.forEach(permission => {
        result[permission] = userPermissions.includes(permission);
      });
      
      return result;
    } catch (error) {
      console.error('Multiple permissions check error:', error);
      return {};
    }
  }

  // Get user's role in a business
  async getUserRole(userId: string, businessId: string): Promise<BusinessRole | null> {
    try {
      const memberships = await DatabaseService.getUserBusinessMemberships(userId);
      const membership = memberships.find(m => m.businessId === businessId && m.isActive);
      return membership?.role || null;
    } catch (error) {
      console.error('Get user role error:', error);
      return null;
    }
  }

  // Check if user can access specific tabs/screens
  async getAccessibleTabs(userId: string, businessId: string): Promise<{
    dashboard: boolean;
    revenue: boolean;
    expenses: boolean;
    statistics: boolean;
    settings: boolean;
  }> {
    try {
      const permissions = await this.hasPermissions(userId, businessId, [
        Permission.VIEW_DASHBOARD,
        Permission.VIEW_REVENUE_TOTALS,
        Permission.VIEW_REVENUE_LIST,
        Permission.ADD_REVENUE,
        Permission.VIEW_EXPENSE_TOTALS,
        Permission.VIEW_EXPENSE_LIST,
        Permission.ADD_EXPENSES,
        Permission.VIEW_STATISTICS
      ]);

      return {
        dashboard: permissions[Permission.VIEW_DASHBOARD] || false,
        revenue: permissions[Permission.VIEW_REVENUE_TOTALS] || 
                permissions[Permission.VIEW_REVENUE_LIST] || 
                permissions[Permission.ADD_REVENUE] || false,
        expenses: permissions[Permission.VIEW_EXPENSE_TOTALS] || 
                 permissions[Permission.VIEW_EXPENSE_LIST] || 
                 permissions[Permission.ADD_EXPENSES] || false,
        statistics: permissions[Permission.VIEW_STATISTICS] || false,
        settings: true // Settings always accessible
      };
    } catch (error) {
      console.error('Get accessible tabs error:', error);
      return {
        dashboard: false,
        revenue: false,
        expenses: false,
        statistics: false,
        settings: true
      };
    }
  }

  // Check what actions user can perform on revenue
  async getRevenuePermissions(userId: string, businessId: string): Promise<{
    canViewTotals: boolean;
    canViewList: boolean;
    canAdd: boolean;
    canEdit: boolean;
    canDelete: boolean;
  }> {
    try {
      const permissions = await this.hasPermissions(userId, businessId, [
        Permission.VIEW_REVENUE_TOTALS,
        Permission.VIEW_REVENUE_LIST,
        Permission.ADD_REVENUE,
        Permission.EDIT_REVENUE,
        Permission.DELETE_REVENUE
      ]);

      return {
        canViewTotals: permissions[Permission.VIEW_REVENUE_TOTALS] || false,
        canViewList: permissions[Permission.VIEW_REVENUE_LIST] || false,
        canAdd: permissions[Permission.ADD_REVENUE] || false,
        canEdit: permissions[Permission.EDIT_REVENUE] || false,
        canDelete: permissions[Permission.DELETE_REVENUE] || false
      };
    } catch (error) {
      console.error('Get revenue permissions error:', error);
      return {
        canViewTotals: false,
        canViewList: false,
        canAdd: false,
        canEdit: false,
        canDelete: false
      };
    }
  }

  // Check what actions user can perform on expenses
  async getExpensePermissions(userId: string, businessId: string): Promise<{
    canViewTotals: boolean;
    canViewList: boolean;
    canAdd: boolean;
    canEdit: boolean;
    canDelete: boolean;
  }> {
    try {
      const permissions = await this.hasPermissions(userId, businessId, [
        Permission.VIEW_EXPENSE_TOTALS,
        Permission.VIEW_EXPENSE_LIST,
        Permission.ADD_EXPENSES,
        Permission.EDIT_EXPENSES,
        Permission.DELETE_EXPENSES
      ]);

      return {
        canViewTotals: permissions[Permission.VIEW_EXPENSE_TOTALS] || false,
        canViewList: permissions[Permission.VIEW_EXPENSE_LIST] || false,
        canAdd: permissions[Permission.ADD_EXPENSES] || false,
        canEdit: permissions[Permission.EDIT_EXPENSES] || false,
        canDelete: permissions[Permission.DELETE_EXPENSES] || false
      };
    } catch (error) {
      console.error('Get expense permissions error:', error);
      return {
        canViewTotals: false,
        canViewList: false,
        canAdd: false,
        canEdit: false,
        canDelete: false
      };
    }
  }

  // Check if user is business owner
  async isBusinessOwner(userId: string, businessId: string): Promise<boolean> {
    const role = await this.getUserRole(userId, businessId);
    return role === BusinessRole.OWNER;
  }

  // Check if user is manager
  async isManager(userId: string, businessId: string): Promise<boolean> {
    const role = await this.getUserRole(userId, businessId);
    return role === BusinessRole.MANAGER;
  }

  // Get role display name
  getRoleDisplayName(role: BusinessRole): string {
    switch (role) {
      case BusinessRole.OWNER:
        return 'Business Owner';
      case BusinessRole.MANAGER:
        return 'Manager';
      case BusinessRole.EMPLOYEE:
        return 'Employee';
      case BusinessRole.ACCOUNTANT:
        return 'Accountant';
      default:
        return 'Team Member';
    }
  }

  // Get permissions for a role (static method)
  getPermissionsForRole(role: BusinessRole): Permission[] {
    return ROLE_PERMISSIONS[role] || [];
  }

  // Check if role has specific permission (static method)
  roleHasPermission(role: BusinessRole, permission: Permission): boolean {
    const permissions = this.getPermissionsForRole(role);
    return permissions.includes(permission);
  }
}

export default new PermissionService();
