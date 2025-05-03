/**
 * Student Service
 * 
 * Implements the Service Layer pattern to handle business logic for student operations.
 * Acts as an intermediary between controllers (API routes) and repositories.
 * 
 * This service applies business rules, data transformations, and coordinates
 * operations that might need multiple repository calls.
 * 
 * @author Nadia
 */

import StudentRepository, { 
    StudentProfile, 
    EnrolledCourse, 
    StudentNotification 
  } from '@/app/repositories/StudentRepository';
  
  // Response types for the service layer
  export interface StudentDashboardStats {
    coursesCount: number;
    notificationsCount: number;
  }
  
  export interface CourseWithProgress extends EnrolledCourse {
    progress: number;
  }
  
  /**
   * StudentService class - Service Layer Pattern Implementation
   * Centralizes business logic for student-related operations
   */
  class StudentService {
    private studentRepository = StudentRepository;
  
    /**
     * Get complete student dashboard data in a single operation
     * This aggregates multiple repository calls for frontend efficiency
     * 
     * @param {number} studentId - The ID of the student
     * @returns {Promise<{ profile: StudentProfile | null, stats: StudentDashboardStats }>}
     */
    async getStudentDashboardData(studentId: number): Promise<{
      profile: StudentProfile | null,
      stats: StudentDashboardStats
    }> {
      try {
        // Execute all promises in parallel for better performance
        const [profile, coursesCount, notificationsCount] = await Promise.all([
          this.studentRepository.getStudentProfile(studentId),
          this.studentRepository.getEnrolledCoursesCount(studentId),
          this.studentRepository.getUnreadNotificationsCount(studentId)
        ]);
  
        return {
          profile,
          stats: {
            coursesCount,
            notificationsCount
          }
        };
      } catch (error) {
        console.error('Error in getStudentDashboardData:', error);
        throw new Error('Failed to fetch student dashboard data');
      }
    }
  
    /**
     * Get enrolled courses with calculated progress percentages
     * Demonstrates business logic in the service layer by calculating
     * the progress percentage for each course
     * 
     * @param {number} studentId - The ID of the student
     * @returns {Promise<CourseWithProgress[]>} Courses with progress information
     */
    async getCoursesWithProgress(studentId: number): Promise<CourseWithProgress[]> {
      try {
        const courses = await this.studentRepository.getEnrolledCourses(studentId);
        
        // Apply business logic to transform repository data
        return courses.map(course => {
          // Calculate progress percentage based on lessons
          const progress = course.total_lessons > 0 
            ? Math.round((course.completed_lessons / course.total_lessons) * 100) 
            : 0;
          
          return {
            ...course,
            progress
          };
        });
      } catch (error) {
        console.error('Error in getCoursesWithProgress:', error);
        throw new Error('Failed to fetch courses with progress');
      }
    }
  
    /**
     * Get student notifications
     * 
     * @param {number} studentId - The ID of the student
     * @param {number} limit - Maximum number of notifications to return
     * @returns {Promise<StudentNotification[]>} Array of notifications
     */
    async getStudentNotifications(studentId: number, limit: number = 10): Promise<StudentNotification[]> {
      try {
        return await this.studentRepository.getStudentNotifications(studentId, limit);
      } catch (error) {
        console.error('Error in getStudentNotifications:', error);
        throw new Error('Failed to fetch student notifications');
      }
    }
  
    /**
     * Mark a notification as read
     * 
     * @param {number} notificationId - ID of the notification
     * @returns {Promise<boolean>} Success status
     */
    async markNotificationAsRead(notificationId: number): Promise<boolean> {
      try {
        return await this.studentRepository.markNotificationAsRead(notificationId);
      } catch (error) {
        console.error('Error in markNotificationAsRead:', error);
        throw new Error('Failed to mark notification as read');
      }
    }
  }
  
  // Export as singleton
  export default new StudentService();