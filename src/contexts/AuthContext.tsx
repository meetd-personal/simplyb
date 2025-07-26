import React, { createContext, useContext, useReducer, useEffect, ReactNode, useCallback } from 'react';
import { AuthState, User, LoginCredentials, SignupData } from '../types';
import { Business } from '../types/database';
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
  | { type: 'SELECT_BUSINESS'; payload: { business: Business; userRole: BusinessRole | null } }
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
      console.log('🔍 AuthContext Reducer: Processing LOGIN_SUCCESS with needsBusinessSelection:', action.payload.needsBusinessSelection);
      console.log('🔍 AuthContext Reducer: Setting isAuthenticated to:', !action.payload.needsBusinessSelection);
      return {
        ...state,
        isAuthenticated: !action.payload.needsBusinessSelection,
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
      };
    case 'REFRESH_BUSINESSES':
      return {
        ...state,
        businesses: action.payload.businesses,
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

  // Initialize auth state on app start
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const result = await AuthService.initializeAuth();

        if (result.success && result.user && result.token) {
          const businesses = result.businesses || [];
          const needsBusinessSelection = businesses.length > 0;

          console.log('🔍 AuthContext: Initialize auth success with needsBusinessSelection:', needsBusinessSelection);

          const authState: AuthState = {
            isAuthenticated: !needsBusinessSelection,
            user: result.user,
            token: result.token,
            businesses,
            currentBusiness: null,
            currentUserRole: null,
            needsBusinessSelection
          };

          dispatch({ type: 'INITIALIZE', payload: authState });
        } else {
          console.log('🔍 AuthContext: Initialize auth failed, showing login');
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
        console.error('Auth initialization error:', error);
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
        // Need business selection if user has any businesses (owned or member)
        // If no businesses at all, they'll go to business onboarding flow
        const needsBusinessSelection = businesses.length > 0;

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
        // Always require business selection, even for single business
        const needsBusinessSelection = businesses.length > 0;

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
        const needsBusinessSelection = businesses.length > 0;

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
        const needsBusinessSelection = businesses.length > 0;

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
        const needsBusinessSelection = businesses.length > 0;

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

      await DatabaseService.setCurrentBusiness(business);

      // Get user's role in this business
      const memberships = await DatabaseService.getUserBusinessMemberships(state.user.id);
      const membership = memberships.find(m => m.businessId === business.id && m.isActive);
      const userRole = membership?.role || null;

      dispatch({
        type: 'SELECT_BUSINESS',
        payload: {
          business,
          userRole
        }
      });
    } catch (error) {
      console.error('Select business error:', error);
    }
  }, [state.user]);

  // Refresh businesses function
  const refreshBusinesses = useCallback(async () => {
    try {
      if (!state.user) {
        return;
      }

      const businessRelationships = await DatabaseService.getUserBusinessRelationships(state.user.id);
      const businesses = businessRelationships.allBusinesses;

      dispatch({
        type: 'REFRESH_BUSINESSES',
        payload: { businesses }
      });
    } catch (error) {
      console.error('Refresh businesses error:', error);
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
