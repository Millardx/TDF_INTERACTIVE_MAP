// AuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import {jwtDecode} from 'jwt-decode'; // jwtDecode doesn't need curly braces
import axios from 'axios';
import { useNavigate } from 'react-router-dom'; // Assuming you use React Router
import {API_URL} from '/src/config'; // Import the API_URL constant

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const navigate = useNavigate();


        // Function to check and decode the token if it exist will direct to map page
        const checkToken = () => {
            const token = localStorage.getItem('token');
            if (!token) return;
    
            try {
                const decodedUser = jwtDecode(token);
                const currentTime = Date.now() / 1000; // Current time in seconds
    
                // Check if the token is expired
                if (decodedUser.exp < currentTime) {
                    console.warn('Token expired. Logging out.');
                    logout();
                } else {
                    setUser(decodedUser); // Set user if token is valid
                     // Redirect only if the user is on the landing page
                if (window.location.pathname === '/') {
                    navigate('/map'); // Default route for logged-in users
                }
                }
            } catch (error) {
                console.error('Error decoding token:', error);
                logout(); // Logout if decoding fails
            }
        };
        
        useEffect(() => {
            checkToken(); // Check the token on initial load
        }, []);
        

    const logout = async () => {
        const token = localStorage.getItem('token');
    
        if (!token) return; // No token to log out with
    
        try {
            const decodedToken = jwtDecode(token);
            const currentTime = Date.now() / 1000; // Current time in seconds
    
            // If the token is expired, clear storage and handle logout locally
            if (decodedToken.exp < currentTime) {
                console.warn("Token expired. Logging out locally.");
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                setUser(null);
                navigate('/');
                return; // Exit function without making API call
            }
    
            // If the token is valid, make the logout API call
            const response = await axios.post(`${API_URL}/api/auth/logout`, {}, {
                headers: {
                    Authorization: `Bearer ${token}`, // Include the token in the header
                },
            });
            console.log("Logout response:", response.data); // Log the response to see if it's successful
    
            // Clear the token and user data from local storage
            localStorage.removeItem('token');
            localStorage.removeItem('user');
    
            // Reset user state
            setUser(null);
    
            // Redirect the user to the login page
            navigate('/');
        } catch (error) {
            console.error("Error during logout:", error);
        }
    };
    
    

    return (
        <AuthContext.Provider value={{ user, setUser, logout, checkToken }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
