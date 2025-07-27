import React, { createContext, useContext, useReducer, useEffect, ReactNode, useCallback, useRef } from 'react';
import { AuthState, User, LoginCredentials, SignupData } from '../types';
import { Business, BusinessRole } from '../types/database';
import AuthService from '../services/AuthServiceFactory';
import DatabaseService from '../services/DatabaseServiceFactory';

// Auth Actions
type AuthAction =
  | { type: 'INITIALIZE'; payload: AuthState }
  | { type: 'LOGIN_START' }
  | { type: 'LOGIN_SUCCESS'; payload: { user: User; token: string; businesses: Business[]; needsBusinessSelection: boolean } }
  | { type: 'LOGIN_FAILURE'; payload: string }
  | { type: 'SIGNUP_START' }
  | { type: 'SIGNUP_SUCCESS'; payload: { user: User; token: string; business: Business } }
  | { type: 'SIGNUP_SUCCESS_NO_BUSINESS'; payload: { user: User; token: string } }
  | { type: 'SIGNUP_SUCCESS_PENDING'; payload: { message: string } }
  | { type: 'SIGNUP_FAILURE'; payload: string }
  | { type: 'LOGOUT' }
  | { type: 'UPDATE_USER'; payload: User }
  | { type: 'SELECT_BUSINESS'; payload: { business: Business; userRole: BusinessRole | null; forceRefresh?: boolean; navigationKey?: string } }
  | { type: 'REFRESH_BUSINESSES'; payload: { businesses: Business[] } };

// Auth State with loading states
interface AuthContextState extends AuthState {
  isLoading: boolean;
  error: string | null;
  message?: string | null;
}

// Auth Context Type
interface AuthContextType {
  state: AuthContextState;
  login: (credentials: LoginCredentials) => Promise<void>;
  signup: (signupData: SignupData) => Promise<void>;
  signInWithApple: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithGoogleEmail: (email: string, oauthData?: any) => Promise<void>;
  signInWithAppleEmail: (email: string, oauthData?: any) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (user: User) => void;
  selectBusiness: (business: Business) => Promise<void>;
  refreshBusinesses: () => Promise<void>;
  hasPermission: (action: 'view_statistics' | 'delete_transactions' | 'manage_team' | 'add_transactions') => boolean;
  isBusinessOwner: () => boolean;
  isTeamMember: () => boolean;
}

// Initial State
const initialState: AuthContextState = {
  isAuthenticated: false,
  user: null,
  token: null,
  businesses: [],
  currentBusiness: null,
  currentUserRole: null,
  needsBusinessSelection: true, // Always require business selection initially
  isLoading: true,
  error: null,
  message: null,
};

// Auth Reducer
function authReducer(state: AuthContextState, action: AuthAction): AuthContextState {
  switch (action.type) {
    case 'INITIALIZE':
      return {
        ...state,
        ...action.payload,
        isLoading: false,
        error: null,
      };
    case 'LOGIN_START':
    case 'SIGNUP_START':
      return {
        ...state,
        isLoading: true,
        error: null,
        message: null,
      };
    case 'LOGIN_SUCCESS':
      const hasBusinesses = action.payload.businesses.length > 0;
      const isAuthenticated = hasBusinesses; // Authenticated if user has any businesses

      console.log('🔍 AuthContext Reducer: Processing LOGIN_SUCCESS with needsBusinessSelection:', action.payload.needsBusinessSelection);
      console.log('🔍 AuthContext Reducer: Setting isAuthenticated to:', isAuthenticated);
      console.log('🔍 AuthContext Reducer: Business count:', action.payload.businesses.length);

      return {
        ...state,
        isAuthenticated,
        user: action.payload.user,
        token: action.payload.token,
        businesses: action.payload.businesses,
        needsBusinessSelection: action.payload.needsBusinessSelection,
        isLoading: false,
        error: null,
        message: null,
      };
    case 'SIGNUP_SUCCESS':
      return {
        ...state,
        isAuthenticated: true,
        user: action.payload.user,
        token: action.payload.token,
        businesses: [action.payload.business],
        currentBusiness: action.payload.business,
        needsBusinessSelection: false,
        isLoading: false,
        error: null,
        message: null,
      };
    case 'SIGNUP_SUCCESS_NO_BUSINESS':
      return {
        ...state,
        isAuthenticated: true,
        user: action.payload.user,
        token: action.payload.token,
        businesses: [],
        currentBusiness: null,
        needsBusinessSelection: false, // They need to create/join a business
        isLoading: false,
        error: null,
        message: null,
      };
    case 'SIGNUP_SUCCESS_PENDING':
      return {
        ...state,
        isAuthenticated: false,
        user: null,
        token: null,
        businesses: [],
        currentBusiness: null,
        needsBusinessSelection: false,
        isLoading: false,
        error: null,
        message: action.payload.message,
      };
    case 'LOGIN_FAILURE':
    case 'SIGNUP_FAILURE':
      return {
        ...state,
        isAuthenticated: false,
        user: null,
        token: null,
        isLoading: false,
        error: action.payload,
      };
    case 'LOGOUT':
      return {
        ...state,
        isAuthenticated: false,
        user: null,
        token: null,
        businesses: [],
        currentBusiness: null,
        needsBusinessSelection: false,
        isLoading: false,
        error: null,
      };
    case 'SELECT_BUSINESS':
      return {
        ...state,
        isAuthenticated: true,
        currentBusiness: action.payload.business,
        currentUserRole: action.payload.userRole,
        needsBusinessSelection: false,
        isLoading: false,
        navigationKey: action.payload.navigationKey || state.navigationKey,
      };
    case 'REFRESH_BUSINESSES':
      const refreshedBusinesses = action.payload.businesses;
      const needsBusinessSelection = refreshedBusinesses.length > 1; // Only need selection if multiple businesses
      const refreshIsAuthenticated = refreshedBusinesses.length > 0; // Authenticated if has any businesses

      // If user has exactly one business, auto-select it
      const currentBusiness = refreshedBusinesses.length === 1 ? refreshedBusinesses[0] : state.currentBusiness;

      console.log('🔍 AuthContext Reducer: REFRESH_BUSINESSES - needsBusinessSelection:', needsBusinessSelection);
      console.log('🔍 AuthContext Reducer: REFRESH_BUSINESSES - isAuthenticated:', refreshIsAuthenticated);
      console.log('🔍 AuthContext Reducer: REFRESH_BUSINESSES - business count:', refreshedBusinesses.length);
      console.log('🔍 AuthContext Reducer: REFRESH_BUSINESSES - auto-selected business:', currentBusiness?.name);

      return {
        ...state,
        businesses: refreshedBusinesses,
        needsBusinessSelection,
        isAuthenticated: refreshIsAuthenticated,
        currentBusiness,
        // If we auto-selected a business, assume user is owner (they just created it)
        currentUserRole: refreshedBusinesses.length === 1 ? BusinessRole.OWNER : state.currentUserRole,
      };
    case 'UPDATE_USER':
      return {
        ...state,
        user: action.payload,
      };
    default:
      return state;
  }
}

// Create Context
export const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Auth Provider Component
interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [state, dispatch] = useReducer(authReducer, initialState);
  const isMountedRef = useRef(true);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Initialize auth state on app start
  useEffect(() => {
    const initializeAuth = async () => {
      console.log('🔍 AuthContext: Starting auth initialization...');
      try {
        const result = await AuthService.initializeAuth();
        console.log('🔍 AuthContext: InitializeAuth result:', {
          success: result.success,
          hasUser: !!result.user,
          hasToken: !!result.token,
          businessCount: result.businesses?.length || 0,
          error: result.error
        });

        if (result.success && result.user && result.token) {
          const businesses = result.businesses || [];
          const needsBusinessSelection = businesses.length > 1; // Only need selection if multiple businesses

          // Auto-select business if only one exists
          let currentBusiness = null;
          let currentUserRole = null;
          let isAuthenticated = false;

          if (businesses.length === 1) {
            currentBusiness = businesses[0];
            // Get user role for this business (assuming it's stored in business object or needs lookup)
            currentUserRole = 'OWNER'; // Default for single business - should be fetched from business_members
            isAuthenticated = true;
          } else if (businesses.length === 0) {
            // User has no businesses - needs onboarding
            isAuthenticated = false;
          }

          console.log('🔍 AuthContext: Initialize auth success with needsBusinessSelection:', needsBusinessSelection);
          console.log('🔍 AuthContext: User email:', result.user.email);
          console.log('🔍 AuthContext: Business count:', businesses.length);
          console.log('🔍 AuthContext: Auto-selected business:', currentBusiness?.name);

          const authState: AuthState = {
            isAuthenticated,
            user: result.user,
            token: result.token,
            businesses,
            currentBusiness,
            currentUserRole,
            needsBusinessSelection
          };

          console.log('🔍 AuthContext: Dispatching INITIALIZE with isAuthenticated:', authState.isAuthenticated);
          if (isMountedRef.current) {
            dispatch({ type: 'INITIALIZE', payload: authState });
          }
        } else {
          console.log('🔍 AuthContext: Initialize auth failed, showing login. Error:', result.error);
          dispatch({
            type: 'INITIALIZE',
            payload: {
              isAuthenticated: false,
              user: null,
              token: null,
              businesses: [],
              currentBusiness: null,
              currentUserRole: null,
              needsBusinessSelection: false
            }
          });
        }
      } catch (error) {
        console.error('❌ AuthContext: Auth initialization error:', error);
        dispatch({
          type: 'INITIALIZE',
          payload: {
            isAuthenticated: false,
            user: null,
            token: null,
            businesses: [],
            currentBusiness: null,
            currentUserRole: null,
            needsBusinessSelection: false
          }
        });
      }
    };

    initializeAuth();
  }, []);

  // Login function - use useCallback to prevent re-creation
  const login = useCallback(async (credentials: LoginCredentials) => {
    dispatch({ type: 'LOGIN_START' });

    try {
      const result = await AuthService.login(credentials);

      if (result.success && result.user && result.token) {
        const businesses = result.businesses || [];
        // Need business selection only if user has multiple businesses
        // If no businesses, they'll go to business onboarding flow
        // If one business, they'll go directly to main app
        const needsBusinessSelection = businesses.length > 1;

        dispatch({
          type: 'LOGIN_SUCCESS',
          payload: {
            user: result.user,
            token: result.token,
            businesses,
            needsBusinessSelection
          }
        });
      } else {
        dispatch({
          type: 'LOGIN_FAILURE',
          payload: result.error || 'Login failed'
        });
      }
    } catch (error) {
      dispatch({
        type: 'LOGIN_FAILURE',
        payload: 'Network error. Please try again.'
      });
    }
  }, []);

  // Signup function
  const signup = async (signupData: SignupData) => {
    dispatch({ type: 'SIGNUP_START' });

    try {
      const result = await AuthService.signup(signupData);

      if (result.success && result.user) {
        // Handle successful signup with or without immediate session
        if (result.token) {
          // User has immediate access (email confirmation disabled)
          if (result.businesses && result.businesses.length > 0) {
            // User has businesses - proceed to business selection
            dispatch({
              type: 'SIGNUP_SUCCESS',
              payload: {
                user: result.user,
                token: result.token,
                business: result.businesses[0] // Use first business
              }
            });
          } else {
            // User has no businesses - show business creation/invitation flow
            dispatch({
              type: 'SIGNUP_SUCCESS_NO_BUSINESS',
              payload: {
                user: result.user,
                token: result.token
              }
            });
          }
        } else {
          // User created but needs email confirmation
          dispatch({
            type: 'SIGNUP_SUCCESS_PENDING',
            payload: {
              message: result.message || 'Account created successfully! Please check your email to verify your account.'
            }
          });
        }
      } else {
        dispatch({
          type: 'SIGNUP_FAILURE',
          payload: result.error || 'Signup failed'
        });
      }
    } catch (error) {
      dispatch({
        type: 'SIGNUP_FAILURE',
        payload: 'Network error. Please try again.'
      });
    }
  };

  // Apple Sign-In function
  const signInWithApple = async () => {
    dispatch({ type: 'LOGIN_START' });

    try {
      const result = await AuthService.signInWithApple();

      if (result.success && result.user && result.token) {
        const businesses = result.businesses || [];
        const needsBusinessSelection = businesses.length > 1;

        dispatch({
          type: 'LOGIN_SUCCESS',
          payload: {
            user: result.user,
            token: result.token,
            businesses,
            needsBusinessSelection
          }
        });
      } else {
        dispatch({
          type: 'LOGIN_FAILURE',
          payload: result.error || 'Apple Sign-In failed'
        });
      }
    } catch (error) {
      dispatch({
        type: 'LOGIN_FAILURE',
        payload: 'Apple Sign-In failed. Please try again.'
      });
    }
  };

  // Google Sign-In function
  const signInWithGoogle = async () => {
    console.log('🔍 AuthContext: Starting Google sign-in...');
    dispatch({ type: 'LOGIN_START' });

    try {
      const result = await AuthService.signInWithGoogle();
      console.log('🔍 AuthContext: Google sign-in result:', {
        success: result.success,
        hasUser: !!result.user,
        hasToken: !!result.token,
        businessCount: result.businesses?.length || 0
      });

      if (result.success && result.user && result.token) {
        const businesses = result.businesses || [];
        const needsBusinessSelection = businesses.length > 1;

        console.log('🔍 AuthContext: Dispatching LOGIN_SUCCESS with needsBusinessSelection:', needsBusinessSelection);

        dispatch({
          type: 'LOGIN_SUCCESS',
          payload: {
            user: result.user,
            token: result.token,
            businesses,
            needsBusinessSelection
          }
        });
      } else {
        console.log('❌ AuthContext: Google sign-in failed:', result.error);
        dispatch({
          type: 'LOGIN_FAILURE',
          payload: result.error || 'Google Sign-In failed'
        });
      }
    } catch (error) {
      console.log('❌ AuthContext: Google sign-in error:', error);
      dispatch({
        type: 'LOGIN_FAILURE',
        payload: 'Google Sign-In failed. Please try again.'
      });
    }
  };

  // Google Sign-In with OAuth data
  const signInWithGoogleEmail = useCallback(async (email: string, oauthData?: any) => {
    dispatch({ type: 'LOGIN_START' });

    try {
      // If we have OAuth data, use it to create/find the user
      let result;
      if (oauthData) {
        // Create or find user with OAuth data
        result = await AuthService.signInWithOAuthData('google', oauthData);
      } else {
        // Fallback to email-based sign-in
        result = await AuthService.signInWithGoogleEmail(email);
      }

      if (result.success && result.user && result.token) {
        const businesses = result.businesses || [];
        const needsBusinessSelection = businesses.length > 1;

        dispatch({
          type: 'LOGIN_SUCCESS',
          payload: {
            user: result.user,
            token: result.token,
            businesses,
            needsBusinessSelection
          }
        });
      } else {
        dispatch({
          type: 'LOGIN_FAILURE',
          payload: result.error || 'Google Sign-In failed'
        });
      }
    } catch (error) {
      dispatch({
        type: 'LOGIN_FAILURE',
        payload: 'Google Sign-In failed. Please try again.'
      });
    }
  }, []);

  // Apple Sign-In with OAuth data
  const signInWithAppleEmail = useCallback(async (email: string, oauthData?: any) => {
    dispatch({ type: 'LOGIN_START' });

    try {
      // If we have OAuth data, use it to create/find the user
      let result;
      if (oauthData) {
        // Create or find user with OAuth data
        result = await AuthService.signInWithOAuthData('apple', oauthData);
      } else {
        // Fallback to email-based sign-in
        result = await AuthService.signInWithAppleEmail(email);
      }

      if (result.success && result.user && result.token) {
        const businesses = result.businesses || [];
        const needsBusinessSelection = businesses.length > 1;

        dispatch({
          type: 'LOGIN_SUCCESS',
          payload: {
            user: result.user,
            token: result.token,
            businesses,
            needsBusinessSelection
          }
        });
      } else {
        dispatch({
          type: 'LOGIN_FAILURE',
          payload: result.error || 'Apple Sign-In failed'
        });
      }
    } catch (error) {
      dispatch({
        type: 'LOGIN_FAILURE',
        payload: 'Apple Sign-In failed. Please try again.'
      });
    }
  }, []);

  // Business selection function
  const selectBusiness = useCallback(async (business: Business) => {
    try {
      if (!state.user) {
        throw new Error('No user logged in');
      }

      console.log('🔄 AuthContext: Switching to business:', business.name);

      await DatabaseService.setCurrentBusiness(business);

      // Get user's role in this business
      const memberships = await DatabaseService.getUserBusinessMemberships(state.user.id);
      const membership = memberships.find(m => m.businessId === business.id && m.isActive);
      const userRole = membership?.role || null;

      // Force a complete app refresh by updating the navigation key
      // This will cause all screens to remount with fresh data
      const newNavigationKey = `nav-business-switch-${Date.now()}`;

      dispatch({
        type: 'SELECT_BUSINESS',
        payload: {
          business,
          userRole,
          forceRefresh: true,
          navigationKey: newNavigationKey
        }
      });

      console.log('✅ AuthContext: Business switched successfully to:', business.name);
    } catch (error) {
      console.error('❌ AuthContext: Select business error:', error);
    }
  }, [state.user]);

  // Refresh businesses function
  const refreshBusinesses = useCallback(async () => {
    try {
      if (!state.user) {
        console.log('🔍 AuthContext: RefreshBusinesses - No user found');
        return;
      }

      console.log('🔍 AuthContext: RefreshBusinesses - Starting refresh for user:', state.user.email);
      const businessRelationships = await DatabaseService.getUserBusinessRelationships(state.user.id);
      const businesses = businessRelationships.allBusinesses;

      console.log('🔍 AuthContext: RefreshBusinesses - Found businesses:', businesses.map(b => b.name));
      console.log('🔍 AuthContext: RefreshBusinesses - Business count:', businesses.length);

      // If user has exactly one business, set it as current business
      if (businesses.length === 1) {
        console.log('🔍 AuthContext: RefreshBusinesses - Auto-selecting single business:', businesses[0].name);
        await DatabaseService.setCurrentBusiness(businesses[0]);
      }

      dispatch({
        type: 'REFRESH_BUSINESSES',
        payload: { businesses }
      });

      console.log('🔍 AuthContext: RefreshBusinesses - Dispatch completed');
    } catch (error) {
      console.error('❌ AuthContext: Refresh businesses error:', error);
    }
  }, [state.user]);

  // Simple logout function
  const logout = useCallback(async () => {
    try {
      // Clear database session
      await DatabaseService.clearCurrentSession();

      // Clear auth service storage
      await AuthService.logout();

      // Dispatch logout (this will trigger navigation reset automatically)
      dispatch({ type: 'LOGOUT' });
    } catch (error) {
      console.error('Logout error:', error);
      // Still dispatch logout even if there's an error
      dispatch({ type: 'LOGOUT' });
    }
  }, []);

  // Update user function - use useCallback to prevent re-creation
  const updateUser = useCallback((user: User) => {
    dispatch({ type: 'UPDATE_USER', payload: user });
  }, []);

  // Permission check functions - simplified to prevent re-renders
  const hasPermission = useCallback((action: 'view_statistics' | 'delete_transactions' | 'manage_team' | 'add_transactions') => {
    const userRole = state.currentUserRole;
    if (!userRole) return false;

    if (action === 'add_transactions') return true;
    if (action === 'view_statistics') return userRole === 'OWNER';
    if (action === 'manage_team') return userRole === 'OWNER';
    if (action === 'delete_transactions') return userRole === 'OWNER' || userRole === 'MANAGER';

    return false;
  }, [state.currentUserRole]);

  const isBusinessOwner = useCallback(() => {
    return state.currentUserRole === 'OWNER';
  }, [state.currentUserRole]);

  const isTeamMember = useCallback(() => {
    return state.currentUserRole && state.currentUserRole !== 'OWNER';
  }, [state.currentUserRole]);

  const contextValue: AuthContextType = {
    state,
    login,
    signup,
    signInWithApple,
    signInWithGoogle,
    signInWithGoogleEmail,
    signInWithAppleEmail,
    logout,
    updateUser,
    selectBusiness,
    refreshBusinesses,
    hasPermission,
    isBusinessOwner,
    isTeamMember,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook to use auth context
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
