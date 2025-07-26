# Simply - Business Tracker Mobile App

A cross-platform mobile application built with React Native and Expo for small businesses to track revenue, expenses, and financial statistics.

## Features

### ✅ Completed Features

- **Dashboard**: Overview of business finances with key metrics
- **Revenue Tracking**: Add, view, and manage revenue entries
- **Expense Tracking**: Add, view, and manage expense entries  
- **Transaction Details**: View detailed information about each transaction
- **Categories**: Pre-defined categories for revenue and expenses
- **Statistics**: Financial charts and analytics (monthly trends, category breakdowns)
- **Local Storage**: Data persistence using AsyncStorage
- **Cross-Platform**: Works on iOS, Android, and Web (with some limitations)

### 🚧 In Progress

- **Data Export**: CSV export functionality
- **Cloud Backup**: Backup data to cloud storage

### 📱 Planned Features

- **Receipt Photos**: Attach photos to expense entries
- **Advanced Filtering**: Filter transactions by date, amount, category
- **Business Reports**: Generate detailed financial reports
- **Multi-Currency Support**: Support for different currencies
- **Dark Mode**: Dark theme support
- **Notifications**: Reminders for expense tracking

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
