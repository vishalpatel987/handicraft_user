// Authentication utility functions
import { toast } from 'react-hot-toast';

export const authUtils = {
    // Check if token is expired
    isTokenExpired(token) {
        if (!token) return true;
        
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            const currentTime = Date.now() / 1000;
            return payload.exp < currentTime;
        } catch (error) {
            return true;
        }
    },

    // Clear auth data
    clearAuthData() {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('admin_logged_in');
        localStorage.removeItem('admin_user');
    },

    // Handle auth errors
    handleAuthError(error, redirectToLogin = true) {
        console.error('Auth error:', error);
        
        if (error.message === 'Session expired. Please login again.' || 
            error.message.includes('Invalid token') ||
            error.message.includes('jwt expired')) {
            
            this.clearAuthData();
            toast.error('Your session has expired. Please login again.');
            
            if (redirectToLogin) {
                // Small delay to show the toast
                setTimeout(() => {
                    window.location.href = '/login';
                }, 1500);
            }
            
            return true; // Indicates auth error was handled
        }
        
        return false; // Auth error was not handled
    },

    // Get token from localStorage
    getToken() {
        return localStorage.getItem('token');
    },

    // Get user from localStorage
    getUser() {
        try {
            const user = localStorage.getItem('user');
            return user ? JSON.parse(user) : null;
        } catch (error) {
            console.error('Error parsing user data:', error);
            this.clearAuthData();
            return null;
        }
    },

    // Check if user is authenticated
    isAuthenticated() {
        const token = this.getToken();
        const user = this.getUser();
        
        if (!token || !user) return false;
        
        // Check if token is expired
        if (this.isTokenExpired(token)) {
            this.clearAuthData();
            return false;
        }
        
        return true;
    },

    // Get auth headers for API requests
    getAuthHeaders() {
        const token = this.getToken();
        const headers = {
            'Content-Type': 'application/json',
        };
        
        if (token && !this.isTokenExpired(token)) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        
        return headers;
    }
};

export default authUtils;
