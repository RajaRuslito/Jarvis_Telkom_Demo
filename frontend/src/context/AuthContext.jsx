import React, { createContext, useState, useContext } from "react";
import axios from "axios";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [user, setUser] = useState(null);

    const login = async (email, password) => {
        try {
            const response = await axios.post("http://localhost:5000/account/login", {
                email,
                password,
            });

            const { token, account } = response.data;
            localStorage.setItem("authToken", token); // Save token to localStorage
            setIsAuthenticated(true);
            setUser(account);
        } catch (error) {
            console.error("Login failed:", error.response?.data?.error || error.message);
            throw error; // Rethrow for error handling in Login component
        }
    };

    const logout = async () => {
        try {
            await axios.post("http://localhost:5000/account/logout");
            localStorage.removeItem("authToken");
            setIsAuthenticated(false);
            setUser(null);
        } catch (error) {
            console.error("Logout failed:", error.response?.data?.error || error.message);
        }
    };

    return (
        <AuthContext.Provider value={{ isAuthenticated, user, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
