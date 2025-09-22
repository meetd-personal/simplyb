import SupabaseHRService from '../SupabaseHRService';
import { supabase } from '../../config/supabase';

// Mock Supabase
jest.mock('../../config/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(),
          order: jest.fn(() => ({
            gte: jest.fn(() => ({
              lte: jest.fn(),
            })),
          })),
        })),
        gte: jest.fn(() => ({
          lte: jest.fn(),
        })),
        order: jest.fn(),
      })),
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn(),
        })),
      })),
      update: jest.fn(() => ({
        eq: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn(),
          })),
        })),
      })),
    })),
  },
}));

describe('SupabaseHRService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getEmployees', () => {
    it('should fetch employees for a business', async () => {
      const mockEmployees = [
        {
          id: 'emp-1',
          user_id: 'user-1',
          role: 'EMPLOYEE',
          hourly_rate: 15.00,
          start_date: '2024-01-15',
          is_active: true,
          joined_at: '2024-01-15T00:00:00Z',
          users: {
            id: 'user-1',
            email: 'john@example.com',
            first_name: 'John',
            last_name: 'Doe',
          },
        },
      ];

      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            data: mockEmployees,
            error: null,
          }),
        }),
      });

      (supabase.from as jest.Mock).mockReturnValue({
        select: mockSelect,
      });

      const result = await SupabaseHRService.getEmployees('business-1');

      expect(supabase.from).toHaveBeenCalledWith('business_members');
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: 'emp-1',
        businessId: 'business-1',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        role: 'EMPLOYEE',
        hourlyRate: 15.00,
      });
    });

    it('should handle errors when fetching employees', async () => {
      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            data: null,
            error: new Error('Database error'),
          }),
        }),
      });

      (supabase.from as jest.Mock).mockReturnValue({
        select: mockSelect,
      });

      await expect(SupabaseHRService.getEmployees('business-1')).rejects.toThrow('Database error');
    });
  });

  describe('createSchedule', () => {
    it('should create a new schedule', async () => {
      const mockSchedule = {
        id: 'schedule-1',
        business_id: 'business-1',
        employee_id: 'emp-1',
        date: '2024-03-15',
        start_time: '09:00',
        end_time: '17:00',
        break_duration: 30,
        notes: 'Regular shift',
        status: 'scheduled',
        created_by: 'manager-1',
        created_at: '2024-03-15T00:00:00Z',
        updated_at: '2024-03-15T00:00:00Z',
      };

      const mockInsert = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: mockSchedule,
            error: null,
          }),
        }),
      });

      (supabase.from as jest.Mock).mockReturnValue({
        insert: mockInsert,
      });

      const scheduleData = {
        businessId: 'business-1',
        employeeId: 'emp-1',
        date: new Date('2024-03-15'),
        startTime: '09:00',
        endTime: '17:00',
        breakDuration: 30,
        notes: 'Regular shift',
        status: 'scheduled' as const,
        createdBy: 'manager-1',
      };

      const result = await SupabaseHRService.createSchedule(scheduleData);

      expect(supabase.from).toHaveBeenCalledWith('employee_schedules');
      expect(mockInsert).toHaveBeenCalledWith({
        business_id: 'business-1',
        employee_id: 'emp-1',
        date: '2024-03-15',
        start_time: '09:00',
        end_time: '17:00',
        break_duration: 30,
        notes: 'Regular shift',
        status: 'scheduled',
        created_by: 'manager-1',
      });
      expect(result).toMatchObject({
        id: 'schedule-1',
        businessId: 'business-1',
        employeeId: 'emp-1',
        startTime: '09:00',
        endTime: '17:00',
        status: 'scheduled',
      });
    });
  });

  describe('createTimeOffRequest', () => {
    it('should create a new time off request', async () => {
      const mockRequest = {
        id: 'request-1',
        business_id: 'business-1',
        employee_id: 'emp-1',
        type: 'vacation',
        start_date: '2024-03-15',
        end_date: '2024-03-17',
        reason: 'Family vacation',
        status: 'pending',
        approved_by: null,
        approved_at: null,
        created_at: '2024-03-15T00:00:00Z',
        updated_at: '2024-03-15T00:00:00Z',
      };

      const mockInsert = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: mockRequest,
            error: null,
          }),
        }),
      });

      (supabase.from as jest.Mock).mockReturnValue({
        insert: mockInsert,
      });

      const requestData = {
        businessId: 'business-1',
        employeeId: 'emp-1',
        type: 'vacation' as const,
        startDate: new Date('2024-03-15'),
        endDate: new Date('2024-03-17'),
        reason: 'Family vacation',
      };

      const result = await SupabaseHRService.createTimeOffRequest(requestData);

      expect(supabase.from).toHaveBeenCalledWith('time_off_requests');
      expect(result).toMatchObject({
        id: 'request-1',
        businessId: 'business-1',
        employeeId: 'emp-1',
        type: 'vacation',
        reason: 'Family vacation',
        status: 'pending',
      });
    });
  });

  describe('clockIn', () => {
    it('should create a new work session when clocking in', async () => {
      const mockSession = {
        id: 'session-1',
        business_id: 'business-1',
        employee_id: 'emp-1',
        schedule_id: null,
        clock_in_time: '2024-03-15T09:00:00Z',
        clock_out_time: null,
        break_duration: 0,
        total_hours: 0,
        notes: null,
        created_at: '2024-03-15T09:00:00Z',
        updated_at: '2024-03-15T09:00:00Z',
      };

      const mockInsert = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: mockSession,
            error: null,
          }),
        }),
      });

      (supabase.from as jest.Mock).mockReturnValue({
        insert: mockInsert,
      });

      const result = await SupabaseHRService.clockIn('business-1', 'emp-1');

      expect(supabase.from).toHaveBeenCalledWith('work_sessions');
      expect(result).toMatchObject({
        id: 'session-1',
        businessId: 'business-1',
        employeeId: 'emp-1',
        totalHours: 0,
      });
      expect(result.clockInTime).toBeInstanceOf(Date);
    });
  });
});
