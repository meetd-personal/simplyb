# Simply Business Tracker - Authentication & Authorization

## 🔐 Authentication System Overview

The Simply app now includes a comprehensive authentication and authorization system with role-based access control, allowing businesses to manage team access effectively.

## 👥 User Roles

### Business Owner
- **Full Access**: Complete control over all app features
- **Permissions**:
  - ✅ Add revenue and expenses
  - ✅ View and delete all transactions
  - ✅ Access financial statistics and analytics
  - ✅ Export data and manage backups
  - ✅ Manage team members (future feature)
  - ✅ Full settings access

### Team Member
- **Restricted Access**: Limited to essential transaction entry
- **Permissions**:
  - ✅ Add revenue and expenses
  - ✅ View transaction details
  - ❌ Delete transactions
  - ❌ Access statistics and analytics
  - ❌ Export data or manage backups
  - ❌ Manage team members

## 🚀 Getting Started

### Demo Accounts
For testing purposes, use these demo credentials:

**Business Owner Account:**
- Email: `owner@business.com`
- Password: `password123` (or any password 6+ characters)

**Team Member Account:**
- Email: `team@business.com`
- Password: `password123` (or any password 6+ characters)

### Creating New Accounts
1. Open the app and tap "Sign Up"
2. Choose your account type (Business Owner or Team Member)
3. Fill in your personal and business information
4. Create a secure password (6+ characters)
5. Tap "Create Account"

## 📱 App Flow

### First Time Users
1. **Welcome Screen** → Login/Signup options
2. **Authentication** → Role-based access granted
3. **Dashboard** → Personalized welcome with role indicator

### Returning Users
1. **Auto-login** → Seamless experience with stored credentials
2. **Dashboard** → Continue where you left off

## 🔒 Security Features

### Data Protection
- **Secure Storage**: User credentials and tokens stored securely using AsyncStorage
- **Session Management**: Automatic session handling with token-based authentication
- **Role Validation**: Server-side permission checks for all sensitive operations

### Password Requirements
- Minimum 6 characters
- Email validation
- Secure password handling (hashed in production)

## 🎨 User Interface

### Login Screen
- Clean, professional design
- Email and password validation
- Demo account quick-fill buttons
- "Remember me" functionality
- Easy signup navigation

### Signup Screen
- Role selection (Business Owner/Team Member)
- Comprehensive form validation
- Real-time error feedback
- Business information collection

### Dashboard Updates
- Personalized welcome message
- Role indicator in header
- Quick logout access
- Role-appropriate action buttons

## 🛡️ Role-Based Features

### Navigation Restrictions
- **Statistics Tab**: Only visible to Business Owners
- **Settings Options**: Data management features restricted to owners
- **Transaction Actions**: Delete buttons only shown to owners

### Screen Access Control
```typescript
// Example permission check
const { hasPermission } = useAuth();

if (hasPermission('delete_transactions')) {
  // Show delete button
}

if (hasPermission('view_statistics')) {
  // Show statistics tab
}
```

## 🔧 Technical Implementation

### Authentication Context
- React Context for global state management
- Automatic session restoration
- Loading states and error handling

### Service Layer
- `AuthService`: Handles login, signup, logout operations
- `TransactionService`: Integrated with user permissions
- Mock backend for demo (easily replaceable with real API)

### Navigation Structure
```
App
├── AuthProvider (Context)
├── AppNavigator
    ├── AuthStack (Login/Signup)
    └── MainStack (Authenticated App)
        ├── MainTabs (Role-based)
        ├── AddTransaction
        ├── TransactionDetail
        ├── UserProfile
        └── Settings
```

## 📊 User Profile Management

### Profile Features
- View and edit personal information
- Role and business information display
- Secure logout functionality
- Profile picture placeholder (future enhancement)

### Settings Integration
- Role-appropriate settings options
- Data management tools for business owners
- Account management for all users

## 🚀 Future Enhancements

### Planned Features
1. **Team Management**: Business owners can invite team members
2. **Advanced Permissions**: Granular role customization
3. **Multi-Business Support**: Users can belong to multiple businesses
4. **SSO Integration**: Single sign-on with popular business tools
5. **Audit Logs**: Track user actions for compliance
6. **Password Reset**: Email-based password recovery

### Security Improvements
1. **Two-Factor Authentication**: SMS/Email verification
2. **Biometric Login**: Fingerprint/Face ID support
3. **Session Timeout**: Automatic logout after inactivity
4. **Device Management**: Track and manage logged-in devices

## 🧪 Testing the Authentication

### Test Scenarios
1. **Login Flow**: Test both demo accounts
2. **Signup Flow**: Create new business owner and team member accounts
3. **Role Restrictions**: Verify team members can't access statistics
4. **Logout Flow**: Ensure clean session termination
5. **Session Persistence**: Close and reopen app to test auto-login

### QR Code Access
- Scan the QR code: `exp://10.0.0.177:8082`
- Or manually enter the URL in Expo Go

## 📞 Support

For authentication issues or questions:
1. Check the demo credentials above
2. Ensure you're using the correct role for testing
3. Try logging out and back in if experiencing issues
4. Contact the development team for technical support

---

**Simply Business Tracker** - Secure, role-based business financial management.
