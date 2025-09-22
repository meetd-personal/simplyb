import React from 'react';
import { render, fireEvent, waitFor, screen } from '@testing-library/react-native';
import { Alert } from 'react-native';
import PayrollManagementScreen from '../PayrollManagementScreen';
import { useAuth } from '../../../contexts/AuthContext';
import HRServiceFactory from '../../../services/HRServiceFactory';

// Mock dependencies
jest.mock('../../../contexts/AuthContext');
jest.mock('../../../services/HRServiceFactory');
jest.spyOn(Alert, 'alert');

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockHRService = HRServiceFactory as jest.Mocked<typeof HRServiceFactory>;

describe('PayrollManagementScreen', () => {
  const mockAuthState = {
    user: { id: 'user-1', firstName: 'John', lastName: 'Doe' },
    currentBusiness: { id: 'business-1', name: 'Test Business' },
    currentBusinessMember: { id: 'member-1' },
  };

  const mockEmployees = [
    {
      id: 'employee-1',
      firstName: 'Alice',
      lastName: 'Smith',
      email: 'alice@test.com',
      businessId: 'business-1',
      role: 'employee',
      hourlyRate: 15,
      startDate: new Date('2024-01-01'),
      overtimeRate: 22.5,
    },
    {
      id: 'employee-2',
      firstName: 'Bob',
      lastName: 'Johnson',
      email: 'bob@test.com',
      businessId: 'business-1',
      role: 'employee',
      hourlyRate: 18,
      startDate: new Date('2024-01-15'),
      overtimeRate: 27,
    },
  ];

  const mockPayrollPeriods = [
    {
      id: 'period-1',
      businessId: 'business-1',
      startDate: new Date('2024-03-01'),
      endDate: new Date('2024-03-15'),
      status: 'current',
      createdAt: new Date('2024-03-01'),
      updatedAt: new Date('2024-03-01'),
    },
    {
      id: 'period-2',
      businessId: 'business-1',
      startDate: new Date('2024-02-15'),
      endDate: new Date('2024-02-29'),
      status: 'completed',
      createdAt: new Date('2024-02-15'),
      updatedAt: new Date('2024-03-01'),
    },
  ];

  const mockPayrollEntries = [
    {
      id: 'entry-1',
      payrollPeriodId: 'period-1',
      employeeId: 'employee-1',
      regularHours: 80,
      overtimeHours: 5,
      grossPay: 1275,
      netPay: 987.5,
      status: 'draft',
      createdAt: new Date('2024-03-01'),
      updatedAt: new Date('2024-03-01'),
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuth.mockReturnValue({ state: mockAuthState } as any);
    mockHRService.getEmployees.mockResolvedValue(mockEmployees);
    mockHRService.getPayrollPeriods.mockResolvedValue(mockPayrollPeriods);
    mockHRService.getPayrollEntries.mockResolvedValue(mockPayrollEntries);
  });

  it('renders correctly and loads data', async () => {
    render(<PayrollManagementScreen />);

    // Should show loading initially
    expect(screen.getByText('Loading payroll data...')).toBeTruthy();

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('Payroll Management')).toBeTruthy();
    });

    // Should display current period information
    expect(screen.getByText('Current Pay Period')).toBeTruthy();
  });

  it('displays current payroll period correctly', async () => {
    render(<PayrollManagementScreen />);

    await waitFor(() => {
      expect(screen.getByText('Current Pay Period')).toBeTruthy();
      expect(screen.getByText(/3\/1\/2024 - 3\/15\/2024/)).toBeTruthy();
    });
  });

  it('displays payroll entries for current period', async () => {
    render(<PayrollManagementScreen />);

    await waitFor(() => {
      expect(screen.getByText('Alice Smith')).toBeTruthy();
      expect(screen.getByText('$987.50')).toBeTruthy(); // Net pay
    });
  });

  it('handles creating new payroll period', async () => {
    mockHRService.createPayrollPeriod.mockResolvedValue(mockPayrollPeriods[0]);

    render(<PayrollManagementScreen />);

    await waitFor(() => {
      expect(screen.getByText('Payroll Management')).toBeTruthy();
    });

    // Find and press create period button
    const createButton = screen.getByText('Create New Period');
    fireEvent.press(createButton);

    await waitFor(() => {
      expect(mockHRService.createPayrollPeriod).toHaveBeenCalled();
    });
  });

  it('handles setting hourly rates', async () => {
    mockHRService.updateEmployee.mockResolvedValue();

    render(<PayrollManagementScreen />);

    await waitFor(() => {
      expect(screen.getByText('Set Hourly Rates')).toBeTruthy();
    });

    // Open hourly rate modal
    const setRatesButton = screen.getByText('Set Hourly Rates');
    fireEvent.press(setRatesButton);

    await waitFor(() => {
      expect(screen.getByText('Set Employee Hourly Rates')).toBeTruthy();
    });

    // Select employee
    const employeeOption = screen.getByText('Alice Smith');
    fireEvent.press(employeeOption);

    // Enter new rate
    const rateInput = screen.getByPlaceholderText('Enter hourly rate');
    fireEvent.changeText(rateInput, '20');

    // Save changes
    const saveButton = screen.getByText('Save Changes');
    fireEvent.press(saveButton);

    await waitFor(() => {
      expect(mockHRService.updateEmployee).toHaveBeenCalledWith('employee-1', {
        hourlyRate: 20,
        overtimeRate: 30, // 1.5x hourly rate
      });
    });
  });

  it('handles viewing pay periods', async () => {
    render(<PayrollManagementScreen />);

    await waitFor(() => {
      expect(screen.getByText('View Pay Periods')).toBeTruthy();
    });

    // Open pay periods modal
    const viewPeriodsButton = screen.getByText('View Pay Periods');
    fireEvent.press(viewPeriodsButton);

    await waitFor(() => {
      expect(screen.getByText('Pay Period History')).toBeTruthy();
      expect(screen.getByText(/3\/1\/2024 - 3\/15\/2024/)).toBeTruthy();
      expect(screen.getByText(/2\/15\/2024 - 2\/29\/2024/)).toBeTruthy();
    });
  });

  it('shows empty state when no current period', async () => {
    mockHRService.getPayrollPeriods.mockResolvedValue([mockPayrollPeriods[1]]); // Only completed period

    render(<PayrollManagementScreen />);

    await waitFor(() => {
      expect(screen.getByText('No current pay period')).toBeTruthy();
      expect(screen.getByText('Create a new pay period to get started')).toBeTruthy();
    });
  });

  it('shows empty state when no payroll entries', async () => {
    mockHRService.getPayrollEntries.mockResolvedValue([]);

    render(<PayrollManagementScreen />);

    await waitFor(() => {
      expect(screen.getByText('No payroll entries yet')).toBeTruthy();
      expect(screen.getByText('Payroll entries will appear here once created')).toBeTruthy();
    });
  });

  it('handles error when loading data', async () => {
    mockHRService.getEmployees.mockRejectedValue(new Error('Network error'));

    render(<PayrollManagementScreen />);

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Error', 'Failed to load payroll data');
    });
  });

  it('handles error when creating payroll period', async () => {
    mockHRService.createPayrollPeriod.mockRejectedValue(new Error('Creation failed'));

    render(<PayrollManagementScreen />);

    await waitFor(() => {
      expect(screen.getByText('Create New Period')).toBeTruthy();
    });

    const createButton = screen.getByText('Create New Period');
    fireEvent.press(createButton);

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Error', 'Failed to create payroll period');
    });
  });

  it('handles error when updating hourly rates', async () => {
    mockHRService.updateEmployee.mockRejectedValue(new Error('Update failed'));

    render(<PayrollManagementScreen />);

    await waitFor(() => {
      expect(screen.getByText('Set Hourly Rates')).toBeTruthy();
    });

    // Open modal and try to save
    const setRatesButton = screen.getByText('Set Hourly Rates');
    fireEvent.press(setRatesButton);

    await waitFor(() => {
      const employeeOption = screen.getByText('Alice Smith');
      fireEvent.press(employeeOption);

      const rateInput = screen.getByPlaceholderText('Enter hourly rate');
      fireEvent.changeText(rateInput, '20');

      const saveButton = screen.getByText('Save Changes');
      fireEvent.press(saveButton);
    });

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Error', 'Failed to update hourly rate');
    });
  });

  it('validates hourly rate input', async () => {
    render(<PayrollManagementScreen />);

    await waitFor(() => {
      const setRatesButton = screen.getByText('Set Hourly Rates');
      fireEvent.press(setRatesButton);
    });

    await waitFor(() => {
      const employeeOption = screen.getByText('Alice Smith');
      fireEvent.press(employeeOption);

      // Try to save without entering a rate
      const saveButton = screen.getByText('Save Changes');
      fireEvent.press(saveButton);
    });

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Error', 'Please enter a valid hourly rate');
    });
  });

  it('closes modals correctly', async () => {
    render(<PayrollManagementScreen />);

    await waitFor(() => {
      const setRatesButton = screen.getByText('Set Hourly Rates');
      fireEvent.press(setRatesButton);
    });

    await waitFor(() => {
      expect(screen.getByText('Set Employee Hourly Rates')).toBeTruthy();
    });

    // Close modal
    const cancelButton = screen.getByText('Cancel');
    fireEvent.press(cancelButton);

    await waitFor(() => {
      expect(screen.queryByText('Set Employee Hourly Rates')).toBeNull();
    });
  });
});
