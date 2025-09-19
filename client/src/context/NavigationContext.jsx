import { createContext, useContext, useState } from "react";

const NavigationContext = createContext();

export function NavigationProvider({ children }) {
    const [currentPage, setCurrentPage] = useState("home");
    const [pageParams, setPageParams] = useState(null);

    const navigate = (page, params = null) => {
        setCurrentPage(page);
        setPageParams(params);
    };

    return (
        <NavigationContext.Provider value={{ 
            currentPage, 
            setCurrentPage, 
            pageParams,
            setPageParams,
            navigate 
        }}>
            {children}
        </NavigationContext.Provider>
    );
}

export function useNavigation() {
    return useContext(NavigationContext);
}
