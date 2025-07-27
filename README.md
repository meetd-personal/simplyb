# Simply - Business Tracker Mobile App

A production-ready, multi-business mobile application built with React Native, Expo, and Supabase for restaurants and delivery businesses to track revenue, expenses, and team management.

## 🚀 Production Features

### ✅ Core Business Management

- **Multi-Business Support**: Manage multiple restaurant locations
- **Business Creation**: Easy onboarding for new businesses
- **Business Selection**: Switch between different business accounts
- **Business Settings**: Comprehensive business profile management
- **Business Deletion**: Secure business deletion with owner verification

### 👥 Team Management & Collaboration

- **Team Invitations**: Send email invitations to team members
- **Role-Based Access**: Owner, Manager, Accountant, Employee roles
- **Permission System**: Granular permissions for different roles
- **Team Member Management**: Add, remove, and manage team members
- **Invitation Tracking**: Track pending, accepted, and expired invitations
- **Deep Link Support**: Accept invitations via email links

### 💰 Financial Tracking (Restaurant-Specific)

- **Revenue Categories**:
  - 🏪 **Instore** - Direct restaurant sales
  - 📞 **Call Center** - Phone orders
  - 🚗 **Uber** - Uber Eats delivery
  - 🚴 **Skip The Dishes** - Skip delivery platform
- **Expense Categories**:
  - 🍕 **Food Costs** - Ingredients and supplies
  - 🏢 **Operating Expenses** - Rent, utilities, staff
- **Transaction Management**: Add, edit, delete, and view transactions
- **Business-Specific Data**: Each business has separate financial data

### 📊 Analytics & Reporting

- **Dashboard**: Real-time overview of business finances
- **Statistics**: Financial charts and analytics with monthly trends
- **Category Breakdowns**: Revenue and expense analysis by category
- **Profit/Loss Tracking**: Net profit calculations and trends
- **Recent Transactions**: Quick access to latest financial activity

### 🔐 Authentication & Security

- **Google Sign-In**: Secure authentication with Google accounts
- **Multi-Business Access**: Users can belong to multiple businesses
- **Session Management**: Secure token-based authentication
- **Role Verification**: Secure role-based access control

### 🗄️ Database & Storage

- **Supabase Backend**: Production-ready PostgreSQL database
- **Real-Time Sync**: Data syncs across all devices instantly
- **Data Persistence**: All data stored securely in the cloud
- **Backup & Recovery**: Automatic cloud backup of all business data

### 📧 Communication System

- **Email Invitations**: Professional HTML email templates
- **Multiple Email Providers**: Resend (primary), SendGrid (fallback)
- **Invitation Management**: Track and manage team invitations
- **Deep Link Integration**: Seamless invitation acceptance flow

### 📱 Cross-Platform Support

- **iOS**: Native iOS experience
- **Android**: Native Android experience
- **Web**: Web-compatible (with some limitations)
- **Deep Links**: Custom URL scheme support (`simply://`)

## 🏗️ Technical Architecture

### Backend
- **Supabase**: PostgreSQL database with real-time subscriptions
- **Edge Functions**: Serverless functions for email sending
- **Row Level Security**: Database-level security policies
- **Real-time Updates**: Live data synchronization

### Frontend
- **React Native**: Cross-platform mobile development
- **Expo**: Development and deployment platform
- **TypeScript**: Type-safe development
- **React Navigation**: Navigation management
- **Context API**: State management

### Services Architecture
- **Service Factory Pattern**: Switchable between mock and real services
- **Database Service**: Supabase integration layer
- **Transaction Service**: Financial data management
- **Team Invitation Service**: Team management and invitations
- **Auth Service**: Authentication and session management

## 🎯 Business Model

**Target Audience**: Restaurant and delivery businesses
**Use Cases**:
- Track revenue from multiple delivery platforms
- Manage food costs and operating expenses
- Collaborate with team members on financial data
- Monitor business performance across locations

## 🚧 Future Enhancements

- **Receipt Photos**: Attach photos to expense entries
- **Advanced Filtering**: Enhanced transaction filtering
- **Business Reports**: Detailed financial reports and exports
- **Integration APIs**: Connect with delivery platform APIs
- **Mobile Notifications**: Push notifications for important events
- **Dark Mode**: Dark theme support

## Technology Stack

- **Framework**: React Native with Expo
- **Language**: TypeScript
- **Navigation**: React Navigation v6
- **Storage**: AsyncStorage
- **Charts**: React Native Chart Kit
- **Icons**: Expo Vector Icons
- **Platform Support**: iOS, Android, Web

## Project Structure

```
src/
├── components/          # Reusable UI components
├── navigation/          # Navigation configuration
├── screens/            # Screen components
│   ├── DashboardScreen.tsx
│   ├── RevenueScreen.tsx
│   ├── ExpensesScreen.tsx
│   ├── StatisticsScreen.tsx
│   ├── AddTransactionScreen.tsx
│   ├── TransactionDetailScreen.tsx
│   └── SettingsScreen.tsx
├── services/           # Data services and API calls
│   └── TransactionService.ts
├── types/              # TypeScript type definitions
│   └── index.ts
├── utils/              # Utility functions
└── hooks/              # Custom React hooks
```

## Getting Started

### Prerequisites

- Node.js (v16 or later)
- npm or yarn
- Expo CLI
- iOS Simulator (for iOS development)
- Android Studio (for Android development)

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm start
   ```

4. Run on your preferred platform:
   - **iOS**: Press `i` or run `npm run ios`
   - **Android**: Press `a` or run `npm run android`
   - **Web**: Press `w` or run `npm run web`

### Using Expo Go

1. Install Expo Go on your mobile device
2. Scan the QR code displayed in the terminal
3. The app will load on your device

## Data Model

### Transaction
- `id`: Unique identifier
- `type`: 'revenue' | 'expense'
- `amount`: Transaction amount
- `description`: Transaction description
- `category`: Category name
- `date`: Transaction date
- `receiptUri`: Optional receipt photo
- `createdAt`: Creation timestamp
- `updatedAt`: Last update timestamp

### Categories
Pre-defined categories for both revenue and expenses with color coding and icons.

## Key Features Explained

### Dashboard
- Quick overview of total revenue, expenses, and net profit
- Recent transactions list
- Quick action buttons to add new transactions

### Revenue & Expense Tracking
- Dedicated screens for viewing revenue and expenses
- Add new transactions with category selection
- Pull-to-refresh functionality

### Statistics
- Monthly trend charts showing revenue vs expenses
- Pie charts for category breakdowns
- Key financial metrics and profit margins

### Transaction Management
- Detailed transaction view
- Edit and delete functionality
- Transaction history with search and filtering

## Development Notes

### Known Issues
- Web version has some compatibility issues with React Native Chart Kit
- Some React Native packages may not work perfectly on web

### Future Improvements
- Implement proper error handling and loading states
- Add unit and integration tests
- Implement offline-first architecture
- Add data validation and sanitization
- Implement proper state management (Redux/Zustand)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions, please contact the development team or create an issue in the repository.
