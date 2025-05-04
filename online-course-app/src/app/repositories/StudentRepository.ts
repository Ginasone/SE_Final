/**
 * Student Repository
 * 
 * Implements the Repository pattern for student data access operations.
 * This layer handles all database interactions related to student data,
 * abstracting the data access logic from the service layer.
 * 
 * @author Nadia
 */

import { query } from '@/app/utils/db';

// Define Student related types
export interface StudentProfile {
  id: number;
  full_name: string;
  email: string;
  profile_picture: string | null;
  status: string;
  school_name: string | null;
  school_location: string | null;
}

export interface EnrolledCourse {
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
}

export interface StudentNotification {
  id: number;
  message: string;
  is_read: boolean;
  created_at: string;
  course_id: number | null;
  course_title: string | null;
}

export interface CoursesCountResult {
  course_count: number;
}

export interface NotificationsCountResult {
  notification_count: number;
}

/**
 * StudentRepository class - Repository Pattern implementation
 * Handles all database operations related to student data
 */
class StudentRepository {
  /**
   * Fetch student profile data by ID
   * 
   * @param {number} studentId - The ID of the student
   * @returns {Promise<StudentProfile|null>} Student profile or null if not found
   */
  async getStudentProfile(studentId: number): Promise<StudentProfile | null> {
    try {
      console.log(`[Repository] Fetching profile for student: ${studentId}`);
      const results = await query(
        `SELECT u.id, u.full_name, u.email, u.profile_picture, u.status, 
                s.name as school_name, s.location as school_location
         FROM users u
         LEFT JOIN schools s ON u.school_id = s.id
         WHERE u.id = ? AND u.role = 'student'`,
        [studentId]
      );
      
      const profile = Array.isArray(results) && results.length > 0 
        ? results[0] as StudentProfile
        : null;
      
      console.log(`[Repository] Profile fetch result:`, profile ? "Found" : "Not found");
      return profile;
    } catch (error) {
      console.error('[Repository] Error in getStudentProfile:', error);
      // Return null on error instead of throwing to prevent cascade failures
      return null;
    }
  }

  /**
   * Get the count of enrolled courses for a student
   * 
   * @param {number} studentId - The ID of the student
   * @returns {Promise<number>} Count of active enrollments
   */
  async getEnrolledCoursesCount(studentId: number): Promise<number> {
    try {
      console.log(`[Repository] Getting course count for student: ${studentId}`);
      const results = await query(
        `SELECT COUNT(*) as course_count 
         FROM enrollments 
         WHERE student_id = ? AND status = 'active'`,
        [studentId]
      ) as CoursesCountResult[];
      
      const count = Array.isArray(results) && results.length > 0 
        ? results[0].course_count
        : 0;
      
      console.log(`[Repository] Course count: ${count}`);
      return count;
    } catch (error) {
      console.error('[Repository] Error in getEnrolledCoursesCount:', error);
      // Return 0 on error instead of throwing
      return 0;
    }
  }

  /**
   * Get the count of unread notifications for a student
   * 
   * @param {number} studentId - The ID of the student
   * @returns {Promise<number>} Count of unread notifications
   */
  async getUnreadNotificationsCount(studentId: number): Promise<number> {
    try {
      console.log(`[Repository] Getting unread notifications count for student: ${studentId}`);
      const results = await query(
        `SELECT COUNT(*) as notification_count 
         FROM notifications 
         WHERE user_id = ? AND is_read = 0`,
        [studentId]
      ) as NotificationsCountResult[];
      
      const count = Array.isArray(results) && results.length > 0 
        ? results[0].notification_count
        : 0;
      
      console.log(`[Repository] Unread notifications count: ${count}`);
      return count;
    } catch (error) {
      console.error('[Repository] Error in getUnreadNotificationsCount:', error);
      // Return 0 on error
      return 0;
    }
  }

  /**
   * Get all enrolled courses for a student with detailed information
   * 
   * @param {number} studentId - The ID of the student
   * @returns {Promise<EnrolledCourse[]>} Array of enrolled courses
   */
  async getEnrolledCourses(studentId: number): Promise<EnrolledCourse[]> {
    try {
      console.log(`[Repository] Getting enrolled courses for student: ${studentId}`);
      
      // First check if the student has any enrollments to avoid JOIN issues
      const enrollmentCheck = await query(
        "SELECT COUNT(*) as count FROM enrollments WHERE student_id = ?",
        [studentId]
      );
      
      // If no enrollments, return empty array immediately
      if (Array.isArray(enrollmentCheck) && 
          enrollmentCheck.length > 0 && 
          enrollmentCheck[0].count === 0) {
        console.log(`[Repository] Student ${studentId} has no enrollments, returning empty array`);
        return [];
      }
      
      // Only perform the JOIN query if we have enrollments
      const results = await query(
        `SELECT c.id, c.title, c.description, c.thumbnail, c.start_date, c.end_date, 
                c.status, c.difficulty_level, s.name as school_name,
                u.full_name as teacher_name,
                e.status as enrollment_status,
                (SELECT COUNT(*) FROM lessons WHERE course_id = c.id) as total_lessons,
                (SELECT COUNT(*) FROM user_progress 
                 WHERE user_id = ? AND course_id = c.id AND completed = 1) as completed_lessons
         FROM enrollments e
         JOIN courses c ON e.course_id = c.id
         LEFT JOIN schools s ON c.school_id = s.id
         LEFT JOIN users u ON c.teacher_id = u.id
         WHERE e.student_id = ? AND e.status = 'active'
         ORDER BY c.start_date DESC`,
        [studentId, studentId]
      ) as EnrolledCourse[];
      
      const courses = Array.isArray(results) ? results : [];
      console.log(`[Repository] Found ${courses.length} enrolled courses`);
      return courses;
    } catch (error) {
      console.error('[Repository] Error in getEnrolledCourses:', error);
      // Return empty array on error instead of throwing
      return [];
    }
  }

  /**
   * Get recent notifications for a student
   * 
   * @param {number} studentId - The ID of the student
   * @param {number} limit - Maximum number of notifications to return
   * @returns {Promise<StudentNotification[]>} Array of notifications
   */
  async getStudentNotifications(studentId: number, limit: number = 10): Promise<StudentNotification[]> {
    try {
      console.log(`[Repository] Getting notifications for student: ${studentId} (limit: ${limit})`);
      const results = await query(
        `SELECT n.id, n.message, n.is_read, n.created_at,
                c.id as course_id, c.title as course_title
         FROM notifications n
         LEFT JOIN courses c ON n.message LIKE CONCAT('%course_id:', c.id, '%')
         WHERE n.user_id = ?
         ORDER BY n.created_at DESC
         LIMIT ?`,
        [studentId, limit]
      ) as StudentNotification[];
      
      const notifications = Array.isArray(results) ? results : [];
      console.log(`[Repository] Found ${notifications.length} notifications`);
      return notifications;
    } catch (error) {
      console.error('[Repository] Error in getStudentNotifications:', error);
      // Return empty array on error
      return [];
    }
  }

  /**
   * Mark a notification as read
   * 
   * @param {number} notificationId - ID of the notification to mark as read
   * @returns {Promise<boolean>} Success status
   */
  async markNotificationAsRead(notificationId: number): Promise<boolean> {
    try {
      console.log(`[Repository] Marking notification as read: ${notificationId}`);
      await query(
        `UPDATE notifications SET is_read = 1 WHERE id = ?`,
        [notificationId]
      );
      console.log(`[Repository] Notification ${notificationId} marked as read`);
      return true;
    } catch (error) {
      console.error('[Repository] Error in markNotificationAsRead:', error);
      return false;
    }
  }
}

// Export a singleton instance
export default new StudentRepository();