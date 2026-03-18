// src/context/AuthContext.js
import { createContext, useContext, useEffect , useMemo, useCallback, useReducer} from 'react';

export const AuthContext = createContext();

const initialState = {
  user: null,
  token: null,
  loading: true,
};

function authReducer(state, action) {
  switch (action.type) {
    case 'RESTORE_SESSION':
      return { 
        ...state, 
        user: action.payload.user, 
        token: action.payload.token, 
        loading: false 
      };
    case 'LOGIN':
      return { 
        ...state, 
        user: action.payload.user,
        token: action.payload.token
      };
    case 'LOGOUT':
      return { 
        ...state, 
        user: null,
        token: null,
        loading: false
      };
    case 'UPDATE_USER':
      return { 
        ...state, 
        user: action.payload 
      };
    default:
      throw new Error(`Unhandled action type: ${action.type}`);
  }
}

export const AuthProvider = ({ children }) => {
  const [state, dispatch]  = useReducer(authReducer, initialState);

  // On mount, load user and token from localStorage
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    const savedToken = localStorage.getItem('token');

    dispatch({
      type: 'RESTORE_SESSION',
      payload: {
        user: savedUser ? JSON.parse(savedUser) : null,
        token: savedToken || null
      }
    });
  }, []);

  // Update login to handle both user and token
  const login = useCallback((userData, tokenData) => {
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('token', tokenData);
    dispatch({
      type: 'LOGIN',
      payload: { user: userData, token: tokenData }
    });
  }, []);

  // Update logout to clear both user and token
  const logout = useCallback(() => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    dispatch({ type: 'LOGOUT' });
  }, []);

  const updateUser = useCallback((newUserData) => {
    localStorage.setItem('user', JSON.stringify(newUserData));
    dispatch({ type: 'UPDATE_USER', payload: newUserData});
  }, []);

  const value = useMemo(() => ({
    ...state,
    login,
    logout, 
    updateUser,
  }), [state, login, logout, updateUser]);

  // Provide the token in the context value
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}