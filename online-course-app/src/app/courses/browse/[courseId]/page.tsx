'use client';

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FaArrowLeft, FaCheck, FaLock, FaPlay, FaBook } from "react-icons/fa";

interface Lesson {
  id: number;
  title: string;
  content: string | null;
  video_url: string | null;
  position: number;
  completed: boolean;
}

interface CourseDetails {
  id: number;
  title: string;
  description: string;
  thumbnail: string | null;
  teacher_name: string | null;
  school_name: string | null;
  status: string;
  difficulty_level: string | null;
  total_lessons: number;
  completed_lessons: number;
  progress: number;
}

const CourseDetailPage = ({ params }: { params: { courseId: string } }) => {
  const router = useRouter();
  const [course, setCourse] = useState<CourseDetails | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCourseDetails = async () => {
      try {
        const courseId = params.courseId;
        if (!courseId) {
          router.replace('/student-dashboard');
          return;
        }

        // Get auth token
        const token = localStorage.getItem('user-token');
        if (!token) {
          router.replace('/auth');
          return;
        }

        setIsLoading(true);
        setError(null);

        // Fetch course details
        const courseResponse = await fetch(`/api/courses/${courseId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!courseResponse.ok) {
          if (courseResponse.status === 401) {
            router.replace('/auth');
            return;
          }
          throw new Error(`Failed to fetch course: ${courseResponse.statusText}`);
        }

        const courseData = await courseResponse.json();

        // Fetch lessons for the course
        const lessonsResponse = await fetch(`/api/courses/${courseId}/lessons`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!lessonsResponse.ok) {
          throw new Error(`Failed to fetch lessons: ${lessonsResponse.statusText}`);
        }

        const lessonsData = await lessonsResponse.json();

        setCourse(courseData);
        setLessons(lessonsData);
      } catch (err) {
        console.error("Error fetching course details:", err);
        setError(err instanceof Error ? err.message : 'Failed to load course details');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCourseDetails();
  }, [params.courseId, router]);

  const goBack = () => {
    router.push('/student-dashboard');
  };

  const navigateToLesson = (lessonId: number) => {
    router.push(`/courses/${params.courseId}/lessons/${lessonId}`);
  };

  const getProgressColor = (progress: number) => {
    if (progress < 30) return "bg-red-500";
    if (progress < 60) return "bg-yellow-500";
    return "bg-green-500";
  };

  // Determine if a lesson is unlocked based on previous lesson completion
  const isLessonUnlocked = (index: number) => {
    // First lesson is always unlocked
    if (index === 0) return true;
    
    // Check if previous lesson is completed
    return lessons[index - 1]?.completed || false;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-blue-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-blue-50 dark:bg-gray-900 p-4">
        <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg max-w-md w-full text-center">
          <h2 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-4">Error</h2>
          <p className="text-gray-700 dark:text-gray-300 mb-6">{error}</p>
          <button
            onClick={goBack}
            className="bg-primary hover:bg-secondary text-white font-bold py-2 px-4 rounded"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-blue-50 dark:bg-gray-900 p-4">
        <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg max-w-md w-full text-center">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">Course Not Found</h2>
          <p className="text-gray-700 dark:text-gray-300 mb-6">The course you're looking for doesn't exist or you don't have access to it.</p>
          <button
            onClick={goBack}
            className="bg-primary hover:bg-secondary text-white font-bold py-2 px-4 rounded"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-blue-50 dark:bg-gray-900 p-4 md:p-8">
      <button
        onClick={goBack}
        className="flex items-center text-primary dark:text-blue-400 hover:underline mb-6"
      >
        <FaArrowLeft className="mr-2" /> Back to Dashboard
      </button>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
        <div className="p-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{course.title}</h1>
          
          <div className="flex flex-wrap gap-3 mb-4">
            {course.teacher_name && (
              <div className="text-sm bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-3 py-1 rounded-full">
                Teacher: {course.teacher_name}
              </div>
            )}
            {course.school_name && (
              <div className="text-sm bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-3 py-1 rounded-full">
                School: {course.school_name}
              </div>
            )}
            {course.difficulty_level && (
              <div className="text-sm bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 px-3 py-1 rounded-full">
                Difficulty: {course.difficulty_level}
              </div>
            )}
          </div>

          <p className="text-gray-700 dark:text-gray-300 mb-6">{course.description}</p>

          <div className="bg-blue-50 dark:bg-gray-700 p-4 rounded-lg mb-8">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Your Progress</h2>
            <div className="relative w-full h-6 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
              <div
                className={`absolute top-0 left-0 h-full ${getProgressColor(course.progress)}`}
                style={{ width: `${course.progress}%` }}
              ></div>
              <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center text-xs text-white font-bold">
                {course.progress}% Complete ({course.completed_lessons} / {course.total_lessons} lessons)
              </div>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Lessons</h2>
          
          {lessons.length === 0 ? (
            <p className="text-gray-600 dark:text-gray-400 italic">No lessons available for this course yet.</p>
          ) : (
            <div className="space-y-3">
              {lessons.map((lesson, index) => {
                const isUnlocked = isLessonUnlocked(index);
                return (
                  <div
                    key={lesson.id}
                    onClick={() => isUnlocked && navigateToLesson(lesson.id)}
                    className={`p-4 rounded-lg border ${
                      lesson.completed
                        ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                        : !isUnlocked
                        ? 'bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700 opacity-75 cursor-not-allowed'
                        : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 hover:border-primary dark:hover:border-primary cursor-pointer transition-colors'
                    }`}
                  >
                    <div className="flex items-start">
                      <div className="mr-3 mt-1">
                        {lesson.completed ? (
                          <div className="bg-green-500 text-white rounded-full p-1">
                            <FaCheck size={14} />
                          </div>
                        ) : !isUnlocked ? (
                          <div className="bg-gray-500 text-white rounded-full p-1">
                            <FaLock size={14} />
                          </div>
                        ) : (
                          <div className="bg-blue-500 text-white rounded-full p-1">
                            <FaPlay size={14} />
                          </div>
                        )}
                      </div>
                      <div className="flex-grow">
                        <h3 className={`font-semibold ${!isUnlocked ? 'text-gray-500 dark:text-gray-400' : 'text-gray-900 dark:text-white'}`}>
                          Lesson {lesson.position}: {lesson.title}
                        </h3>
                        <p className={`text-sm ${!isUnlocked ? 'text-gray-400 dark:text-gray-500' : 'text-gray-600 dark:text-gray-300'}`}>
                          {lesson.video_url ? 'Video Lesson' : 'Text Lesson'}
                        </p>
                      </div>
                      {lesson.completed && (
                        <div className="text-xs text-green-600 dark:text-green-300 font-medium">
                          Completed
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CourseDetailPage;