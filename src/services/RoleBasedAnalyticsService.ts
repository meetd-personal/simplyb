import { BusinessRole } from '../types/database';
import RoleBasedPermissionService from './RoleBasedPermissionService';
import TransactionService from './TransactionServiceFactory';
import HRService from './HRService';

export interface OwnerAnalytics {
  // Financial metrics
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  profitMargin: number;
  monthlyGrowth: number;
  
  // Business metrics
  transactionCount: number;
  averageTransactionValue: number;
  topCategories: Array<{ category: string; amount: number; percentage: number }>;
  
  // HR metrics
  totalEmployees: number;
  totalPayrollCost: number;
  averageHourlyRate: number;
  
  // Trends
  revenueByMonth: Array<{ month: string; revenue: number; expenses: number; profit: number }>;
  categoryTrends: Array<{ category: string; trend: 'up' | 'down' | 'stable'; change: number }>;
}

export interface ManagerAnalytics {
  // Activity metrics (no financial totals)
  transactionCount: number;
  recentActivityCount: number;
  todayActivityCount: number;
  
  // HR metrics
  teamSize: number;
  scheduledHoursThisWeek: number;
  pendingTimeOffRequests: number;
  
  // Operational metrics
  averageTransactionsPerDay: number;
  busyHours: Array<{ hour: number; count: number }>;
  categoryDistribution: Array<{ category: string; count: number; percentage: number }>;
}

export interface EmployeeAnalytics {
  // Personal work metrics
  hoursThisWeek: number;
  hoursThisPayPeriod: number;
  expectedPay: number;
  
  // Schedule metrics
  upcomingShifts: number;
  completedShifts: number;
  missedShifts: number;
  
  // Time off metrics
  pendingTimeOffRequests: number;
  approvedTimeOffDays: number;
  remainingVacationDays: number;
  
  // Performance metrics
  punctualityScore: number; // Percentage of on-time clock-ins
  averageHoursPerWeek: number;
  overtimeHours: number;
}

class RoleBasedAnalyticsService {
  /**
   * Get analytics data based on user role
   */
  async getAnalytics(
    businessId: string, 
    userRole: BusinessRole, 
    employeeId?: string
  ): Promise<OwnerAnalytics | ManagerAnalytics | EmployeeAnalytics> {
    switch (userRole) {
      case BusinessRole.OWNER:
        return this.getOwnerAnalytics(businessId);
      case BusinessRole.MANAGER:
        return this.getManagerAnalytics(businessId);
      case BusinessRole.EMPLOYEE:
      case BusinessRole.ACCOUNTANT:
        return this.getEmployeeAnalytics(businessId, employeeId || '');
      default:
        throw new Error(`Unsupported role: ${userRole}`);
    }
  }

  /**
   * Owner Analytics - Complete business overview
   */
  private async getOwnerAnalytics(businessId: string): Promise<OwnerAnalytics> {
    try {
      // Get transaction data
      const transactions = await TransactionService.getTransactions(businessId);
      const employees = await HRService.getEmployees(businessId);
      
      // Calculate financial metrics
      const revenue = transactions
        .filter(t => t.type === 'revenue')
        .reduce((sum, t) => sum + t.amount, 0);
      
      const expenses = transactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);
      
      const netProfit = revenue - expenses;
      const profitMargin = revenue > 0 ? (netProfit / revenue) * 100 : 0;
      
      // Calculate monthly growth
      const currentMonth = new Date().getMonth();
      const currentMonthRevenue = transactions
        .filter(t => t.type === 'revenue' && new Date(t.date).getMonth() === currentMonth)
        .reduce((sum, t) => sum + t.amount, 0);
      
      const lastMonthRevenue = transactions
        .filter(t => t.type === 'revenue' && new Date(t.date).getMonth() === currentMonth - 1)
        .reduce((sum, t) => sum + t.amount, 0);
      
      const monthlyGrowth = lastMonthRevenue > 0 
        ? ((currentMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 
        : 0;
      
      // Calculate category analytics
      const categoryTotals = new Map<string, number>();
      transactions.forEach(t => {
        const current = categoryTotals.get(t.category) || 0;
        categoryTotals.set(t.category, current + t.amount);
      });
      
      const topCategories = Array.from(categoryTotals.entries())
        .map(([category, amount]) => ({
          category,
          amount,
          percentage: (amount / (revenue + expenses)) * 100
        }))
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 5);
      
      // HR metrics
      const totalPayrollCost = employees.reduce((sum, emp) => sum + (emp.hourlyRate * 40 * 4), 0); // Estimate monthly
      const averageHourlyRate = employees.length > 0 
        ? employees.reduce((sum, emp) => sum + emp.hourlyRate, 0) / employees.length 
        : 0;
      
      // Generate monthly trends (mock data for now)
      const revenueByMonth = this.generateMonthlyTrends(transactions);
      const categoryTrends = this.generateCategoryTrends(transactions);
      
      return {
        totalRevenue: revenue,
        totalExpenses: expenses,
        netProfit,
        profitMargin,
        monthlyGrowth,
        transactionCount: transactions.length,
        averageTransactionValue: transactions.length > 0 ? (revenue + expenses) / transactions.length : 0,
        topCategories,
        totalEmployees: employees.length,
        totalPayrollCost,
        averageHourlyRate,
        revenueByMonth,
        categoryTrends,
      };
    } catch (error) {
      console.error('Error generating owner analytics:', error);
      throw error;
    }
  }

  /**
   * Manager Analytics - Operational metrics without financial totals
   */
  private async getManagerAnalytics(businessId: string): Promise<ManagerAnalytics> {
    try {
      const transactions = await TransactionService.getTransactions(businessId);
      const employees = await HRService.getEmployees(businessId);
      const timeOffRequests = await HRService.getTimeOffRequests(businessId);
      
      // Activity metrics (no amounts)
      const today = new Date();
      const todayTransactions = transactions.filter(t => 
        new Date(t.date).toDateString() === today.toDateString()
      );
      
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const recentTransactions = transactions.filter(t => 
        new Date(t.date) >= weekAgo
      );
      
      // Category distribution (by count, not amount)
      const categoryCount = new Map<string, number>();
      transactions.forEach(t => {
        const current = categoryCount.get(t.category) || 0;
        categoryCount.set(t.category, current + 1);
      });
      
      const categoryDistribution = Array.from(categoryCount.entries())
        .map(([category, count]) => ({
          category,
          count,
          percentage: (count / transactions.length) * 100
        }))
        .sort((a, b) => b.count - a.count);
      
      // Busy hours analysis
      const hourlyActivity = new Map<number, number>();
      transactions.forEach(t => {
        const hour = new Date(t.date).getHours();
        const current = hourlyActivity.get(hour) || 0;
        hourlyActivity.set(hour, current + 1);
      });
      
      const busyHours = Array.from(hourlyActivity.entries())
        .map(([hour, count]) => ({ hour, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);
      
      // HR metrics
      const pendingTimeOff = timeOffRequests.filter(req => req.status === 'pending').length;
      const scheduledHours = 40 * employees.length; // Mock calculation
      
      return {
        transactionCount: transactions.length,
        recentActivityCount: recentTransactions.length,
        todayActivityCount: todayTransactions.length,
        teamSize: employees.length,
        scheduledHoursThisWeek: scheduledHours,
        pendingTimeOffRequests: pendingTimeOff,
        averageTransactionsPerDay: transactions.length / 30, // Last 30 days average
        busyHours,
        categoryDistribution,
      };
    } catch (error) {
      console.error('Error generating manager analytics:', error);
      throw error;
    }
  }

  /**
   * Employee Analytics - Personal work metrics only
   */
  private async getEmployeeAnalytics(businessId: string, employeeId: string): Promise<EmployeeAnalytics> {
    try {
      const employee = await HRService.getEmployee(employeeId);
      const schedules = await HRService.getEmployeeSchedules(businessId, employeeId);
      const timeOffRequests = await HRService.getTimeOffRequests(businessId, employeeId);
      const workSessions = await HRService.getWorkSessions(businessId, employeeId);
      
      if (!employee) {
        throw new Error('Employee not found');
      }
      
      // Calculate hours this week
      const today = new Date();
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - today.getDay());
      
      const thisWeekSchedules = schedules.filter(s => 
        new Date(s.date) >= weekStart && new Date(s.date) <= today
      );
      
      const hoursThisWeek = thisWeekSchedules.reduce((total, schedule) => {
        const start = new Date(`2000-01-01T${schedule.startTime}`);
        const end = new Date(`2000-01-01T${schedule.endTime}`);
        const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
        return total + Math.max(0, hours - (schedule.breakDuration / 60));
      }, 0);
      
      // Calculate pay period hours (bi-weekly)
      const payPeriodStart = new Date(today);
      payPeriodStart.setDate(today.getDate() - 14);
      
      const payPeriodSchedules = schedules.filter(s => 
        new Date(s.date) >= payPeriodStart && new Date(s.date) <= today
      );
      
      const hoursThisPayPeriod = payPeriodSchedules.reduce((total, schedule) => {
        const start = new Date(`2000-01-01T${schedule.startTime}`);
        const end = new Date(`2000-01-01T${schedule.endTime}`);
        const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
        return total + Math.max(0, hours - (schedule.breakDuration / 60));
      }, 0);
      
      // Calculate expected pay
      const regularHours = Math.min(hoursThisPayPeriod, 80); // Max 40 hours/week
      const overtimeHours = Math.max(0, hoursThisPayPeriod - 80);
      const expectedPay = (regularHours * employee.hourlyRate) + (overtimeHours * employee.hourlyRate * 1.5);
      
      // Schedule metrics
      const upcomingShifts = schedules.filter(s => 
        new Date(s.date) > today && s.status === 'scheduled'
      ).length;
      
      const completedShifts = schedules.filter(s => s.status === 'completed').length;
      const missedShifts = schedules.filter(s => s.status === 'missed').length;
      
      // Time off metrics
      const pendingTimeOff = timeOffRequests.filter(req => req.status === 'pending').length;
      const approvedTimeOff = timeOffRequests.filter(req => req.status === 'approved').length;
      
      // Performance metrics
      const onTimeClockIns = workSessions.filter(session => {
        // Mock calculation - in real app, compare with scheduled start time
        return true; // Assume 90% punctuality
      }).length;
      
      const punctualityScore = workSessions.length > 0 
        ? (onTimeClockIns / workSessions.length) * 100 
        : 90;
      
      return {
        hoursThisWeek,
        hoursThisPayPeriod,
        expectedPay,
        upcomingShifts,
        completedShifts,
        missedShifts,
        pendingTimeOffRequests: pendingTimeOff,
        approvedTimeOffDays: approvedTimeOff,
        remainingVacationDays: 15 - approvedTimeOff, // Mock calculation
        punctualityScore,
        averageHoursPerWeek: hoursThisPayPeriod / 2, // Bi-weekly average
        overtimeHours,
      };
    } catch (error) {
      console.error('Error generating employee analytics:', error);
      throw error;
    }
  }

  /**
   * Generate monthly revenue trends
   */
  private generateMonthlyTrends(transactions: any[]): OwnerAnalytics['revenueByMonth'] {
    const monthlyData = new Map<string, { revenue: number; expenses: number }>();
    
    transactions.forEach(t => {
      const month = new Date(t.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
      const current = monthlyData.get(month) || { revenue: 0, expenses: 0 };
      
      if (t.type === 'revenue') {
        current.revenue += t.amount;
      } else {
        current.expenses += t.amount;
      }
      
      monthlyData.set(month, current);
    });
    
    return Array.from(monthlyData.entries()).map(([month, data]) => ({
      month,
      revenue: data.revenue,
      expenses: data.expenses,
      profit: data.revenue - data.expenses,
    }));
  }

  /**
   * Generate category trends
   */
  private generateCategoryTrends(transactions: any[]): OwnerAnalytics['categoryTrends'] {
    // Mock trend calculation - in real app, compare with previous period
    const categories = [...new Set(transactions.map(t => t.category))];
    
    return categories.map(category => ({
      category,
      trend: Math.random() > 0.5 ? 'up' : Math.random() > 0.5 ? 'down' : 'stable',
      change: (Math.random() - 0.5) * 20, // Random change between -10% and +10%
    }));
  }

  /**
   * Filter analytics data based on role permissions
   */
  filterAnalyticsForRole(data: any, userRole: BusinessRole): any {
    return RoleBasedPermissionService.filterFinancialData(userRole, data);
  }
}

export default new RoleBasedAnalyticsService();
