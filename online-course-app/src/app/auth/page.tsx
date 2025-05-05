'use client';

import React, { useState} from "react";
import { useRouter } from "next/navigation";

const Auth = () => {
    const router = useRouter();
    const [isLoginView, setIsLoginView] = useState(true);
    const [isForgotPasswordView, setIsForgotPasswordView] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [formData, setFormData] = useState({
        full_name:'',
        email: '',
        password: '',
        confirmPassword: '',
        role: 'student',
        admin_code: '',
        school_code: ''
    });
    const [showAdminCode, setShowAdminCode] = useState(false);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));

        if (name === 'role' && value === 'admin'){
            setShowAdminCode(true);
        }
        else if (name === 'role' && value !== 'admin'){
            setShowAdminCode(false);
            setFormData(prev => ({
                ...prev,
                admin_code: ''
            }));
        }

        if (error) setError('');
    };

    const validateForm = () =>{
        if (!formData.email || !formData.password) {
            setError('Email and password are required');
            return false;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email)) {
            setError('Please enter a valid email address')
            return false;
        }

        if (formData.password.length < 6) {
            setError('Password must be at least 6 characters long');
            return false;
        }

        if (!isLoginView){
            if (!formData.full_name){
                setError('Full name is required');
                return false;
            }
            if (formData.password !== formData.confirmPassword){
                setError('Passwords do not match');
                return false;
            }
            if (formData.role === 'admin' && !formData.admin_code){
                setError('Admin code is required for admin registration');
                return false;
            }
            if (formData.role !== 'admin' && !formData.school_code){
                setError('School code is required for registration');
                return false;
            }
        }

        return true;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm()) return;

        setLoading(true);
        setError('');

        try {
            if (isLoginView) {
                const response = await fetch('/api/auth/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        email: formData.email,
                        password: formData.password,
                    }),
                });

                const data = await response.json();

                if (!response.ok){
                    throw new Error(data.message || 'Failed to login');
                }
                localStorage.setItem('user-token', data.token);
                if (data.user && data.user.role){
                    localStorage.setItem('user-role', data.user.role);
                }

                if (data.user && data.user.school_id){
                    localStorage.setItem('user-school-id', data.user.school_id.toString());
                    if (data.user.school_name){
                        localStorage.setItem('user-school_name', data.user.school_name);
                    }
                }

                document.cookie = `token=${data.token}; path=/; max-age=${60 * 60 * 24}`

                if (data.dashboardPath) {
                    router.push(data.dashboardPath);
                }
                else if (data.user && data.user.role) {
                    let dashboardPath;
                    switch(data.user.role){
                        case 'admin':
                            dashboardPath = '/admin-dashboard';
                            break;
                        case 'teacher':
                            dashboardPath = '/teacher-dashboard';
                            break;
                        default:
                            dashboardPath = '/student-dashboard';
                    }
                    router.push(dashboardPath);
                }
                else {
                    router.push('/student-dashboard');
                }
            }
            else {
                const response = await fetch('/api/auth/register', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        full_name: formData.full_name,
                        email: formData.email,
                        password: formData.password,
                        role: formData.role,
                        admin_code: formData.admin_code,
                        school_code: formData.school_code
                    }),
                });

                const data = await response.json();

                if (!response.ok){
                    throw new Error(data.message || 'Failed to register');
                }

                setIsLoginView(true);
                setFormData({
                    ...formData,
                    password:'',
                    confirmPassword:'',
                    admin_code: '',
                    school_code: ''
                });
                alert('Registration successful. Please login');
            }
        }
        catch (err){
            setError(err instanceof Error ? err.message : 'An unexpected error occurred');
        }
        finally{
            setLoading(false);
        }
    };
    
    const handleForgotPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!formData.email) {
            setError('Email is required');
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email)) {
            setError('Please enter a valid email address');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const response = await fetch('/api/auth/forgot-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email: formData.email }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to process password reset');
            }

            setSuccessMessage('If your email is registered, you will receive password reset instructions shortly.');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unexpected error occurred');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min h-screen flex items-center justify-center bg-gray-50 dark:bg-black py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
                <div>
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
                        {isForgotPasswordView 
                            ? 'Reset your password' 
                            : (isLoginView ? 'Sign in to your account' : 'Create a new account')}
                    </h2>
                    {isForgotPasswordView && (
                        <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
                            Enter your email address and we&apos;ll send you a link to reset your password.
                        </p>
                    )}
                </div>

                {error && (
                    <div className="bg-red-100 dark:bg-red-900 border border-red-400 text-red-700 dark:text-red-200 px-4 py-3 rounded relative" role="alert">
                        <span className="block sm:inline">{error}</span>
                    </div>
                )}
                
                {successMessage && (
                    <div className="bg-green-100 dark:bg-green-900 border border-green-400 text-green-700 dark:text-green-200 px-4 py-3 rounded relative" role="alert">
                        <span className="block sm:inline">{successMessage}</span>
                    </div>
                )}

                {isForgotPasswordView ? (
                    <form className="mt-8 space-y-6" onSubmit={handleForgotPassword}>
                        <div className="rounded-md shadow-sm space-y-4">
                            <div>
                                <label htmlFor="email" className="sr-only">Email Address</label>
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    required
                                    className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white dark:bg-gray-800 focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm"
                                    placeholder="Email Address"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                />
                            </div>
                        </div>

                        <div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                            >
                                {loading ? (
                                    <>
                                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Processing...
                                    </>
                                ) : (
                                    'Send reset link'
                                )}
                            </button>
                        </div>

                        <div className="text-center">
                            <button
                                type="button"
                                className="text-sm text-primary hover:text-secondary"
                                onClick={() => {
                                    setIsForgotPasswordView(false);
                                    setError('');
                                    setSuccessMessage('');
                                }}
                            >
                                Back to sign in
                            </button>
                        </div>
                    </form>
                ) : (
                    <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                        <div className="rounded-md shadow-sm space-y-4">
                            {!isLoginView && (
                                <>
                                    <div>
                                        <label htmlFor="full_name" className="sr-only">Full Name</label>
                                        <input
                                            id="full_name"
                                            name="full_name"
                                            type="text"
                                            required
                                            className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white dark:bg-gray-800 focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm"
                                            placeholder="Full Name"
                                            value={formData.full_name}
                                            onChange={handleInputChange}
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="role" className="sr-only">Role</label>
                                        <select
                                            id="role"
                                            name="role"
                                            className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white dark:bg-gray-800 focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm"
                                            value={formData.role}
                                            onChange={handleInputChange}
                                        >
                                            <option value="student">Student</option>
                                            <option value="teacher">Teacher</option>
                                            <option value="admin">Admin</option>
                                        </select>
                                    </div>

                                    {showAdminCode && (
                                        <div>
                                            <label htmlFor="admin_code" className="sr-only">Admin Code</label>
                                            <input
                                                id="admin_code"
                                                name="admin_code"
                                                type="text"
                                                required
                                                className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white dark:bg-gray-800 focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm"
                                                placeholder="Admin Registration Code"
                                                value={formData.admin_code}
                                                onChange={handleInputChange}
                                            />
                                        </div>
                                    )}

                                    {!showAdminCode && (
                                        <div>
                                            <label htmlFor="school_code" className="sr-only">School Code</label>
                                            <input
                                                id="school_code"
                                                name="school_code"
                                                type="text"
                                                required
                                                className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white dark:bg-gray-800 focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm"
                                                placeholder="School Access Code"
                                                value={formData.school_code}
                                                onChange={handleInputChange}
                                            />
                                            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                                Enter the access code provided by your school administrator
                                            </p>
                                        </div>
                                    )}
                                </>
                            )}
                            <div>
                                <label htmlFor="email" className="sr-only">Email Address</label>
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    required
                                    className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white dark:bg-gray-800 focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm"
                                    placeholder="Email Address"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                />
                            </div>
                            <div>
                                <label htmlFor="password" className="sr-only">Password</label>
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    autoComplete="current-password"
                                    required
                                    className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white dark:bg-gray-800 focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm"
                                    placeholder="Password"
                                    value={formData.password}
                                    onChange={handleInputChange}
                                />
                            </div>
                            {!isLoginView && (
                                <div>
                                    <label htmlFor="confirmPassword" className="sr-only">Confirm Password</label>
                                    <input
                                        id="confirmPassword"
                                        name="confirmPassword"
                                        type="password"
                                        required
                                        className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white dark:bg-gray-800 focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm"
                                        placeholder="Confirm Password"
                                        value={formData.confirmPassword}
                                        onChange={handleInputChange}
                                    />
                                </div>
                            )}
                        </div>

                        <div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                            >
                                {loading ? (
                                    <>
                                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Processing...
                                    </>
                                ) : (
                                    isLoginView ? 'Sign in' : 'Sign up'
                                )}
                            </button>
                        </div>
                    </form>
                )}

                {isLoginView && !isForgotPasswordView && (
                    <div className="text-center">
                        <button
                            className="text-sm text-primary hover:text-secondary dark:text-tertiary-light dark:hover:text-tertiary-dark"
                            onClick={() => {
                                setIsForgotPasswordView(true);
                                setError('');
                            }}
                        >
                            Forgot your password?
                        </button>
                    </div>
                )}

                {!isForgotPasswordView && (
                    <div className="text-center">
                        <button
                            className="text-sm text-primary hover:text-secondary"
                            onClick={() => {
                                setIsLoginView(!isLoginView);
                                setError('');
                                setFormData({
                                    full_name:'',
                                    email:'',
                                    password:'',
                                    confirmPassword:'',
                                    role:'student',
                                    admin_code: '',
                                    school_code: ''
                                });
                                setShowAdminCode(false);
                            }}
                        >
                            {isLoginView ? "Don&apos;t have an account? Sign up" : "Already have an account? Sign in"}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Auth;