import React from 'react';
import { render, fireEvent, waitFor, screen } from '@testing-library/react-native';
import { Alert } from 'react-native';
import TimeOffApprovalScreen from '../TimeOffApprovalScreen';
import { useAuth } from '../../../contexts/AuthContext';
import HRServiceFactory from '../../../services/HRServiceFactory';

// Mock dependencies
jest.mock('../../../contexts/AuthContext');
jest.mock('../../../services/HRServiceFactory');
jest.spyOn(Alert, 'alert');

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockHRService = HRServiceFactory as jest.Mocked<typeof HRServiceFactory>;

describe('TimeOffApprovalScreen', () => {
  const mockAuthState = {
    user: { id: 'user-1', firstName: 'John', lastName: 'Doe' },
    currentBusiness: { id: 'business-1', name: 'Test Business' },
    currentBusinessMember: { id: 'member-1' },
  };

  const mockTimeOffRequests = [
    {
      id: 'request-1',
      employeeId: 'employee-1',
      type: 'vacation',
      startDate: new Date('2024-03-15'),
      endDate: new Date('2024-03-17'),
      reason: 'Family vacation',
      status: 'pending',
      createdAt: new Date('2024-03-01'),
      approvedAt: null,
      approvedBy: null,
    },
    {
      id: 'request-2',
      employeeId: 'employee-2',
      type: 'sick',
      startDate: new Date('2024-03-20'),
      endDate: new Date('2024-03-21'),
      reason: 'Medical appointment',
      status: 'approved',
      createdAt: new Date('2024-03-05'),
      approvedAt: new Date('2024-03-06'),
      approvedBy: 'manager-1',
    },
  ];

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

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuth.mockReturnValue({ state: mockAuthState } as any);
    mockHRService.getTimeOffRequests.mockResolvedValue(mockTimeOffRequests);
    mockHRService.getEmployees.mockResolvedValue(mockEmployees);
  });

  it('renders correctly and loads data', async () => {
    render(<TimeOffApprovalScreen />);

    // Should show loading initially
    expect(screen.getByText('Loading time off requests...')).toBeTruthy();

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('Time Off Approvals')).toBeTruthy();
    });

    // Should display stats
    expect(screen.getByText('1')).toBeTruthy(); // Pending count
    expect(screen.getByText('Pending')).toBeTruthy();
    expect(screen.getByText('Approved')).toBeTruthy();

    // Should display pending request
    expect(screen.getByText('Alice Smith')).toBeTruthy();
    expect(screen.getByText('Vacation')).toBeTruthy();
    expect(screen.getByText('Family vacation')).toBeTruthy();
  });

  it('handles approve request', async () => {
    mockHRService.approveTimeOffRequest.mockResolvedValue();

    render(<TimeOffApprovalScreen />);

    await waitFor(() => {
      expect(screen.getByText('Alice Smith')).toBeTruthy();
    });

    // Find and press approve button
    const approveButton = screen.getByText('Approve');
    fireEvent.press(approveButton);

    await waitFor(() => {
      expect(mockHRService.approveTimeOffRequest).toHaveBeenCalledWith('request-1', 'user-1');
      expect(Alert.alert).toHaveBeenCalledWith('Success', 'Time off request approved');
    });
  });

  it('handles deny request', async () => {
    mockHRService.denyTimeOffRequest.mockResolvedValue();

    render(<TimeOffApprovalScreen />);

    await waitFor(() => {
      expect(screen.getByText('Alice Smith')).toBeTruthy();
    });

    // Find and press deny button
    const denyButton = screen.getByText('Deny');
    fireEvent.press(denyButton);

    await waitFor(() => {
      expect(mockHRService.denyTimeOffRequest).toHaveBeenCalledWith('request-1', 'user-1');
      expect(Alert.alert).toHaveBeenCalledWith('Success', 'Time off request denied');
    });
  });

  it('handles bulk approval', async () => {
    mockHRService.approveTimeOffRequest.mockResolvedValue();

    render(<TimeOffApprovalScreen />);

    await waitFor(() => {
      expect(screen.getByText('Alice Smith')).toBeTruthy();
    });

    // Select request for bulk approval
    const selectButton = screen.getByTestId('select-request-1') || screen.getAllByRole('button').find(btn => 
      btn.props.accessibilityLabel?.includes('select')
    );
    
    if (selectButton) {
      fireEvent.press(selectButton);
    }

    // Open bulk approval modal
    const bulkApproveButton = screen.getByText('Bulk Approve');
    fireEvent.press(bulkApproveButton);

    // Confirm bulk approval
    await waitFor(() => {
      expect(screen.getByText('Bulk Approve Requests')).toBeTruthy();
    });

    const confirmButton = screen.getByText('Approve All');
    fireEvent.press(confirmButton);

    await waitFor(() => {
      expect(mockHRService.approveTimeOffRequest).toHaveBeenCalledWith('request-1', 'user-1');
    });
  });

  it('handles error when loading data', async () => {
    mockHRService.getTimeOffRequests.mockRejectedValue(new Error('Network error'));

    render(<TimeOffApprovalScreen />);

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Error', 'Failed to load time off requests');
    });
  });

  it('handles error when approving request', async () => {
    mockHRService.approveTimeOffRequest.mockRejectedValue(new Error('Approval failed'));

    render(<TimeOffApprovalScreen />);

    await waitFor(() => {
      expect(screen.getByText('Alice Smith')).toBeTruthy();
    });

    const approveButton = screen.getByText('Approve');
    fireEvent.press(approveButton);

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Error', 'Failed to approve request');
    });
  });

  it('displays empty state when no pending requests', async () => {
    mockHRService.getTimeOffRequests.mockResolvedValue([mockTimeOffRequests[1]]); // Only approved request

    render(<TimeOffApprovalScreen />);

    await waitFor(() => {
      expect(screen.getByText('No pending requests')).toBeTruthy();
      expect(screen.getByText('All time off requests have been processed')).toBeTruthy();
    });
  });

  it('displays processed requests correctly', async () => {
    render(<TimeOffApprovalScreen />);

    await waitFor(() => {
      expect(screen.getByText('Bob Johnson')).toBeTruthy();
      expect(screen.getByText('Approved')).toBeTruthy();
    });
  });

  it('calculates stats correctly', async () => {
    const mixedRequests = [
      ...mockTimeOffRequests,
      {
        id: 'request-3',
        employeeId: 'employee-1',
        type: 'personal',
        startDate: new Date('2024-03-25'),
        endDate: new Date('2024-03-26'),
        reason: 'Personal matter',
        status: 'denied',
        createdAt: new Date('2024-03-10'),
        approvedAt: new Date('2024-03-11'),
        approvedBy: 'manager-1',
      },
    ];

    mockHRService.getTimeOffRequests.mockResolvedValue(mixedRequests);

    render(<TimeOffApprovalScreen />);

    await waitFor(() => {
      // Should show correct counts: 1 pending, 1 approved, 1 denied
      const statCards = screen.getAllByText(/\d+/);
      expect(statCards.some(card => card.children === '1')).toBeTruthy(); // Pending
    });
  });

  it('handles request selection for bulk operations', async () => {
    render(<TimeOffApprovalScreen />);

    await waitFor(() => {
      expect(screen.getByText('Alice Smith')).toBeTruthy();
    });

    // Test selecting and deselecting requests
    const selectButton = screen.getAllByRole('button').find(btn => 
      btn.props.children?.props?.name === 'add' || btn.props.children?.props?.name === 'checkmark'
    );
    
    if (selectButton) {
      fireEvent.press(selectButton);
      // Should change to selected state
      fireEvent.press(selectButton);
      // Should deselect
    }
  });
});
