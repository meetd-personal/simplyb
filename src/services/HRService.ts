// HR Service for managing employee schedules, payroll, and time-off requests

export interface Employee {
  id: string;
  businessId: string;
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  role: 'OWNER' | 'MANAGER' | 'EMPLOYEE';
  hourlyRate: number;
  startDate: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Schedule {
  id: string;
  businessId: string;
  employeeId: string;
  date: Date;
  startTime: string; // HH:MM format
  endTime: string; // HH:MM format
  breakDuration: number; // minutes
  notes?: string;
  status: 'scheduled' | 'completed' | 'missed' | 'cancelled';
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TimeOffRequest {
  id: string;
  businessId: string;
  employeeId: string;
  type: 'vacation' | 'sick' | 'personal';
  startDate: Date;
  endDate: Date;
  reason: string;
  status: 'pending' | 'approved' | 'denied';
  approvedBy?: string;
  approvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface PayrollPeriod {
  id: string;
  businessId: string;
  startDate: Date;
  endDate: Date;
  status: 'current' | 'completed' | 'upcoming';
  createdAt: Date;
  updatedAt: Date;
}

export interface PayrollEntry {
  id: string;
  businessId: string;
  employeeId: string;
  payrollPeriodId: string;
  regularHours: number;
  overtimeHours: number;
  hourlyRate: number;
  overtimeRate: number;
  grossPay: number;
  deductions: number;
  netPay: number;
  status: 'draft' | 'approved' | 'paid';
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkSession {
  id: string;
  businessId: string;
  employeeId: string;
  scheduleId?: string;
  clockInTime: Date;
  clockOutTime?: Date;
  breakDuration: number; // minutes
  totalHours: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

class HRService {
  // Employee Management
  async getEmployees(businessId: string): Promise<Employee[]> {
    // Mock data for now
    return [
      {
        id: 'emp-1',
        businessId,
        userId: 'user-1',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        role: 'EMPLOYEE',
        hourlyRate: 15.00,
        startDate: new Date('2024-01-15'),
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'emp-2',
        businessId,
        userId: 'user-2',
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane@example.com',
        role: 'MANAGER',
        hourlyRate: 22.00,
        startDate: new Date('2023-11-01'),
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];
  }

  async getEmployee(employeeId: string): Promise<Employee | null> {
    const employees = await this.getEmployees('mock-business');
    return employees.find(emp => emp.id === employeeId) || null;
  }

  async updateEmployeeHourlyRate(employeeId: string, hourlyRate: number): Promise<void> {
    console.log(`Updating employee ${employeeId} hourly rate to $${hourlyRate}`);
    // In real implementation, this would update the database
  }

  // Schedule Management
  async getSchedules(businessId: string, startDate?: Date, endDate?: Date): Promise<Schedule[]> {
    // Mock data for current week
    const today = new Date();
    const schedules: Schedule[] = [];
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      
      schedules.push({
        id: `schedule-${i}`,
        businessId,
        employeeId: 'emp-1',
        date,
        startTime: i % 2 === 0 ? '09:00' : '14:00',
        endTime: i % 2 === 0 ? '17:00' : '22:00',
        breakDuration: 30,
        status: i < 2 ? 'completed' : 'scheduled',
        createdBy: 'manager-1',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
    
    return schedules;
  }

  async getEmployeeSchedules(businessId: string, employeeId: string, startDate?: Date, endDate?: Date): Promise<Schedule[]> {
    const allSchedules = await this.getSchedules(businessId, startDate, endDate);
    return allSchedules.filter(schedule => schedule.employeeId === employeeId);
  }

  async createSchedule(schedule: Omit<Schedule, 'id' | 'createdAt' | 'updatedAt'>): Promise<Schedule> {
    const newSchedule: Schedule = {
      ...schedule,
      id: `schedule-${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    console.log('Creating schedule:', newSchedule);
    return newSchedule;
  }

  async updateSchedule(scheduleId: string, updates: Partial<Schedule>): Promise<Schedule> {
    console.log(`Updating schedule ${scheduleId}:`, updates);
    // Mock updated schedule
    return {
      id: scheduleId,
      businessId: 'mock-business',
      employeeId: 'emp-1',
      date: new Date(),
      startTime: '09:00',
      endTime: '17:00',
      breakDuration: 30,
      status: 'scheduled',
      createdBy: 'manager-1',
      createdAt: new Date(),
      updatedAt: new Date(),
      ...updates,
    };
  }

  // Time Off Management
  async getTimeOffRequests(businessId: string, employeeId?: string): Promise<TimeOffRequest[]> {
    // Mock data
    return [
      {
        id: 'timeoff-1',
        businessId,
        employeeId: employeeId || 'emp-1',
        type: 'vacation',
        startDate: new Date('2024-03-15'),
        endDate: new Date('2024-03-17'),
        reason: 'Family vacation',
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'timeoff-2',
        businessId,
        employeeId: employeeId || 'emp-1',
        type: 'sick',
        startDate: new Date('2024-03-08'),
        endDate: new Date('2024-03-08'),
        reason: 'Doctor appointment',
        status: 'approved',
        approvedBy: 'manager-1',
        approvedAt: new Date('2024-03-07'),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];
  }

  async createTimeOffRequest(request: Omit<TimeOffRequest, 'id' | 'status' | 'createdAt' | 'updatedAt'>): Promise<TimeOffRequest> {
    const newRequest: TimeOffRequest = {
      ...request,
      id: `timeoff-${Date.now()}`,
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    console.log('Creating time off request:', newRequest);
    return newRequest;
  }

  async approveTimeOffRequest(requestId: string, approverId: string): Promise<TimeOffRequest> {
    console.log(`Approving time off request ${requestId} by ${approverId}`);
    // Mock approved request
    return {
      id: requestId,
      businessId: 'mock-business',
      employeeId: 'emp-1',
      type: 'vacation',
      startDate: new Date(),
      endDate: new Date(),
      reason: 'Approved request',
      status: 'approved',
      approvedBy: approverId,
      approvedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  async denyTimeOffRequest(requestId: string, approverId: string): Promise<TimeOffRequest> {
    console.log(`Denying time off request ${requestId} by ${approverId}`);
    // Mock denied request
    return {
      id: requestId,
      businessId: 'mock-business',
      employeeId: 'emp-1',
      type: 'vacation',
      startDate: new Date(),
      endDate: new Date(),
      reason: 'Denied request',
      status: 'denied',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  // Payroll Management
  async getPayrollPeriods(businessId: string): Promise<PayrollPeriod[]> {
    // Mock data for bi-weekly pay periods
    const periods: PayrollPeriod[] = [];
    const today = new Date();
    
    for (let i = -2; i <= 1; i++) {
      const startDate = new Date(today);
      startDate.setDate(today.getDate() + (i * 14));
      
      const endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 13);
      
      periods.push({
        id: `period-${i}`,
        businessId,
        startDate,
        endDate,
        status: i < 0 ? 'completed' : i === 0 ? 'current' : 'upcoming',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
    
    return periods;
  }

  async getPayrollEntries(businessId: string, payrollPeriodId?: string, employeeId?: string): Promise<PayrollEntry[]> {
    // Mock payroll data
    return [
      {
        id: 'payroll-1',
        businessId,
        employeeId: employeeId || 'emp-1',
        payrollPeriodId: payrollPeriodId || 'period-0',
        regularHours: 67.5,
        overtimeHours: 2.5,
        hourlyRate: 15.00,
        overtimeRate: 22.50,
        grossPay: 1050.00,
        deductions: 237.50,
        netPay: 812.50,
        status: 'approved',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];
  }

  // Time Tracking
  async clockIn(businessId: string, employeeId: string, scheduleId?: string): Promise<WorkSession> {
    const session: WorkSession = {
      id: `session-${Date.now()}`,
      businessId,
      employeeId,
      scheduleId,
      clockInTime: new Date(),
      breakDuration: 0,
      totalHours: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    console.log('Clocking in:', session);
    return session;
  }

  async clockOut(sessionId: string): Promise<WorkSession> {
    const clockOutTime = new Date();
    console.log(`Clocking out session ${sessionId} at ${clockOutTime}`);
    
    // Mock updated session
    return {
      id: sessionId,
      businessId: 'mock-business',
      employeeId: 'emp-1',
      clockInTime: new Date(Date.now() - 8 * 60 * 60 * 1000), // 8 hours ago
      clockOutTime,
      breakDuration: 30,
      totalHours: 7.5,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  async getWorkSessions(businessId: string, employeeId: string, startDate?: Date, endDate?: Date): Promise<WorkSession[]> {
    // Mock work sessions
    return [
      {
        id: 'session-1',
        businessId,
        employeeId,
        clockInTime: new Date(Date.now() - 24 * 60 * 60 * 1000), // Yesterday
        clockOutTime: new Date(Date.now() - 16 * 60 * 60 * 1000), // 8 hours later
        breakDuration: 30,
        totalHours: 7.5,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];
  }
}

export default new HRService();
