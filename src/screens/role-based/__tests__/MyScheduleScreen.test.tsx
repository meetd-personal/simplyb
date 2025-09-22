import React from 'react';
import { render, fireEvent, waitFor, screen } from '@testing-library/react-native';
import { Alert } from 'react-native';
import MyScheduleScreen from '../MyScheduleScreen';
import { useAuth } from '../../../contexts/AuthContext';
import HRServiceFactory from '../../../services/HRServiceFactory';

// Mock dependencies
jest.mock('../../../contexts/AuthContext');
jest.mock('../../../services/HRServiceFactory');
jest.spyOn(Alert, 'alert');

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockHRService = HRServiceFactory as jest.Mocked<typeof HRServiceFactory>;

describe('MyScheduleScreen', () => {
  const mockAuthState = {
    user: { id: 'user-1', firstName: 'John', lastName: 'Doe' },
    currentBusiness: { id: 'business-1', name: 'Test Business' },
    currentBusinessMember: { id: 'member-1', hourlyRate: 15, startDate: new Date('2024-01-01') },
  };

  const mockSchedules = [
    {
      id: 'schedule-1',
      employeeId: 'member-1',
      businessId: 'business-1',
      date: new Date('2024-03-15'),
      startTime: '09:00',
      endTime: '17:00',
      status: 'scheduled',
      createdAt: new Date('2024-03-01'),
      updatedAt: new Date('2024-03-01'),
    },
    {
      id: 'schedule-2',
      employeeId: 'member-1',
      businessId: 'business-1',
      date: new Date('2024-03-16'),
      startTime: '10:00',
      endTime: '18:00',
      status: 'scheduled',
      createdAt: new Date('2024-03-01'),
      updatedAt: new Date('2024-03-01'),
    },
  ];

  const mockWorkSessions = [
    {
      id: 'session-1',
      employeeId: 'member-1',
      businessId: 'business-1',
      scheduleId: 'schedule-1',
      clockInTime: new Date('2024-03-14T09:00:00'),
      clockOutTime: new Date('2024-03-14T17:00:00'),
      totalHours: 8,
      breakDuration: 30,
      createdAt: new Date('2024-03-14'),
      updatedAt: new Date('2024-03-14'),
    },
  ];

  const mockActiveSession = {
    id: 'session-2',
    employeeId: 'member-1',
    businessId: 'business-1',
    scheduleId: null,
    clockInTime: new Date(),
    clockOutTime: null,
    totalHours: 0,
    breakDuration: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuth.mockReturnValue({ state: mockAuthState } as any);
    mockHRService.getEmployeeSchedules.mockResolvedValue(mockSchedules);
    mockHRService.getWorkSessions.mockResolvedValue(mockWorkSessions);
  });

  it('renders correctly and loads data', async () => {
    render(<MyScheduleScreen />);

    // Should show loading initially
    expect(screen.getByText('Loading schedule...')).toBeTruthy();

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('My Schedule')).toBeTruthy();
    });

    // Should display schedule information
    expect(screen.getByText('This Week')).toBeTruthy();
    expect(screen.getByText('Upcoming Shifts')).toBeTruthy();
    expect(screen.getByText('Recent Shifts')).toBeTruthy();
  });

  it('displays clock in button when not clocked in', async () => {
    render(<MyScheduleScreen />);

    await waitFor(() => {
      expect(screen.getByText('Clock In')).toBeTruthy();
    });
  });

  it('displays clock out button when clocked in', async () => {
    mockHRService.getWorkSessions.mockResolvedValue([...mockWorkSessions, mockActiveSession]);

    render(<MyScheduleScreen />);

    await waitFor(() => {
      expect(screen.getByText('Clock Out')).toBeTruthy();
      expect(screen.getByText('Currently Clocked In')).toBeTruthy();
    });
  });

  it('handles clock in successfully', async () => {
    mockHRService.clockIn.mockResolvedValue(mockActiveSession);

    render(<MyScheduleScreen />);

    await waitFor(() => {
      expect(screen.getByText('Clock In')).toBeTruthy();
    });

    const clockInButton = screen.getByText('Clock In');
    fireEvent.press(clockInButton);

    await waitFor(() => {
      expect(mockHRService.clockIn).toHaveBeenCalledWith('business-1', 'member-1');
      expect(Alert.alert).toHaveBeenCalledWith('Success', 'Clocked in successfully!');
    });
  });

  it('handles clock out successfully', async () => {
    mockHRService.getWorkSessions.mockResolvedValue([...mockWorkSessions, mockActiveSession]);
    mockHRService.clockOut.mockResolvedValue();

    render(<MyScheduleScreen />);

    await waitFor(() => {
      expect(screen.getByText('Clock Out')).toBeTruthy();
    });

    const clockOutButton = screen.getByText('Clock Out');
    fireEvent.press(clockOutButton);

    await waitFor(() => {
      expect(mockHRService.clockOut).toHaveBeenCalledWith(mockActiveSession.id);
      expect(Alert.alert).toHaveBeenCalledWith('Success', 'Clocked out successfully!');
    });
  });

  it('handles clock in error', async () => {
    mockHRService.clockIn.mockRejectedValue(new Error('Clock in failed'));

    render(<MyScheduleScreen />);

    await waitFor(() => {
      expect(screen.getByText('Clock In')).toBeTruthy();
    });

    const clockInButton = screen.getByText('Clock In');
    fireEvent.press(clockInButton);

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Error', 'Failed to clock in. Please try again.');
    });
  });

  it('handles clock out error', async () => {
    mockHRService.getWorkSessions.mockResolvedValue([...mockWorkSessions, mockActiveSession]);
    mockHRService.clockOut.mockRejectedValue(new Error('Clock out failed'));

    render(<MyScheduleScreen />);

    await waitFor(() => {
      expect(screen.getByText('Clock Out')).toBeTruthy();
    });

    const clockOutButton = screen.getByText('Clock Out');
    fireEvent.press(clockOutButton);

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Error', 'Failed to clock out. Please try again.');
    });
  });

  it('calculates weekly hours correctly', async () => {
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    
    const thisWeekSchedules = [
      {
        ...mockSchedules[0],
        date: new Date(weekStart.getTime() + 86400000), // Tomorrow
      },
    ];

    const thisWeekSessions = [
      {
        ...mockWorkSessions[0],
        clockInTime: new Date(weekStart.getTime() + 86400000),
        clockOutTime: new Date(weekStart.getTime() + 86400000 + 8 * 60 * 60 * 1000),
        totalHours: 8,
      },
    ];

    mockHRService.getEmployeeSchedules.mockResolvedValue(thisWeekSchedules);
    mockHRService.getWorkSessions.mockResolvedValue(thisWeekSessions);

    render(<MyScheduleScreen />);

    await waitFor(() => {
      expect(screen.getByText('8.0')).toBeTruthy(); // Worked hours
    });
  });

  it('displays upcoming shifts correctly', async () => {
    const futureSchedule = {
      ...mockSchedules[0],
      date: new Date(Date.now() + 86400000), // Tomorrow
    };

    mockHRService.getEmployeeSchedules.mockResolvedValue([futureSchedule]);

    render(<MyScheduleScreen />);

    await waitFor(() => {
      expect(screen.getByText('Tomorrow')).toBeTruthy();
      expect(screen.getByText('09:00 - 17:00')).toBeTruthy();
    });
  });

  it('displays recent shifts correctly', async () => {
    const pastSchedule = {
      ...mockSchedules[0],
      date: new Date(Date.now() - 86400000), // Yesterday
    };

    mockHRService.getEmployeeSchedules.mockResolvedValue([pastSchedule]);

    render(<MyScheduleScreen />);

    await waitFor(() => {
      expect(screen.getByText('Recent Shifts')).toBeTruthy();
    });
  });

  it('shows empty state when no upcoming shifts', async () => {
    mockHRService.getEmployeeSchedules.mockResolvedValue([]);

    render(<MyScheduleScreen />);

    await waitFor(() => {
      expect(screen.getByText('No upcoming shifts')).toBeTruthy();
      expect(screen.getByText('Your upcoming shifts will appear here')).toBeTruthy();
    });
  });

  it('shows empty state when no recent shifts', async () => {
    mockHRService.getEmployeeSchedules.mockResolvedValue([]);

    render(<MyScheduleScreen />);

    await waitFor(() => {
      expect(screen.getByText('No recent shifts')).toBeTruthy();
      expect(screen.getByText('Your completed shifts will appear here')).toBeTruthy();
    });
  });

  it('handles data loading error', async () => {
    mockHRService.getEmployeeSchedules.mockRejectedValue(new Error('Network error'));

    render(<MyScheduleScreen />);

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Error', 'Failed to load schedule data');
    });
  });

  it('displays active session duration correctly', async () => {
    const recentActiveSession = {
      ...mockActiveSession,
      clockInTime: new Date(Date.now() - 60 * 60 * 1000), // 1 hour ago
    };

    mockHRService.getWorkSessions.mockResolvedValue([...mockWorkSessions, recentActiveSession]);

    render(<MyScheduleScreen />);

    await waitFor(() => {
      expect(screen.getByText('Currently Clocked In')).toBeTruthy();
      expect(screen.getByText(/Duration: \d+ minutes/)).toBeTruthy();
    });
  });

  it('handles time off request navigation', async () => {
    render(<MyScheduleScreen />);

    await waitFor(() => {
      expect(screen.getByText('Request Time Off')).toBeTruthy();
    });

    const timeOffButton = screen.getByText('Request Time Off');
    fireEvent.press(timeOffButton);

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Navigation', 'Navigate to Time Off Request screen');
    });
  });

  it('disables clock buttons when processing', async () => {
    mockHRService.clockIn.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 1000)));

    render(<MyScheduleScreen />);

    await waitFor(() => {
      expect(screen.getByText('Clock In')).toBeTruthy();
    });

    const clockInButton = screen.getByText('Clock In');
    fireEvent.press(clockInButton);

    // Button should be disabled and show loading
    expect(clockInButton.props.disabled).toBeTruthy();
  });
});
