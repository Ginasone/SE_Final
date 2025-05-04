/**
 * Student Dashboard Custom Hook
 * 
 * Implements the Custom Hook pattern for React to manage student dashboard data.
 * Centralizes all data fetching, state management, and API interactions for the dashboard.
 * 
 * @author Nadia
 */

import { useState, useEffect, useCallback, useRef } from 'react';

// Define TypeScript interfaces for type safety
export interface StudentProfile {
  id: number;
  full_name: string;
  email: string;
  profile_picture: string | null;
  status: string;
  school_name: string | null;
  school_location: string | null;
}

export interface DashboardStats {
  coursesCount: number;
  notificationsCount: number;
}

export interface Course {
  id: number;
  title: string;
  description: string;
  thumbnail: string | null;
  start_date: string;
  end_date: string;
  status: string;
  difficulty_level: string | null;
  school_name: string | null;
  teacher_name: string | null;
  enrollment_status: string;
  total_lessons: number;
  completed_lessons: number;
  progress: number;
}

export interface Notification {
  id: number;
  message: string;
  is_read: boolean;
  created_at: string;
  course_id: number | null;
  course_title: string | null;
}

export interface StudentDashboardData {
  profile: StudentProfile | null;
  stats: DashboardStats;
  courses: Course[];
  notifications: Notification[];
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  authError: boolean;
}

export interface StudentDashboardHook extends StudentDashboardData {
  markNotificationAsRead: (notificationId: number) => Promise<boolean>;
  dismissAllNotifications: () => Promise<boolean>;
  refreshData: () => Promise<void>;
  refreshCourses: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
  hasUnreadNotifications: boolean;
}

/**
 * Custom hook for the student dashboard with authentication awareness
 * 
 * @param {number|null} studentId - The student ID or null if not yet authenticated
 * @returns {StudentDashboardHook} - Dashboard data and interaction methods
 */
export function useStudentDashboard(studentId: number | null): StudentDashboardHook {
  // State management
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [stats, setStats] = useState<DashboardStats>({ coursesCount: 0, notificationsCount: 0 });
  const [courses, setCourses] = useState<Course[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [authError, setAuthError] = useState<boolean>(false);
  
  // References to track mounted state
  const isMounted = useRef(true);
  
  /**
   * Get authentication token from localStorage
   */
  const getAuthToken = useCallback(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('user-token') || '';
    }
    return '';
  }, []);
  
  /**
   * Default request headers with auth token
   */
  const getRequestHeaders = useCallback(() => {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getAuthToken()}`
    };
  }, [getAuthToken]);
  
  /**
   * Generic API request handler with error handling
   */
  const apiRequest = useCallback(async <T>(
    url: string, 
    options: RequestInit = {}
  ): Promise<T> => {
    try {
      console.log(`Making API request to ${url}`);
      const response = await fetch(url, {
        ...options,
        headers: {
          ...getRequestHeaders(),
          ...(options.headers || {})
        }
      });
      
      if (!response.ok) {
        // Handle authentication errors specifically
        if (response.status === 401) {
          setAuthError(true);
          console.error(`Authentication error (401) from ${url}`);
          throw new Error('Authentication failed. Please log in again.');
        }
        
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error?.message || errorData.message || 
                           `API error: ${response.status} ${response.statusText}`;
        console.error(`API error from ${url}: ${errorMessage}`);
        throw new Error(errorMessage);
      }
      
      const data = await response.json() as T;
      console.log(`API response from ${url}:`, data);
      return data;
    } catch (err) {
      console.error(`API request error: ${url}`, err);
      throw err;
    }
  }, [getRequestHeaders]);
  
  /**
   * Fetch student profile and dashboard stats
   */
  const fetchProfileAndStats = useCallback(async () => {
    if (!studentId) {
      console.log("No student ID provided for profile fetch");
      return null;
    }
    
    try {
      console.log(`Fetching profile for student ID: ${studentId}`);
      const data = await apiRequest<{
        profile: StudentProfile;
        stats: DashboardStats;
      }>(`/api/student?studentId=${studentId}`);
      
      if (isMounted.current) {
        console.log("Setting profile data:", data.profile);
        if (data.profile) {
          setProfile(data.profile);
          setStats(data.stats);
        } else {
          throw new Error(`No profile found for student ID: ${studentId}`);
        }
      }
      
      return data;
    } catch (err) {
      console.error("Error fetching profile:", err);
      if (isMounted.current) {
        setError(err instanceof Error ? err.message : 'Failed to load profile data');
      }
      // Don't throw here to avoid breaking Promise.allSettled
      return null;
    }
  }, [studentId, apiRequest]);
  
  /**
   * Fetch enrolled courses
   */
  const fetchCourses = useCallback(async () => {
    if (!studentId) {
      console.log("No student ID provided for courses fetch");
      return [];
    }
    
    try {
      console.log(`Fetching courses for student ID: ${studentId}`);
      const data = await apiRequest<Course[]>(`/api/student/courses?studentId=${studentId}`);
      
      if (isMounted.current) {
        console.log(`Received ${data.length} courses`);
        setCourses(data);
      }
      
      return data;
    } catch (err) {
      console.error("Error fetching courses:", err);
      if (isMounted.current) {
        // Set courses to empty array on error rather than leaving undefined
        setCourses([]);
        setError(err instanceof Error ? err.message : 'Failed to load course data');
      }
      // Return empty array instead of throwing
      return [];
    }
  }, [studentId, apiRequest]);
  
  /**
   * Fetch notifications
   */
  const fetchNotifications = useCallback(async (limit: number = 10) => {
    if (!studentId) {
      console.log("No student ID provided for notifications fetch");
      return [];
    }
    
    try {
      console.log(`Fetching notifications for student ID: ${studentId}`);
      const data = await apiRequest<Notification[]>(
        `/api/student/notifications?studentId=${studentId}&limit=${limit}`
      );
      
      if (isMounted.current) {
        console.log(`Received ${data.length} notifications`);
        setNotifications(data);
      }
      
      return data;
    } catch (err) {
      console.error("Error fetching notifications:", err);
      if (isMounted.current) {
        // Set notifications to empty array on error
        setNotifications([]);
        setError(err instanceof Error ? err.message : 'Failed to load notifications');
      }
      // Return empty array instead of throwing
      return [];
    }
  }, [studentId, apiRequest]);
  
  /**
   * Fetch all dashboard data at once
   */
  const fetchAllDashboardData = useCallback(async () => {
    if (!studentId) {
      console.log("No student ID provided, skipping dashboard data fetch");
      setIsLoading(false); // Important: exit loading state even when no studentId
      return;
    }
    
    console.log(`Fetching all dashboard data for student ID: ${studentId}`);
    setIsLoading(true);
    setError(null);
    
    try {
      // Execute requests in parallel for performance
      console.log("Making parallel API requests for dashboard data");
      const [profileData, coursesData, notificationsData] = await Promise.allSettled([
        fetchProfileAndStats(),
        fetchCourses(),
        fetchNotifications()
      ]);
      
      console.log("API response statuses:", {
        profile: profileData.status, 
        courses: coursesData.status, 
        notifications: notificationsData.status
      });
      
      // Check for errors but don't throw - just log and update state
      const errors: string[] = [];
      
      if (profileData.status === 'rejected') {
        console.error("Profile data fetch failed:", profileData.reason);
        errors.push('Failed to load profile data');
      } else if (profileData.value) {
        console.log("Profile data fetch succeeded");
      }
      
      if (coursesData.status === 'rejected') {
        console.error("Course data fetch failed:", coursesData.reason);
        errors.push('Failed to load course data');
      } else {
        console.log("Course data fetch succeeded:", 
          coursesData.value ? `${coursesData.value.length} courses` : "No courses found");
      }
      
      if (notificationsData.status === 'rejected') {
        console.error("Notifications fetch failed:", notificationsData.reason);
        errors.push('Failed to load notifications');
      } else {
        console.log("Notifications fetch succeeded:", 
          notificationsData.value ? `${notificationsData.value.length} notifications` : "No notifications found");
      }
      
      if (errors.length > 0 && isMounted.current) {
        console.warn("Setting error state:", errors.join(', '));
        setError(errors.join(', '));
      } else if (isMounted.current) {
        console.log("Clearing error state - all fetches successful or with valid empty results");
        setError(null);
      }
    } catch (err) {
      console.error("Unexpected error in fetchAllDashboardData:", err);
      if (isMounted.current) {
        setError('Failed to load dashboard data');
      }
    } finally {
      // Most important part: Always exit loading state
      if (isMounted.current) {
        console.log("Setting loading state to false");
        setIsLoading(false);
        setIsRefreshing(false);
      }
    }
  }, [studentId, fetchProfileAndStats, fetchCourses, fetchNotifications]);
  
  /**
   * Force exit loading state after timeout - FIXED
   * This ensures we don't get stuck in infinite loading state
   */
  useEffect(() => {
    // Safety mechanism to prevent indefinite loading
    const loadingTimeout = setTimeout(() => {
      if (isLoading && isMounted.current) {
        console.warn("Loading timeout triggered - forcing exit from loading state");
        setIsLoading(false);
        // Only set error if none exists already
        if (!error && isMounted.current) {
          setError("Loading timed out. Please try refreshing or check your internet connection.");
        }
      }
    }, 10000); // 10 seconds timeout
    
    return () => clearTimeout(loadingTimeout);
  }, [isLoading, error]);
  
  /**
   * Refresh all dashboard data
   */
  const refreshData = useCallback(async () => {
    if (!studentId) return;
    
    setIsRefreshing(true);
    setError(null); // Clear any previous errors
    await fetchAllDashboardData();
  }, [studentId, fetchAllDashboardData]);
  
  /**
   * Refresh only course data
   */
  const refreshCourses = useCallback(async () => {
    if (!studentId) return;
    
    setIsRefreshing(true);
    
    try {
      await fetchCourses();
    } finally {
      setIsRefreshing(false);
    }
  }, [studentId, fetchCourses]);
  
  /**
   * Refresh only notifications
   */
  const refreshNotifications = useCallback(async () => {
    if (!studentId) return;
    
    setIsRefreshing(true);
    
    try {
      await fetchNotifications();
    } finally {
      setIsRefreshing(false);
    }
  }, [studentId, fetchNotifications]);
  
  /**
   * Mark a notification as read
   */
  const markNotificationAsRead = useCallback(async (notificationId: number): Promise<boolean> => {
    try {
      await apiRequest('/api/student/notifications', {
        method: 'PATCH',
        body: JSON.stringify({ notificationId })
      });
      
      if (isMounted.current) {
        // Update local state (optimistic update)
        setNotifications(prevNotifications => 
          prevNotifications.map(notification => 
            notification.id === notificationId 
              ? { ...notification, is_read: true } 
              : notification
          )
        );
        
        // Update unread notification count
        setStats(prevStats => ({
          ...prevStats,
          notificationsCount: Math.max(0, prevStats.notificationsCount - 1)
        }));
      }
      
      return true;
    } catch (err) {
      console.error('Error marking notification as read:', err);
      return false;
    }
  }, [apiRequest]);
  
  /**
   * Mark all notifications as read
   */
  const dismissAllNotifications = useCallback(async (): Promise<boolean> => {
    if (!studentId) return false;
    
    try {
      // This assumes you have an API endpoint for this operation
      await apiRequest('/api/student/notifications/dismiss-all', {
        method: 'POST',
        body: JSON.stringify({ studentId })
      });
      
      if (isMounted.current) {
        // Update local state
        setNotifications(prevNotifications => 
          prevNotifications.map(notification => ({ ...notification, is_read: true }))
        );
        
        // Reset notification count
        setStats(prevStats => ({
          ...prevStats,
          notificationsCount: 0
        }));
      }
      
      return true;
    } catch (err) {
      console.error('Error dismissing all notifications:', err);
      return false;
    }
  }, [apiRequest, studentId]);
  
  // Initial data loading - only fetch when we have a valid studentId
  useEffect(() => {
    console.log("useEffect triggered with studentId:", studentId);
    
    // Only fetch data if there is a valid student ID
    if (studentId) {
      fetchAllDashboardData();
    } else {
      // If no student ID, exit loading state to prevent spinner
      setIsLoading(false);
    }
    
    // Cleanup function for unmounting
    return () => {
      console.log("Unmounting useStudentDashboard");
      isMounted.current = false;
    };
  }, [studentId, fetchAllDashboardData]);
  
  // Computed properties
  const hasUnreadNotifications = notifications.some(notification => !notification.is_read);
  
  // Return all data and methods
  return {
    // State data
    profile,
    stats,
    courses,
    notifications,
    isLoading,
    isRefreshing,
    error,
    authError,
    
    // Data actions
    markNotificationAsRead,
    dismissAllNotifications,
    refreshData,
    refreshCourses,
    refreshNotifications,
    
    // Computed properties
    hasUnreadNotifications
  };
}