// Simple test script to verify the app functionality
// This can be run with: node test-app.js

console.log('🧪 Testing Simply Business Tracker App...\n');

// Test 1: Check if all required files exist
const fs = require('fs');
const path = require('path');

const requiredFiles = [
  'src/navigation/AppNavigator.tsx',
  'src/screens/DashboardScreen.tsx',
  'src/screens/RevenueScreen.tsx',
  'src/screens/ExpensesScreen.tsx',
  'src/screens/StatisticsScreen.tsx',
  'src/screens/AddTransactionScreen.tsx',
  'src/screens/TransactionDetailScreen.tsx',
  'src/screens/SettingsScreen.tsx',
  'src/services/TransactionService.ts',
  'src/types/index.ts',
  'App.tsx',
  'package.json',
  'app.json'
];

console.log('✅ Checking required files...');
let allFilesExist = true;

requiredFiles.forEach(file => {
  if (fs.existsSync(path.join(__dirname, file))) {
    console.log(`   ✓ ${file}`);
  } else {
    console.log(`   ✗ ${file} - MISSING`);
    allFilesExist = false;
  }
});

if (allFilesExist) {
  console.log('\n✅ All required files exist!');
} else {
  console.log('\n❌ Some files are missing!');
}

// Test 2: Check package.json dependencies
console.log('\n✅ Checking dependencies...');
const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8'));

const requiredDeps = [
  '@react-navigation/native',
  '@react-navigation/bottom-tabs',
  '@react-navigation/stack',
  'react-native-screens',
  'react-native-safe-area-context',
  '@react-native-async-storage/async-storage',
  '@expo/vector-icons',
  'react-native-chart-kit',
  'react-native-svg',
  'expo',
  'react',
  'react-native'
];

let allDepsInstalled = true;
requiredDeps.forEach(dep => {
  if (packageJson.dependencies[dep] || packageJson.devDependencies?.[dep]) {
    console.log(`   ✓ ${dep}`);
  } else {
    console.log(`   ✗ ${dep} - MISSING`);
    allDepsInstalled = false;
  }
});

if (allDepsInstalled) {
  console.log('\n✅ All required dependencies are installed!');
} else {
  console.log('\n❌ Some dependencies are missing!');
}

// Test 3: Check app.json configuration
console.log('\n✅ Checking app configuration...');
const appJson = JSON.parse(fs.readFileSync(path.join(__dirname, 'app.json'), 'utf8'));

const checks = [
  { key: 'expo.name', expected: 'Simply Business Tracker', actual: appJson.expo?.name },
  { key: 'expo.platforms', expected: ['ios', 'android'], actual: appJson.expo?.platforms },
  { key: 'expo.ios.bundleIdentifier', expected: 'com.simply.businesstracker', actual: appJson.expo?.ios?.bundleIdentifier },
  { key: 'expo.android.package', expected: 'com.simply.businesstracker', actual: appJson.expo?.android?.package }
];

checks.forEach(check => {
  const matches = JSON.stringify(check.actual) === JSON.stringify(check.expected);
  if (matches) {
    console.log(`   ✓ ${check.key}: ${JSON.stringify(check.actual)}`);
  } else {
    console.log(`   ⚠ ${check.key}: ${JSON.stringify(check.actual)} (expected: ${JSON.stringify(check.expected)})`);
  }
});

console.log('\n🎉 Simply Business Tracker App Test Complete!');
console.log('\n📱 To run the app:');
console.log('   1. Make sure you have Expo Go installed on your phone');
console.log('   2. Run: npm start');
console.log('   3. Scan the QR code with Expo Go (Android) or Camera (iOS)');
console.log('\n🚀 The app should load and show the dashboard with navigation tabs!');
