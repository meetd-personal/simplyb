# Role-Based Access Control System

## Overview
This document outlines the comprehensive role-based access control (RBAC) system implemented for the restaurant business app. The system provides different levels of access and functionality based on user roles within a business.

## User Roles

### 1. Owner (Business Owner)
**Full Access** - Complete control over all business operations and data.

**Permissions:**
- ✅ View all financial data (revenue, expenses, net profit, profit margins)
- ✅ Add, edit, and delete transactions
- ✅ View comprehensive financial reports and analytics
- ✅ Manage team members (hire, fire, role assignments)
- ✅ Manage business settings and integrations
- ✅ Switch between multiple businesses
- ✅ Access all HR features (schedules, payroll, time-off approval)
- ✅ View and manage all employee data

**Dashboard Features:**
- Complete financial overview with totals and trends
- Net profit and profit margin calculations
- Monthly growth analytics
- Quick access to all management functions

### 2. Manager
**Limited Financial Access** - Can manage operations but with restricted financial visibility.

**Permissions:**
- ✅ View recent transactions (without amounts/totals)
- ✅ Add revenue and expense transactions
- ✅ Create and edit employee schedules
- ✅ Approve time-off requests
- ✅ Set hourly pay rates for employees
- ✅ View payroll data for all employees
- ✅ Manage basic settings
- ❌ View financial totals, net profit, or profit margins
- ❌ Delete transactions or access financial reports
- ❌ Manage team hiring/firing
- ❌ Switch businesses or manage integrations

**Dashboard Features:**
- Transaction count and activity metrics
- Recent transaction list (amounts hidden)
- HR management quick actions
- Schedule and payroll management access

### 3. Team Member (Employee)
**HR-Focused Access** - Personal work-related information only.

**Permissions:**
- ✅ View own schedule and shifts
- ✅ Request time off
- ✅ View own worked hours and pay information
- ✅ Clock in/out (when implemented)
- ✅ Manage personal profile settings
- ❌ No access to any financial data
- ❌ Cannot view other employees' information
- ❌ Cannot modify business settings

**Dashboard Features:**
- Personal work hours and pay summary
- Upcoming shifts and schedule
- Time-off request status
- Personal pay period information

## Technical Implementation

### Permission System
```typescript
// Core permission types
enum Permission {
  VIEW_FINANCIAL_OVERVIEW = 'view_financial_overview',
  VIEW_NET_PROFIT = 'view_net_profit',
  ADD_REVENUE = 'add_revenue',
  MANAGE_TEAM = 'manage_team',
  VIEW_OWN_SCHEDULE = 'view_own_schedule',
  // ... more permissions
}

// Role-permission mapping
const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  [UserRole.OWNER]: [/* all permissions */],
  [UserRole.MANAGER]: [/* limited permissions */],
  [UserRole.EMPLOYEE]: [/* minimal permissions */]
};
```

### Screen Access Control
Each role has access to different screens and navigation tabs:

**Owner Navigation:**
- Dashboard (OwnerDashboard)
- Revenue (full access)
- Expenses (full access)
- Reports (financial analytics)
- Settings (business management)

**Manager Navigation:**
- Dashboard (ManagerDashboard)
- Transactions (add only, amounts hidden)
- Schedules (employee management)
- Payroll (employee pay management)
- Settings (limited)

**Employee Navigation:**
- Dashboard (EmployeeDashboard)
- My Schedule (personal schedule)
- Time Off (request management)
- My Pay (personal payroll)
- Profile (personal settings)

### Data Filtering
Financial data is automatically filtered based on role permissions:

```typescript
// Example: Filter financial data for managers
const filteredData = RoleBasedPermissionService.filterFinancialData(userRole, data);
// Removes totalRevenue, totalExpenses, netProfit for non-owners
```

## Security Features

### 1. Permission Guards
Components are wrapped with permission guards to prevent unauthorized access:

```typescript
<PermissionGuard 
  permission={Permission.VIEW_NET_PROFIT} 
  userRole={userRole}
  fallback={<Text>Access Denied</Text>}
>
  <NetProfitComponent />
</PermissionGuard>
```

### 2. Role-Based Components
Different components render based on user role:

```typescript
<RoleBasedComponent
  userRole={userRole}
  ownerComponent={<OwnerDashboard />}
  managerComponent={<ManagerDashboard />}
  employeeComponent={<EmployeeDashboard />}
/>
```

### 3. Navigation Protection
Navigation tabs are dynamically generated based on role permissions, preventing access to unauthorized screens.

## Screen Descriptions

### Owner Screens
1. **OwnerDashboard** - Complete business overview with financial metrics
2. **RevenueScreen** - Full revenue management with totals
3. **ExpensesScreen** - Complete expense tracking with totals
4. **StatisticsScreen** - Comprehensive financial reports
5. **SettingsScreen** - Business and team management

### Manager Screens
1. **ManagerDashboard** - Activity overview without financial totals
2. **ManagerTransactionsScreen** - Transaction management (amounts hidden)
3. **ScheduleManagementScreen** - Employee schedule creation/editing
4. **PayrollManagementScreen** - Employee pay rate and hours management
5. **SettingsScreen** - Limited settings access

### Employee Screens
1. **EmployeeDashboard** - Personal work summary and upcoming shifts
2. **MyScheduleScreen** - Personal schedule and shift management
3. **TimeOffRequestScreen** - Time-off request submission and tracking
4. **MyPayrollScreen** - Personal pay and hours information
5. **EmployeeProfileScreen** - Personal profile and settings

## Data Access Patterns

### Financial Data Access
- **Owner**: Full access to all financial metrics and calculations
- **Manager**: Can see transaction activity but not amounts or totals
- **Employee**: No access to any financial information

### HR Data Access
- **Owner**: Full access to all employee data and HR functions
- **Manager**: Can manage schedules and payroll for all employees
- **Employee**: Access only to personal HR information

### Settings Access
- **Owner**: Complete business settings and integrations
- **Manager**: Limited operational settings
- **Employee**: Personal profile settings only

## Implementation Benefits

1. **Security**: Sensitive financial data is protected from unauthorized access
2. **Usability**: Each role sees only relevant functionality
3. **Scalability**: Easy to add new roles or modify permissions
4. **Maintainability**: Centralized permission management
5. **Compliance**: Supports business compliance requirements

## Future Enhancements

1. **Granular Permissions**: More specific permission controls
2. **Time-Based Access**: Temporary permission grants
3. **Audit Logging**: Track permission usage and access attempts
4. **Custom Roles**: Business-specific role creation
5. **Multi-Business Roles**: Different roles across multiple businesses

## Usage Examples

### Checking Permissions
```typescript
// Check if user can view financial totals
const canViewTotals = RoleBasedPermissionService.canViewFinancialTotals(userRole);

// Check specific permission
const canManageTeam = RoleBasedPermissionService.hasPermission(userRole, Permission.MANAGE_TEAM);
```

### Conditional Rendering
```typescript
// Show different content based on role
{RoleBasedPermissionService.canViewNetProfit(userRole) && (
  <NetProfitCard profit={netProfit} />
)}
```

### Navigation Setup
```typescript
// Get role-specific navigation tabs
const navigationTabs = RoleBasedPermissionService.getNavigationTabs(userRole);
```

This role-based access control system ensures that each user type has appropriate access to functionality while maintaining security and usability across the restaurant business management app.
