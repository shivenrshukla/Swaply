import { createContext, useCallback, useContext, useMemo, useReducer } from "react";

// Create context for navigation state
const NavigationContext = createContext();

// Initial state for navigation
const initialNavigationState = {
    currentPage: 'home',
    pageParams: null,
};

// Reducer function to manage navigation state
function navigationReducer(state, action) {
    switch (action.type) {
        case 'NAVIGATE':
            return {
                currentPage: action.payload.page,
                pageParams: action.payload.params ?? null
            };

        case 'RESET':
            return initialNavigationState;

        default:
            return state;
    }
}

// NavigationProvider component to wrap the app and provide navigation state
export function NavigationProvider({ children }) {
    const [state, dispatch] = useReducer(navigationReducer, initialNavigationState);

    const navigate = useCallback((page, params = null) => {
        dispatch({
            type: 'NAVIGATE',
            payload: { page, params }
        });
    }, []);

    const value = useMemo(() => ({
        currentPage: state.currentPage,
        pageParams: state.pageParams,
        navigate
    }), [state.currentPage, state.pageParams, navigate]);

    return (
        <NavigationContext.Provider value={value}>
            {children}
        </NavigationContext.Provider>
    );
}

// useNavigation hook for access to navigation context
export function useNavigation() {
    const context = useContext(NavigationContext);
    if (!context) {
        throw new Error('useNavigation must be used within a NavigationProvider');
    }
    return context;
}
