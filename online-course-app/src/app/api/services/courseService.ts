/**
 * 
 * This service handles the data fetching for courses only.
 */

// Define the Course interface 
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
  }
  
  /**
   * Fetch courses for a student
   * 
   * @param studentId The ID of the student
   * @returns Promise with course data or error
   */
  export async function fetchStudentCourses(studentId: number): Promise<Course[]> {
    try {
      if (!studentId || isNaN(Number(studentId)) || studentId <= 0) {
        console.error('Invalid student ID provided:', studentId);
        throw new Error('Invalid student ID');
      }
  
      const token = localStorage.getItem('user-token');
      if (!token) {
        console.error('No authentication token found');
        throw new Error('Authentication required');
      }
  
      console.log(`Fetching courses for student ID: ${studentId}`);
      
      const response = await fetch(`/api/student/courses?studentId=${studentId}`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
  
      if (!response.ok) {
        // Handle different error types
        if (response.status === 401) {
          throw new Error('Your session has expired. Please log in again.');
        } else if (response.status === 404) {
          console.warn('No courses found or student does not exist');
          return []; // Return empty array for no courses
        } else {
          throw new Error(`Failed to fetch courses: ${response.statusText}`);
        }
      }
  
      const data = await response.json();
      
      // Ensure we got an array back
      if (!Array.isArray(data)) {
        console.error('Expected array of courses but got:', typeof data);
        return [];
      }
      
      console.log(`Successfully fetched ${data.length} courses`);
      return data;
    } catch (error) {
      console.error('Error in fetchStudentCourses:', error);
      throw error;
    }
  }
  
  /**
   * Get course count for a student
   * 
   * @param studentId The ID of the student
   * @returns Promise with the number of courses
   */
  export async function getCoursesCount(studentId: number): Promise<number> {
    try {
      const courses = await fetchStudentCourses(studentId);
      return courses.length;
    } catch (error) {
      console.error('Error getting course count:', error);
      return 0; // Return 0 as a safe default
    }
  }
  
  /**
   * Browse available courses that student can enroll in
   * 
   * @param studentId The ID of the student
   * @returns Promise with available courses
   */
  export async function browseAvailableCourses(studentId: number): Promise<Course[]> {
    try {
      const token = localStorage.getItem('user-token');
      if (!token) {
        throw new Error('Authentication required');
      }
  
      // This would hit a different endpoint to get courses available for enrollment
      const response = await fetch(`/api/courses/available?studentId=${studentId}`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
  
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Your session has expired. Please log in again.');
        } else {
          throw new Error(`Failed to fetch available courses: ${response.statusText}`);
        }
      }
  
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('Error browsing available courses:', error);
      throw error;
    }
  }
  
  /**
   * Enroll in a course
   * 
   * @param studentId The ID of the student
   * @param courseId The ID of the course to enroll in
   * @returns Promise with success status
   */
  export async function enrollInCourse(studentId: number, courseId: number): Promise<boolean> {
    try {
      const token = localStorage.getItem('user-token');
      if (!token) {
        throw new Error('Authentication required');
      }
  
      const response = await fetch('/api/courses/enroll', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          studentId,
          courseId
        })
      });
  
      if (!response.ok) {
        throw new Error(`Failed to enroll: ${response.statusText}`);
      }
  
      return true;
    } catch (error) {
      console.error('Error enrolling in course:', error);
      throw error;
    }
  }