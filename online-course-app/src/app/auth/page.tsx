'use client';

import React, { useState} from "react";
import { useRouter } from "next/navigation";

const Auth = () => {
    const router = useRouter();
    const [isLoginView, setIsLoginView] = useState(true);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({
        full_name:'',
        email: '',
        password: '',
        confirmPassword: '',
        role: 'student'
    });

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
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
              

              document.cookie = `token=${data.token}; path=/; max-age=${60 * 60 * 24}`

              if (data.dashboardPath) {
                router.push(data.dashboardPath);
              }
              else if (data.user && data.user.role) {
                const dashboardPath = data.user.role === '2' ? '/teacher-dashboard' : '/student-dashboard';
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
                    confirmPassword:''
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

    return (
        <div className="min h-screen flex items-center justify-center bg-gray-50 dark:bg-black py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
                <div>
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
                        {isLoginView ? 'Sign in to your account' : 'Create a new account'}
                    </h2>
                </div>

                {error && (
                    <div className="bg-red-100 dark:bg-red-900 border border-red-400 text-red-700 dark:text-red-200 px-4 py-3 rounded relative" role="alert">
                        <span className="block sm:inline">{error}</span>
                    </div>
                )}

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
                                    </select>
                                </div>
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

                {isLoginView && (
                    <div className="text-center">
                        <a href="#" className="text-sm text-primary hover:text-secondary dark:text-tertiary-light dark:hover:text-tertiary-dark">
                            Forgot your password?
                        </a>
                    </div>
                )}

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
                                role:'student'
                            });
                        }} 
                    >
                        {isLoginView ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Auth;