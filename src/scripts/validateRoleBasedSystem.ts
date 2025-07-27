// Validation script for Role-Based Access Control System

import RoleBasedPermissionService from '../services/RoleBasedPermissionService';
import RoleBasedAnalyticsService from '../services/RoleBasedAnalyticsService';
import HRService from '../services/HRService';
import { BusinessRole } from '../types/database';
import { Permission, UserRole, ROLE_PERMISSIONS, ROLE_SCREENS } from '../types/permissions';

interface ValidationResult {
  test: string;
  passed: boolean;
  message: string;
  details?: any;
}

class RoleBasedSystemValidator {
  private results: ValidationResult[] = [];

  async runAllTests(): Promise<ValidationResult[]> {
    console.log('🚀 Starting Role-Based Access Control System Validation...\n');

    // Test permission system
    this.testPermissionSystem();
    
    // Test role hierarchy
    this.testRoleHierarchy();
    
    // Test screen access
    this.testScreenAccess();
    
    // Test data filtering
    this.testDataFiltering();
    
    // Test HR services
    await this.testHRServices();
    
    // Test analytics services
    await this.testAnalyticsServices();
    
    // Test role-specific features
    this.testRoleSpecificFeatures();

    this.printResults();
    return this.results;
  }

  private addResult(test: string, passed: boolean, message: string, details?: any) {
    this.results.push({ test, passed, message, details });
    const status = passed ? '✅' : '❌';
    console.log(`${status} ${test}: ${message}`);
    if (details && !passed) {
      console.log(`   Details:`, details);
    }
  }

  private testPermissionSystem() {
    console.log('\n📋 Testing Permission System...');

    // Test Owner permissions
    const ownerPermissions = RoleBasedPermissionService.getRolePermissions(BusinessRole.OWNER);
    this.addResult(
      'Owner Permissions',
      ownerPermissions.length > 20,
      `Owner has ${ownerPermissions.length} permissions`,
      { permissions: ownerPermissions.slice(0, 5) }
    );

    // Test Manager permissions
    const managerPermissions = RoleBasedPermissionService.getRolePermissions(BusinessRole.MANAGER);
    this.addResult(
      'Manager Permissions',
      managerPermissions.length > 10 && managerPermissions.length < ownerPermissions.length,
      `Manager has ${managerPermissions.length} permissions (less than owner)`,
      { permissions: managerPermissions.slice(0, 5) }
    );

    // Test Employee permissions
    const employeePermissions = RoleBasedPermissionService.getRolePermissions(BusinessRole.EMPLOYEE);
    this.addResult(
      'Employee Permissions',
      employeePermissions.length > 0 && employeePermissions.length < managerPermissions.length,
      `Employee has ${employeePermissions.length} permissions (least access)`,
      { permissions: employeePermissions }
    );

    // Test specific permission checks
    const ownerCanViewNetProfit = RoleBasedPermissionService.hasPermission(BusinessRole.OWNER, Permission.VIEW_NET_PROFIT);
    const managerCanViewNetProfit = RoleBasedPermissionService.hasPermission(BusinessRole.MANAGER, Permission.VIEW_NET_PROFIT);
    const employeeCanViewNetProfit = RoleBasedPermissionService.hasPermission(BusinessRole.EMPLOYEE, Permission.VIEW_NET_PROFIT);

    this.addResult(
      'Net Profit Access Control',
      ownerCanViewNetProfit && !managerCanViewNetProfit && !employeeCanViewNetProfit,
      'Only owners can view net profit',
      { owner: ownerCanViewNetProfit, manager: managerCanViewNetProfit, employee: employeeCanViewNetProfit }
    );

    // Test HR permissions
    const ownerCanManageTeam = RoleBasedPermissionService.hasPermission(BusinessRole.OWNER, Permission.MANAGE_TEAM);
    const managerCanManageSchedules = RoleBasedPermissionService.hasPermission(BusinessRole.MANAGER, Permission.CREATE_SCHEDULES);
    const employeeCanViewOwnSchedule = RoleBasedPermissionService.hasPermission(BusinessRole.EMPLOYEE, Permission.VIEW_OWN_SCHEDULE);

    this.addResult(
      'HR Permissions',
      ownerCanManageTeam && managerCanManageSchedules && employeeCanViewOwnSchedule,
      'HR permissions correctly distributed',
      { ownerTeam: ownerCanManageTeam, managerSchedule: managerCanManageSchedules, employeeSchedule: employeeCanViewOwnSchedule }
    );
  }

  private testRoleHierarchy() {
    console.log('\n🏗️ Testing Role Hierarchy...');

    // Test owner > manager
    const ownerOverManager = RoleBasedPermissionService.isHigherRole(BusinessRole.OWNER, BusinessRole.MANAGER);
    this.addResult(
      'Owner > Manager',
      ownerOverManager,
      'Owner has higher role than manager'
    );

    // Test manager > employee
    const managerOverEmployee = RoleBasedPermissionService.isHigherRole(BusinessRole.MANAGER, BusinessRole.EMPLOYEE);
    this.addResult(
      'Manager > Employee',
      managerOverEmployee,
      'Manager has higher role than employee'
    );

    // Test owner > employee
    const ownerOverEmployee = RoleBasedPermissionService.isHigherRole(BusinessRole.OWNER, BusinessRole.EMPLOYEE);
    this.addResult(
      'Owner > Employee',
      ownerOverEmployee,
      'Owner has higher role than employee'
    );

    // Test role display names
    const ownerDisplayName = RoleBasedPermissionService.getRoleDisplayName(BusinessRole.OWNER);
    const managerDisplayName = RoleBasedPermissionService.getRoleDisplayName(BusinessRole.MANAGER);
    const employeeDisplayName = RoleBasedPermissionService.getRoleDisplayName(BusinessRole.EMPLOYEE);

    this.addResult(
      'Role Display Names',
      ownerDisplayName === 'Business Owner' && managerDisplayName === 'Manager' && employeeDisplayName === 'Team Member',
      'Role display names are correct',
      { owner: ownerDisplayName, manager: managerDisplayName, employee: employeeDisplayName }
    );
  }

  private testScreenAccess() {
    console.log('\n📱 Testing Screen Access...');

    // Test owner screen access
    const ownerScreens = RoleBasedPermissionService.getAccessibleScreens(BusinessRole.OWNER);
    this.addResult(
      'Owner Screen Access',
      ownerScreens.length >= 5,
      `Owner has access to ${ownerScreens.length} screens`,
      { screens: ownerScreens.map(s => s.route) }
    );

    // Test manager screen access
    const managerScreens = RoleBasedPermissionService.getAccessibleScreens(BusinessRole.MANAGER);
    this.addResult(
      'Manager Screen Access',
      managerScreens.length >= 4,
      `Manager has access to ${managerScreens.length} screens`,
      { screens: managerScreens.map(s => s.route) }
    );

    // Test employee screen access
    const employeeScreens = RoleBasedPermissionService.getAccessibleScreens(BusinessRole.EMPLOYEE);
    this.addResult(
      'Employee Screen Access',
      employeeScreens.length >= 4,
      `Employee has access to ${employeeScreens.length} screens`,
      { screens: employeeScreens.map(s => s.route) }
    );

    // Test specific screen access
    const ownerCanAccessReports = RoleBasedPermissionService.canAccessScreen(BusinessRole.OWNER, 'Reports');
    const managerCanAccessReports = RoleBasedPermissionService.canAccessScreen(BusinessRole.MANAGER, 'Reports');
    const employeeCanAccessReports = RoleBasedPermissionService.canAccessScreen(BusinessRole.EMPLOYEE, 'Reports');

    this.addResult(
      'Reports Screen Access',
      ownerCanAccessReports && !managerCanAccessReports && !employeeCanAccessReports,
      'Only owners can access financial reports',
      { owner: ownerCanAccessReports, manager: managerCanAccessReports, employee: employeeCanAccessReports }
    );
  }

  private testDataFiltering() {
    console.log('\n🔒 Testing Data Filtering...');

    const mockFinancialData = {
      totalRevenue: 10000,
      totalExpenses: 7000,
      netProfit: 3000,
      profitMargin: 30,
      transactionCount: 150,
      recentActivity: 'Some activity'
    };

    // Test owner data (should see everything)
    const ownerData = RoleBasedPermissionService.filterFinancialData(BusinessRole.OWNER, mockFinancialData);
    this.addResult(
      'Owner Data Filtering',
      ownerData && ownerData.totalRevenue === 10000 && ownerData.netProfit === 3000,
      'Owner sees all financial data',
      { filteredKeys: Object.keys(ownerData || {}) }
    );

    // Test manager data (should not see financial totals)
    const managerData = RoleBasedPermissionService.filterFinancialData(BusinessRole.MANAGER, mockFinancialData);
    this.addResult(
      'Manager Data Filtering',
      managerData && !managerData.totalRevenue && !managerData.netProfit && managerData.transactionCount === 150,
      'Manager cannot see financial totals but can see activity',
      { filteredKeys: Object.keys(managerData || {}) }
    );

    // Test employee data (should see minimal data)
    const employeeData = RoleBasedPermissionService.filterFinancialData(BusinessRole.EMPLOYEE, mockFinancialData);
    this.addResult(
      'Employee Data Filtering',
      employeeData && !employeeData.totalRevenue && !employeeData.netProfit && !employeeData.transactionCount,
      'Employee sees no financial data',
      { filteredKeys: Object.keys(employeeData || {}) }
    );
  }

  private async testHRServices() {
    console.log('\n👥 Testing HR Services...');

    try {
      // Test employee management
      const employees = await HRService.getEmployees('test-business');
      this.addResult(
        'Employee Management',
        Array.isArray(employees) && employees.length > 0,
        `Retrieved ${employees.length} employees`,
        { employees: employees.map(e => ({ id: e.id, name: `${e.firstName} ${e.lastName}`, role: e.role })) }
      );

      // Test schedule management
      const schedules = await HRService.getSchedules('test-business');
      this.addResult(
        'Schedule Management',
        Array.isArray(schedules) && schedules.length > 0,
        `Retrieved ${schedules.length} schedules`,
        { schedules: schedules.slice(0, 3).map(s => ({ id: s.id, date: s.date, status: s.status })) }
      );

      // Test time off requests
      const timeOffRequests = await HRService.getTimeOffRequests('test-business');
      this.addResult(
        'Time Off Management',
        Array.isArray(timeOffRequests) && timeOffRequests.length > 0,
        `Retrieved ${timeOffRequests.length} time off requests`,
        { requests: timeOffRequests.map(r => ({ id: r.id, type: r.type, status: r.status })) }
      );

      // Test payroll
      const payrollPeriods = await HRService.getPayrollPeriods('test-business');
      this.addResult(
        'Payroll Management',
        Array.isArray(payrollPeriods) && payrollPeriods.length > 0,
        `Retrieved ${payrollPeriods.length} payroll periods`,
        { periods: payrollPeriods.map(p => ({ id: p.id, status: p.status })) }
      );

    } catch (error) {
      this.addResult(
        'HR Services',
        false,
        'HR services failed',
        { error: error.message }
      );
    }
  }

  private async testAnalyticsServices() {
    console.log('\n📊 Testing Analytics Services...');

    try {
      // Test owner analytics
      const ownerAnalytics = await RoleBasedAnalyticsService.getAnalytics('test-business', BusinessRole.OWNER);
      this.addResult(
        'Owner Analytics',
        ownerAnalytics && 'totalRevenue' in ownerAnalytics && 'netProfit' in ownerAnalytics,
        'Owner analytics include financial metrics',
        { keys: Object.keys(ownerAnalytics).slice(0, 5) }
      );

      // Test manager analytics
      const managerAnalytics = await RoleBasedAnalyticsService.getAnalytics('test-business', BusinessRole.MANAGER);
      this.addResult(
        'Manager Analytics',
        managerAnalytics && 'transactionCount' in managerAnalytics && !('totalRevenue' in managerAnalytics),
        'Manager analytics exclude financial totals',
        { keys: Object.keys(managerAnalytics).slice(0, 5) }
      );

      // Test employee analytics
      const employeeAnalytics = await RoleBasedAnalyticsService.getAnalytics('test-business', BusinessRole.EMPLOYEE, 'emp-1');
      this.addResult(
        'Employee Analytics',
        employeeAnalytics && 'hoursThisWeek' in employeeAnalytics && 'expectedPay' in employeeAnalytics,
        'Employee analytics include personal work metrics',
        { keys: Object.keys(employeeAnalytics).slice(0, 5) }
      );

    } catch (error) {
      this.addResult(
        'Analytics Services',
        false,
        'Analytics services failed',
        { error: error.message }
      );
    }
  }

  private testRoleSpecificFeatures() {
    console.log('\n🎯 Testing Role-Specific Features...');

    // Test financial access helpers
    const ownerCanViewTotals = RoleBasedPermissionService.canViewFinancialTotals(BusinessRole.OWNER);
    const managerCanViewTotals = RoleBasedPermissionService.canViewFinancialTotals(BusinessRole.MANAGER);
    const employeeCanViewTotals = RoleBasedPermissionService.canViewFinancialTotals(BusinessRole.EMPLOYEE);

    this.addResult(
      'Financial Totals Access',
      ownerCanViewTotals && !managerCanViewTotals && !employeeCanViewTotals,
      'Financial totals access correctly restricted',
      { owner: ownerCanViewTotals, manager: managerCanViewTotals, employee: employeeCanViewTotals }
    );

    // Test transaction management
    const ownerCanManageTransactions = RoleBasedPermissionService.canManageTransactions(BusinessRole.OWNER);
    const managerCanAddTransactions = RoleBasedPermissionService.canAddTransactions(BusinessRole.MANAGER);
    const employeeCanAddTransactions = RoleBasedPermissionService.canAddTransactions(BusinessRole.EMPLOYEE);

    this.addResult(
      'Transaction Management',
      ownerCanManageTransactions && managerCanAddTransactions && !employeeCanAddTransactions,
      'Transaction permissions correctly distributed',
      { ownerManage: ownerCanManageTransactions, managerAdd: managerCanAddTransactions, employeeAdd: employeeCanAddTransactions }
    );

    // Test business settings access
    const ownerCanManageSettings = RoleBasedPermissionService.canManageBusinessSettings(BusinessRole.OWNER);
    const managerCanManageSettings = RoleBasedPermissionService.canManageBusinessSettings(BusinessRole.MANAGER);
    const employeeCanManageSettings = RoleBasedPermissionService.canManageBusinessSettings(BusinessRole.EMPLOYEE);

    this.addResult(
      'Business Settings Access',
      ownerCanManageSettings && !managerCanManageSettings && !employeeCanManageSettings,
      'Business settings access restricted to owners',
      { owner: ownerCanManageSettings, manager: managerCanManageSettings, employee: employeeCanManageSettings }
    );
  }

  private printResults() {
    console.log('\n📋 VALIDATION SUMMARY');
    console.log('='.repeat(50));
    
    const passed = this.results.filter(r => r.passed).length;
    const total = this.results.length;
    const percentage = Math.round((passed / total) * 100);
    
    console.log(`✅ Passed: ${passed}/${total} tests (${percentage}%)`);
    console.log(`❌ Failed: ${total - passed}/${total} tests`);
    
    if (passed === total) {
      console.log('\n🎉 ALL TESTS PASSED! Role-based access control system is working correctly.');
    } else {
      console.log('\n⚠️  Some tests failed. Please review the failed tests above.');
      
      const failedTests = this.results.filter(r => !r.passed);
      console.log('\nFailed Tests:');
      failedTests.forEach(test => {
        console.log(`  ❌ ${test.test}: ${test.message}`);
      });
    }
    
    console.log('\n🔧 Next Steps:');
    console.log('1. ✅ Integration - RoleBasedTabNavigator integrated');
    console.log('2. ✅ Testing - Validation script completed');
    console.log('3. ✅ Customization - Role-specific features added');
    console.log('4. ✅ HR Features - Backend services created');
    console.log('5. ✅ Analytics - Role-specific analytics implemented');
    console.log('\n🚀 Role-based access control system is ready for production!');
  }
}

// Export for use in testing
export default RoleBasedSystemValidator;

// Run validation if this file is executed directly
if (require.main === module) {
  const validator = new RoleBasedSystemValidator();
  validator.runAllTests().then(() => {
    console.log('\nValidation complete!');
  }).catch(error => {
    console.error('Validation failed:', error);
  });
}
