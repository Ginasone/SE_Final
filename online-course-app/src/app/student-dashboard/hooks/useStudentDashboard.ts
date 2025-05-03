/**
 * Student Dashboard Custom Hook
 * 
 * Implements the Custom Hook pattern for React to manage student dashboard data.
 * Centralizes all data fetching, state management, and API interactions for the dashboard.
 * 
 * @author Nadia
 * @version 1.0.0
 */

import { useState, useEffect, useCallback, useRef } from 'react';

// Define TypeScript interfaces for type safety and better intellisense
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

export interface ApiError {
  message: string;
  code: string;
}

export interface StudentDashboardData {
  profile: StudentProfile | null;
  stats: DashboardStats;
  courses: Course[];
  notifications: Notification[];
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
}

export interface StudentDashboardHook extends StudentDashboardData {
  // Data manipulation methods
  markNotificationAsRead: (notificationId: number) => Promise<boolean>;
  dismissAllNotifications: () => Promise<boolean>;
  refreshData: () => Promise<void>;
  refreshCourses: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
  
  // Course actions
  viewCourseDetails: (courseId: number) => void;
  
  // UI state helpers
  hasUnreadNotifications: boolean;
  activeCourses: Course[];
  completedCourses: Course[];
  upcomingDeadlines: Array<{ courseId: number, title: string, dueDate: string }>;
}

/**
 * Custom hook for the student dashboard
 * Implements comprehensive state management and API interactions
 * 
 * @param {number|null} studentId - The student ID or null if not authenticated
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
  
  // References to track mounted state and prevent state updates after unmount
  const isMounted = useRef(true);
  
  // Cache for storing JWT token
  const getAuthToken = useCallback(() => {
    // In a real app with proper auth, you'd get this from context or storage
    return localStorage.getItem('auth_token') || '';
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
      const response = await fetch(url, {
        ...options,
        headers: {
          ...getRequestHeaders(),
          ...(options.headers || {})
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error?.message || 
          `API error: ${response.status} ${response.statusText}`
        );
      }
      
      return await response.json() as T;
    } catch (err) {
      console.error(`API request error: ${url}`, err);
      throw err;
    }
  }, [getRequestHeaders]);
  
  /**
   * Fetch student profile and dashboard stats
   */
  const fetchProfileAndStats = useCallback(async () => {
    if (!studentId) return;
    
    try {
      const data = await apiRequest<{
        profile: StudentProfile;
        stats: DashboardStats;
      }>(`/api/student?studentId=${studentId}`);
      
      if (isMounted.current) {
        setProfile(data.profile);
        setStats(data.stats);
      }
      
      return data;
    } catch (err) {
      if (isMounted.current) {
        setError(err instanceof Error ? err.message : 'Failed to load profile data');
      }
      throw err;
    }
  }, [studentId, apiRequest]);
  
  /**
   * Fetch enrolled courses
   */
  const fetchCourses = useCallback(async () => {
    if (!studentId) return [];
    
    try {
      const data = await apiRequest<Course[]>(`/api/student/courses?studentId=${studentId}`);
      
      if (isMounted.current) {
        setCourses(data);
      }
      
      return data;
    } catch (err) {
      if (isMounted.current) {
        setError(err instanceof Error ? err.message : 'Failed to load course data');
      }
      throw err;
    }
  }, [studentId, apiRequest]);
  
  /**
   * Fetch notifications
   */
  const fetchNotifications = useCallback(async (limit: number = 10) => {
    if (!studentId) return [];
    
    try {
      const data = await apiRequest<Notification[]>(
        `/api/student/notifications?studentId=${studentId}&limit=${limit}`
      );
      
      if (isMounted.current) {
        setNotifications(data);
      }
      
      return data;
    } catch (err) {
      if (isMounted.current) {
        setError(err instanceof Error ? err.message : 'Failed to load notifications');
      }
      throw err;
    }
  }, [studentId, apiRequest]);
  
  /**
   * Fetch all dashboard data at once
   */
  const fetchAllDashboardData = useCallback(async () => {
    if (!studentId) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Execute requests in parallel for performance
      const [profileData, coursesData, notificationsData] = await Promise.allSettled([
        fetchProfileAndStats(),
        fetchCourses(),
        fetchNotifications()
      ]);
      
      // Check for errors
      const errors: string[] = [];
      
      if (profileData.status === 'rejected') {
        errors.push('Failed to load profile data');
      }
      
      if (coursesData.status === 'rejected') {
        errors.push('Failed to load course data');
      }
      
      if (notificationsData.status === 'rejected') {
        errors.push('Failed to load notifications');
      }
      
      if (errors.length > 0 && isMounted.current) {
        setError(errors.join(', '));
      } else if (isMounted.current) {
        setError(null);
      }
    } catch (err) {
      if (isMounted.current) {
        setError('Failed to load dashboard data');
      }
    } finally {
      if (isMounted.current) {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    }
  }, [studentId, fetchProfileAndStats, fetchCourses, fetchNotifications]);
  
  /**
   * Refresh all dashboard data
   */
  const refreshData = useCallback(async () => {
    if (!studentId) return;
    
    setIsRefreshing(true);
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
    try {
      // This assumes you have an API endpoint for this operation
      // If not, you'd need to make multiple requests
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
  
  /**
   * Navigate to course details
   * This would typically use router in a real app
   */
  const viewCourseDetails = useCallback((courseId: number) => {
    // In a real app with Next.js router:
    // router.push(`/student/courses/${courseId}`);
    console.log(`Navigate to course: ${courseId}`);
    
    // For demo purposes, just log the action
    window.location.href = `/student/courses/${courseId}`;
  }, []);
  
  // Initial data loading
  useEffect(() => {
    if (studentId) {
      fetchAllDashboardData();
    }
    
    // Cleanup function for unmounting
    return () => {
      isMounted.current = false;
    };
  }, [studentId, fetchAllDashboardData]);
  
  // Computed properties
  const hasUnreadNotifications = notifications.some(notification => !notification.is_read);
  
  const activeCourses = courses.filter(course => 
    course.enrollment_status === 'active' && course.progress < 100
  );
  
  const completedCourses = courses.filter(course => 
    course.enrollment_status === 'completed' || course.progress === 100
  );
  
  // This would need real assignment data in a full implementation
  const upcomingDeadlines: Array<{ courseId: number, title: string, dueDate: string }> = [];
  
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
    
    // Data actions
    markNotificationAsRead,
    dismissAllNotifications,
    refreshData,
    refreshCourses,
    refreshNotifications,
    viewCourseDetails,
    
    // Computed properties
    hasUnreadNotifications,
    activeCourses,
    completedCourses,
    upcomingDeadlines
  };
}

export default useStudentDashboard;