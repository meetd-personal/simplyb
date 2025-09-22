// Supabase-based HR Service for managing employee schedules, payroll, and time-off requests
import { supabase } from '../config/supabase';
import { 
  Employee, 
  Schedule, 
  TimeOffRequest, 
  PayrollPeriod, 
  PayrollEntry, 
  WorkSession 
} from './HRService';

class SupabaseHRService {
  // Employee Management
  async getEmployees(businessId: string): Promise<Employee[]> {
    try {
      const { data, error } = await supabase
        .from('business_members')
        .select(`
          id,
          user_id,
          role,
          hourly_rate,
          start_date,
          is_active,
          joined_at,
          users!inner(
            id,
            email,
            first_name,
            last_name
          )
        `)
        .eq('business_id', businessId)
        .eq('is_active', true);

      if (error) throw error;

      return data.map(member => ({
        id: member.id,
        businessId,
        userId: member.user_id,
        firstName: member.users.first_name,
        lastName: member.users.last_name,
        email: member.users.email,
        role: member.role as 'OWNER' | 'MANAGER' | 'EMPLOYEE',
        hourlyRate: member.hourly_rate || 0,
        startDate: new Date(member.start_date || member.joined_at),
        isActive: member.is_active,
        createdAt: new Date(member.joined_at),
        updatedAt: new Date(member.joined_at),
      }));
    } catch (error) {
      console.error('Error fetching employees:', error);
      throw error;
    }
  }

  async getEmployee(employeeId: string): Promise<Employee | null> {
    try {
      const { data, error } = await supabase
        .from('business_members')
        .select(`
          id,
          business_id,
          user_id,
          role,
          hourly_rate,
          start_date,
          is_active,
          joined_at,
          users!inner(
            id,
            email,
            first_name,
            last_name
          )
        `)
        .eq('id', employeeId)
        .eq('is_active', true)
        .single();

      if (error) throw error;
      if (!data) return null;

      return {
        id: data.id,
        businessId: data.business_id,
        userId: data.user_id,
        firstName: data.users.first_name,
        lastName: data.users.last_name,
        email: data.users.email,
        role: data.role as 'OWNER' | 'MANAGER' | 'EMPLOYEE',
        hourlyRate: data.hourly_rate || 0,
        startDate: new Date(data.start_date || data.joined_at),
        isActive: data.is_active,
        createdAt: new Date(data.joined_at),
        updatedAt: new Date(data.joined_at),
      };
    } catch (error) {
      console.error('Error fetching employee:', error);
      return null;
    }
  }

  async updateEmployeeHourlyRate(employeeId: string, hourlyRate: number): Promise<void> {
    try {
      const { error } = await supabase
        .from('business_members')
        .update({ 
          hourly_rate: hourlyRate,
          overtime_rate: hourlyRate * 1.5 // Standard overtime rate
        })
        .eq('id', employeeId);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating employee hourly rate:', error);
      throw error;
    }
  }

  // Schedule Management
  async getSchedules(businessId: string, startDate?: Date, endDate?: Date): Promise<Schedule[]> {
    try {
      let query = supabase
        .from('employee_schedules')
        .select(`
          id,
          business_id,
          employee_id,
          date,
          start_time,
          end_time,
          break_duration,
          notes,
          status,
          created_by,
          created_at,
          updated_at
        `)
        .eq('business_id', businessId)
        .order('date', { ascending: true });

      if (startDate) {
        query = query.gte('date', startDate.toISOString().split('T')[0]);
      }
      if (endDate) {
        query = query.lte('date', endDate.toISOString().split('T')[0]);
      }

      const { data, error } = await query;

      if (error) throw error;

      return data.map(schedule => ({
        id: schedule.id,
        businessId: schedule.business_id,
        employeeId: schedule.employee_id,
        date: new Date(schedule.date),
        startTime: schedule.start_time,
        endTime: schedule.end_time,
        breakDuration: schedule.break_duration,
        notes: schedule.notes,
        status: schedule.status as 'scheduled' | 'completed' | 'missed' | 'cancelled',
        createdBy: schedule.created_by,
        createdAt: new Date(schedule.created_at),
        updatedAt: new Date(schedule.updated_at),
      }));
    } catch (error) {
      console.error('Error fetching schedules:', error);
      throw error;
    }
  }

  async getEmployeeSchedules(businessId: string, employeeId: string, startDate?: Date, endDate?: Date): Promise<Schedule[]> {
    try {
      let query = supabase
        .from('employee_schedules')
        .select('*')
        .eq('business_id', businessId)
        .eq('employee_id', employeeId)
        .order('date', { ascending: true });

      if (startDate) {
        query = query.gte('date', startDate.toISOString().split('T')[0]);
      }
      if (endDate) {
        query = query.lte('date', endDate.toISOString().split('T')[0]);
      }

      const { data, error } = await query;

      if (error) throw error;

      return data.map(schedule => ({
        id: schedule.id,
        businessId: schedule.business_id,
        employeeId: schedule.employee_id,
        date: new Date(schedule.date),
        startTime: schedule.start_time,
        endTime: schedule.end_time,
        breakDuration: schedule.break_duration,
        notes: schedule.notes,
        status: schedule.status as 'scheduled' | 'completed' | 'missed' | 'cancelled',
        createdBy: schedule.created_by,
        createdAt: new Date(schedule.created_at),
        updatedAt: new Date(schedule.updated_at),
      }));
    } catch (error) {
      console.error('Error fetching employee schedules:', error);
      throw error;
    }
  }

  async createSchedule(schedule: Omit<Schedule, 'id' | 'createdAt' | 'updatedAt'>): Promise<Schedule> {
    try {
      const { data, error } = await supabase
        .from('employee_schedules')
        .insert({
          business_id: schedule.businessId,
          employee_id: schedule.employeeId,
          date: schedule.date.toISOString().split('T')[0],
          start_time: schedule.startTime,
          end_time: schedule.endTime,
          break_duration: schedule.breakDuration,
          notes: schedule.notes,
          status: schedule.status,
          created_by: schedule.createdBy,
        })
        .select()
        .single();

      if (error) throw error;

      return {
        id: data.id,
        businessId: data.business_id,
        employeeId: data.employee_id,
        date: new Date(data.date),
        startTime: data.start_time,
        endTime: data.end_time,
        breakDuration: data.break_duration,
        notes: data.notes,
        status: data.status as 'scheduled' | 'completed' | 'missed' | 'cancelled',
        createdBy: data.created_by,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
      };
    } catch (error) {
      console.error('Error creating schedule:', error);
      throw error;
    }
  }

  async updateSchedule(scheduleId: string, updates: Partial<Schedule>): Promise<Schedule> {
    try {
      const updateData: any = {};
      
      if (updates.date) updateData.date = updates.date.toISOString().split('T')[0];
      if (updates.startTime) updateData.start_time = updates.startTime;
      if (updates.endTime) updateData.end_time = updates.endTime;
      if (updates.breakDuration !== undefined) updateData.break_duration = updates.breakDuration;
      if (updates.notes !== undefined) updateData.notes = updates.notes;
      if (updates.status) updateData.status = updates.status;

      const { data, error } = await supabase
        .from('employee_schedules')
        .update(updateData)
        .eq('id', scheduleId)
        .select()
        .single();

      if (error) throw error;

      return {
        id: data.id,
        businessId: data.business_id,
        employeeId: data.employee_id,
        date: new Date(data.date),
        startTime: data.start_time,
        endTime: data.end_time,
        breakDuration: data.break_duration,
        notes: data.notes,
        status: data.status as 'scheduled' | 'completed' | 'missed' | 'cancelled',
        createdBy: data.created_by,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
      };
    } catch (error) {
      console.error('Error updating schedule:', error);
      throw error;
    }
  }

  // Time Off Management
  async getTimeOffRequests(businessId: string, employeeId?: string): Promise<TimeOffRequest[]> {
    try {
      let query = supabase
        .from('time_off_requests')
        .select('*')
        .eq('business_id', businessId)
        .order('created_at', { ascending: false });

      if (employeeId) {
        query = query.eq('employee_id', employeeId);
      }

      const { data, error } = await query;

      if (error) throw error;

      return data.map(request => ({
        id: request.id,
        businessId: request.business_id,
        employeeId: request.employee_id,
        type: request.type as 'vacation' | 'sick' | 'personal',
        startDate: new Date(request.start_date),
        endDate: new Date(request.end_date),
        reason: request.reason,
        status: request.status as 'pending' | 'approved' | 'denied',
        approvedBy: request.approved_by,
        approvedAt: request.approved_at ? new Date(request.approved_at) : undefined,
        createdAt: new Date(request.created_at),
        updatedAt: new Date(request.updated_at),
      }));
    } catch (error) {
      console.error('Error fetching time off requests:', error);
      throw error;
    }
  }

  async createTimeOffRequest(request: Omit<TimeOffRequest, 'id' | 'status' | 'createdAt' | 'updatedAt'>): Promise<TimeOffRequest> {
    try {
      const { data, error } = await supabase
        .from('time_off_requests')
        .insert({
          business_id: request.businessId,
          employee_id: request.employeeId,
          type: request.type,
          start_date: request.startDate.toISOString().split('T')[0],
          end_date: request.endDate.toISOString().split('T')[0],
          reason: request.reason,
          status: 'pending',
        })
        .select()
        .single();

      if (error) throw error;

      return {
        id: data.id,
        businessId: data.business_id,
        employeeId: data.employee_id,
        type: data.type as 'vacation' | 'sick' | 'personal',
        startDate: new Date(data.start_date),
        endDate: new Date(data.end_date),
        reason: data.reason,
        status: data.status as 'pending' | 'approved' | 'denied',
        approvedBy: data.approved_by,
        approvedAt: data.approved_at ? new Date(data.approved_at) : undefined,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
      };
    } catch (error) {
      console.error('Error creating time off request:', error);
      throw error;
    }
  }

  async approveTimeOffRequest(requestId: string, approverId: string): Promise<TimeOffRequest> {
    try {
      const { data, error } = await supabase
        .from('time_off_requests')
        .update({
          status: 'approved',
          approved_by: approverId,
          approved_at: new Date().toISOString(),
        })
        .eq('id', requestId)
        .select()
        .single();

      if (error) throw error;

      return {
        id: data.id,
        businessId: data.business_id,
        employeeId: data.employee_id,
        type: data.type as 'vacation' | 'sick' | 'personal',
        startDate: new Date(data.start_date),
        endDate: new Date(data.end_date),
        reason: data.reason,
        status: data.status as 'pending' | 'approved' | 'denied',
        approvedBy: data.approved_by,
        approvedAt: data.approved_at ? new Date(data.approved_at) : undefined,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
      };
    } catch (error) {
      console.error('Error approving time off request:', error);
      throw error;
    }
  }

  async denyTimeOffRequest(requestId: string, approverId: string): Promise<TimeOffRequest> {
    try {
      const { data, error } = await supabase
        .from('time_off_requests')
        .update({
          status: 'denied',
          approved_by: approverId,
          approved_at: new Date().toISOString(),
        })
        .eq('id', requestId)
        .select()
        .single();

      if (error) throw error;

      return {
        id: data.id,
        businessId: data.business_id,
        employeeId: data.employee_id,
        type: data.type as 'vacation' | 'sick' | 'personal',
        startDate: new Date(data.start_date),
        endDate: new Date(data.end_date),
        reason: data.reason,
        status: data.status as 'pending' | 'approved' | 'denied',
        approvedBy: data.approved_by,
        approvedAt: data.approved_at ? new Date(data.approved_at) : undefined,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
      };
    } catch (error) {
      console.error('Error denying time off request:', error);
      throw error;
    }
  }

  // Payroll Management
  async getPayrollPeriods(businessId: string): Promise<PayrollPeriod[]> {
    try {
      const { data, error } = await supabase
        .from('payroll_periods')
        .select('*')
        .eq('business_id', businessId)
        .order('start_date', { ascending: false });

      if (error) throw error;

      return data.map(period => ({
        id: period.id,
        businessId: period.business_id,
        startDate: new Date(period.start_date),
        endDate: new Date(period.end_date),
        status: period.status as 'current' | 'completed' | 'upcoming',
        createdAt: new Date(period.created_at),
        updatedAt: new Date(period.updated_at),
      }));
    } catch (error) {
      console.error('Error fetching payroll periods:', error);
      throw error;
    }
  }

  async getPayrollEntries(businessId: string, payrollPeriodId?: string, employeeId?: string): Promise<PayrollEntry[]> {
    try {
      let query = supabase
        .from('payroll_entries')
        .select('*')
        .eq('business_id', businessId);

      if (payrollPeriodId) {
        query = query.eq('payroll_period_id', payrollPeriodId);
      }
      if (employeeId) {
        query = query.eq('employee_id', employeeId);
      }

      const { data, error } = await query;

      if (error) throw error;

      return data.map(entry => ({
        id: entry.id,
        businessId: entry.business_id,
        employeeId: entry.employee_id,
        payrollPeriodId: entry.payroll_period_id,
        regularHours: entry.regular_hours,
        overtimeHours: entry.overtime_hours,
        hourlyRate: entry.hourly_rate,
        overtimeRate: entry.overtime_rate,
        grossPay: entry.gross_pay,
        deductions: entry.deductions,
        netPay: entry.net_pay,
        status: entry.status as 'draft' | 'approved' | 'paid',
        createdAt: new Date(entry.created_at),
        updatedAt: new Date(entry.updated_at),
      }));
    } catch (error) {
      console.error('Error fetching payroll entries:', error);
      throw error;
    }
  }

  // Time Tracking
  async clockIn(businessId: string, employeeId: string, scheduleId?: string): Promise<WorkSession> {
    try {
      const { data, error } = await supabase
        .from('work_sessions')
        .insert({
          business_id: businessId,
          employee_id: employeeId,
          schedule_id: scheduleId,
          clock_in_time: new Date().toISOString(),
          break_duration: 0,
          total_hours: 0,
        })
        .select()
        .single();

      if (error) throw error;

      return {
        id: data.id,
        businessId: data.business_id,
        employeeId: data.employee_id,
        scheduleId: data.schedule_id,
        clockInTime: new Date(data.clock_in_time),
        clockOutTime: data.clock_out_time ? new Date(data.clock_out_time) : undefined,
        breakDuration: data.break_duration,
        totalHours: data.total_hours,
        notes: data.notes,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
      };
    } catch (error) {
      console.error('Error clocking in:', error);
      throw error;
    }
  }

  async clockOut(sessionId: string): Promise<WorkSession> {
    try {
      const clockOutTime = new Date();

      // First get the session to calculate total hours
      const { data: session, error: fetchError } = await supabase
        .from('work_sessions')
        .select('*')
        .eq('id', sessionId)
        .single();

      if (fetchError) throw fetchError;

      const clockInTime = new Date(session.clock_in_time);
      const totalMilliseconds = clockOutTime.getTime() - clockInTime.getTime();
      const totalHours = (totalMilliseconds / (1000 * 60 * 60)) - (session.break_duration / 60);

      const { data, error } = await supabase
        .from('work_sessions')
        .update({
          clock_out_time: clockOutTime.toISOString(),
          total_hours: Math.max(0, totalHours),
        })
        .eq('id', sessionId)
        .select()
        .single();

      if (error) throw error;

      return {
        id: data.id,
        businessId: data.business_id,
        employeeId: data.employee_id,
        scheduleId: data.schedule_id,
        clockInTime: new Date(data.clock_in_time),
        clockOutTime: new Date(data.clock_out_time),
        breakDuration: data.break_duration,
        totalHours: data.total_hours,
        notes: data.notes,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
      };
    } catch (error) {
      console.error('Error clocking out:', error);
      throw error;
    }
  }

  async getWorkSessions(businessId: string, employeeId: string, startDate?: Date, endDate?: Date): Promise<WorkSession[]> {
    try {
      let query = supabase
        .from('work_sessions')
        .select('*')
        .eq('business_id', businessId)
        .eq('employee_id', employeeId)
        .order('clock_in_time', { ascending: false });

      if (startDate) {
        query = query.gte('clock_in_time', startDate.toISOString());
      }
      if (endDate) {
        query = query.lte('clock_in_time', endDate.toISOString());
      }

      const { data, error } = await query;

      if (error) throw error;

      return data.map(session => ({
        id: session.id,
        businessId: session.business_id,
        employeeId: session.employee_id,
        scheduleId: session.schedule_id,
        clockInTime: new Date(session.clock_in_time),
        clockOutTime: session.clock_out_time ? new Date(session.clock_out_time) : undefined,
        breakDuration: session.break_duration,
        totalHours: session.total_hours,
        notes: session.notes,
        createdAt: new Date(session.created_at),
        updatedAt: new Date(session.updated_at),
      }));
    } catch (error) {
      console.error('Error fetching work sessions:', error);
      throw error;
    }
  }
}

export default new SupabaseHRService();
