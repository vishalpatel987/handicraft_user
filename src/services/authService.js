import config from '../config/config.js';

export const authService = {
    async register(userData) {
        try {
        const response = await fetch(`${config.API_URLS.AUTH}/register`, {
            method: 'POST',
            headers: config.CORS.HEADERS,
                credentials: 'include',
            body: JSON.stringify(userData),
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Registration failed');
        }
        
        return response.json();
        } catch (error) {
            console.error('Registration error:', error);
            throw error;
        }
    },

    async login(credentials) {
        try {
        const response = await fetch(`${config.API_URLS.AUTH}/login`, {
            method: 'POST',
            headers: config.CORS.HEADERS,
            credentials: 'include',
            body: JSON.stringify({ identifier: credentials.identifier, password: credentials.password }),
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Login failed');
        }
        
        return response.json();
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    },

    async getCurrentUser() {
        try {
            const token = localStorage.getItem('token');
            const headers = {
                ...config.CORS.HEADERS,
            };
            
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }
            
        const response = await fetch(`${config.API_URLS.AUTH}/me`, {
                headers,
                credentials: 'include',
        });
        
        if (!response.ok) {
            if (response.status === 401) {
                // Token expired, clear auth data
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                throw new Error('Session expired. Please login again.');
            }
            const error = await response.json();
            throw new Error(error.message || 'Failed to get user data');
        }
        
        return response.json();
        } catch (error) {
            console.error('Get current user error:', error);
            throw error;
        }
    },

    async logout() {
        try {
        const response = await fetch(`${config.API_URLS.AUTH}/logout`, {
            method: 'POST',
                credentials: 'include',
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to logout');
        }
        
        return response.json();
        } catch (error) {
            console.error('Logout error:', error);
            throw error;
        }
    },

    async updateProfile(userData) {
        try {
            // Check if token is expired before making request
            if (this.isTokenExpired()) {
                throw new Error('Session expired. Please login again.');
            }

            const token = localStorage.getItem('token');
            const headers = {
                ...config.CORS.HEADERS,
            };
            
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }
            
            const response = await fetch(`${config.API_URLS.AUTH}/update-profile`, {
                method: 'PUT',
                headers,
                credentials: 'include',
                body: JSON.stringify(userData),
            });
            
            if (!response.ok) {
                if (response.status === 401) {
                    // Token expired, clear auth data and redirect to login
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    throw new Error('Session expired. Please login again.');
                }
                const error = await response.json();
                throw new Error(error.message || 'Failed to update profile');
            }
            
            return response.json();
        } catch (error) {
            console.error('Update profile error:', error);
            throw error;
        }
    },

    async forgotPassword(email) {
        try {
            const response = await fetch(`${config.API_URLS.AUTH}/forgot-password`, {
                method: 'POST',
                headers: config.CORS.HEADERS,
                credentials: 'include',
                body: JSON.stringify({ email }),
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to send reset link');
            }
            
            return response.json();
        } catch (error) {
            console.error('Forgot password error:', error);
            throw error;
        }
    },

    async verifyOTP({ email, otp }) {
        try {
            const response = await fetch(`${config.API_URLS.AUTH}/verify-otp`, {
                method: 'POST',
                headers: config.CORS.HEADERS,
                credentials: 'include',
                body: JSON.stringify({ email, otp }),
            });
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'OTP verification failed');
            }
            return response.json();
        } catch (error) {
            console.error('OTP verification error:', error);
            throw error;
        }
    },

    isAuthenticated() {
        const token = localStorage.getItem('token');
        return !!token;
    },

    // Check if token is expired
    isTokenExpired() {
        const token = localStorage.getItem('token');
        if (!token) return true;
        
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            const currentTime = Date.now() / 1000;
            return payload.exp < currentTime;
        } catch (error) {
            return true;
        }
    },

    // Refresh token by getting new user data
    async refreshToken() {
        try {
            const response = await this.getCurrentUser();
            return response;
        } catch (error) {
            // If refresh fails, clear auth data
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            throw new Error('Session expired. Please login again.');
        }
    },

    async verifyForgotOtp(email, otp, newPassword) {
        try {
            const response = await fetch(`${config.API_URLS.AUTH}/verify-forgot-otp`, {
                method: 'POST',
                headers: config.CORS.HEADERS,
                credentials: 'include',
                body: JSON.stringify({ email, otp, newPassword }),
            });
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to reset password');
            }
            return response.json();
        } catch (error) {
            console.error('Forgot OTP verification error:', error);
            throw error;
        }
    }
}; 