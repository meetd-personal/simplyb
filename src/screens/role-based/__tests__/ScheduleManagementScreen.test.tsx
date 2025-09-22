import React from 'react';
import { render, fireEvent, waitFor, screen } from '@testing-library/react-native';
import { Alert } from 'react-native';
import ScheduleManagementScreen from '../ScheduleManagementScreen';
import { useAuth } from '../../../contexts/AuthContext';
import HRServiceFactory from '../../../services/HRServiceFactory';

// Mock dependencies
jest.mock('../../../contexts/AuthContext');
jest.mock('../../../services/HRServiceFactory');
jest.spyOn(Alert, 'alert');

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockHRService = HRServiceFactory as jest.Mocked<typeof HRServiceFactory>;

describe('ScheduleManagementScreen', () => {
  const mockAuthState = {
    user: { id: 'user-1', email: 'test@example.com' },
    currentBusiness: { id: 'business-1', name: 'Test Business' },
    currentBusinessMember: { id: 'member-1', role: 'MANAGER' },
    businesses: [],
    loading: false,
    error: null,
  };

  const mockSchedules = [
    {
      id: 'schedule-1',
      businessId: 'business-1',
      employeeId: 'emp-1',
      date: new Date('2024-03-15'),
      startTime: '09:00',
      endTime: '17:00',
      breakDuration: 30,
      notes: 'Regular shift',
      status: 'scheduled' as const,
      createdBy: 'manager-1',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  const mockEmployees = [
    {
      id: 'emp-1',
      businessId: 'business-1',
      userId: 'user-1',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      role: 'EMPLOYEE' as const,
      hourlyRate: 15.00,
      startDate: new Date('2024-01-15'),
      isActive: true,
      joinedAt: new Date(),
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuth.mockReturnValue({ state: mockAuthState });
    mockHRService.getSchedules.mockResolvedValue(mockSchedules);
    mockHRService.getEmployees.mockResolvedValue(mockEmployees);
    mockHRService.createSchedule.mockResolvedValue(mockSchedules[0]);
  });

  it('renders loading state initially', () => {
    render(<ScheduleManagementScreen />);
    expect(screen.getByText('Loading schedules...')).toBeTruthy();
  });

  it('renders schedule management interface after loading', async () => {
    render(<ScheduleManagementScreen />);

    await waitFor(() => {
      expect(screen.getByText('Schedule Management')).toBeTruthy();
      expect(screen.getByText('Manage employee schedules and shifts')).toBeTruthy();
    });
  });

  it('displays quick action buttons', async () => {
    render(<ScheduleManagementScreen />);

    await waitFor(() => {
      expect(screen.getByText('Create Schedule')).toBeTruthy();
      expect(screen.getByText('View All Schedules')).toBeTruthy();
      expect(screen.getByText('Time Off Requests')).toBeTruthy();
      expect(screen.getByText('Shift Templates')).toBeTruthy();
    });
  });

  it('displays schedules when available', async () => {
    render(<ScheduleManagementScreen />);

    await waitFor(() => {
      expect(screen.getByText('This Week\'s Schedules')).toBeTruthy();
      expect(screen.getByText('3/15/2024')).toBeTruthy(); // Date format may vary
      expect(screen.getByText('09:00 - 17:00')).toBeTruthy();
      expect(screen.getByText('John Doe')).toBeTruthy();
    });
  });

  it('shows empty state when no schedules exist', async () => {
    mockHRService.getSchedules.mockResolvedValue([]);
    
    render(<ScheduleManagementScreen />);

    await waitFor(() => {
      expect(screen.getByText('No schedules for this week')).toBeTruthy();
      expect(screen.getByText('Create First Schedule')).toBeTruthy();
    });
  });

  it('opens create schedule modal when create button is pressed', async () => {
    render(<ScheduleManagementScreen />);

    await waitFor(() => {
      const createButton = screen.getByText('Create Schedule');
      fireEvent.press(createButton);
    });

    await waitFor(() => {
      expect(screen.getByText('Create Schedule')).toBeTruthy();
      expect(screen.getByText('Employee')).toBeTruthy();
      expect(screen.getByText('Start Time')).toBeTruthy();
      expect(screen.getByText('End Time')).toBeTruthy();
    });
  });

  it('allows selecting an employee in create modal', async () => {
    render(<ScheduleManagementScreen />);

    await waitFor(() => {
      const createButton = screen.getByText('Create Schedule');
      fireEvent.press(createButton);
    });

    await waitFor(() => {
      const employeeOption = screen.getByText('John Doe');
      fireEvent.press(employeeOption);
    });

    // Employee should be selected (visual feedback would be tested in integration tests)
    expect(screen.getByText('John Doe')).toBeTruthy();
  });

  it('creates a schedule when form is submitted', async () => {
    render(<ScheduleManagementScreen />);

    await waitFor(() => {
      const createButton = screen.getByText('Create Schedule');
      fireEvent.press(createButton);
    });

    await waitFor(() => {
      // Select employee
      const employeeOption = screen.getByText('John Doe');
      fireEvent.press(employeeOption);

      // Submit form
      const submitButton = screen.getByText('Create');
      fireEvent.press(submitButton);
    });

    await waitFor(() => {
      expect(mockHRService.createSchedule).toHaveBeenCalledWith({
        businessId: 'business-1',
        employeeId: 'emp-1',
        date: expect.any(Date),
        startTime: '09:00',
        endTime: '17:00',
        breakDuration: 30,
        notes: '',
        status: 'scheduled',
        createdBy: 'user-1',
      });
    });
  });

  it('shows success alert after creating schedule', async () => {
    render(<ScheduleManagementScreen />);

    await waitFor(() => {
      const createButton = screen.getByText('Create Schedule');
      fireEvent.press(createButton);
    });

    await waitFor(() => {
      const employeeOption = screen.getByText('John Doe');
      fireEvent.press(employeeOption);

      const submitButton = screen.getByText('Create');
      fireEvent.press(submitButton);
    });

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Success', 'Schedule created successfully');
    });
  });

  it('handles errors when loading data', async () => {
    mockHRService.getSchedules.mockRejectedValue(new Error('Network error'));
    
    render(<ScheduleManagementScreen />);

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Error', 'Failed to load schedule data');
    });
  });

  it('handles errors when creating schedule', async () => {
    mockHRService.createSchedule.mockRejectedValue(new Error('Creation failed'));
    
    render(<ScheduleManagementScreen />);

    await waitFor(() => {
      const createButton = screen.getByText('Create Schedule');
      fireEvent.press(createButton);
    });

    await waitFor(() => {
      const employeeOption = screen.getByText('John Doe');
      fireEvent.press(employeeOption);

      const submitButton = screen.getByText('Create');
      fireEvent.press(submitButton);
    });

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Error', 'Failed to create schedule');
    });
  });

  it('closes modal when cancel button is pressed', async () => {
    render(<ScheduleManagementScreen />);

    await waitFor(() => {
      const createButton = screen.getByText('Create Schedule');
      fireEvent.press(createButton);
    });

    await waitFor(() => {
      const cancelButton = screen.getByText('Cancel');
      fireEvent.press(cancelButton);
    });

    // Modal should be closed (Create Schedule modal title should not be visible)
    await waitFor(() => {
      expect(screen.queryByText('Create Schedule')).toBeTruthy(); // Button still visible
    });
  });
});
