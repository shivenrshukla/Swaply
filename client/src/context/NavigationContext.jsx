import { createContext, use, useContext, useState } from "react";

const NavigationContext = createContext();

export function NavigationProvider({ children }) {
    const [currentPage, setCurrentPage] = useState("home");

    return (
        <NavigationContext.Provider value={{ currentPage, setCurrentPage }}>
            {children}
        </NavigationContext.Provider>
    );
}

export function useNavigation() {
    return useContext(NavigationContext);
}