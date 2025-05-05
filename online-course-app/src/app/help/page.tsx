'use client'

import { useState } from 'react';
import { FaSearch, FaBookOpen, FaChalkboardTeacher, FaGraduationCap, FaUserGraduate, FaChevronDown, FaChevronRight } from "react-icons/fa";
import Link from 'next/link';
import React from 'react';

// Define types for help categories and topics
interface HelpTopic {
  id: string;
  title: string;
  content: string;
}

interface HelpCategory {
  id: string;
  name: string;
  icon: React.ReactNode;
  topics: HelpTopic[];
}

const HelpCenterPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<HelpTopic | null>(null);

  // Sample help data
  const helpCategories: HelpCategory[] = [
    {
      id: 'getting-started',
      name: 'Getting Started',
      icon: <FaBookOpen className="text-xl text-primary dark:text-blue-300" />,
      topics: [
        {
          id: 'create-account',
          title: 'How to Create an Account',
          content: `
            <h3>Creating Your EduHub Account</h3>
            <p>Follow these simple steps to create your EduHub account:</p>
            <ol>
              <li>Visit the EduHub homepage and click on the "Register" button in the top right corner.</li>
              <li>Choose your role: Student, Teacher, or School Administrator.</li>
              <li>Fill in your personal details as requested.</li>
              <li>If you're a student or teacher, enter your school's access code. This code is provided by your school administrator.</li>
              <li>Create a secure password.</li>
              <li>Verify your email address by clicking on the link sent to your email.</li>
              <li>Once verified, you can log in and start using EduHub!</li>
            </ol>
            <p>If you have any trouble creating your account, please contact your school administrator or our support team.</p>
          `
        },
        {
          id: 'navigate-platform',
          title: 'Navigating the Platform',
          content: `
            <h3>Navigating EduHub</h3>
            <p>EduHub's interface is designed to be intuitive and easy to use. Here's how to navigate around:</p>
            <h4>Main Dashboard</h4>
            <p>After logging in, you'll land on your dashboard which shows:</p>
            <ul>
              <li>Your enrolled courses or courses you teach</li>
              <li>Recent announcements</li>
              <li>Upcoming assignments or events</li>
              <li>Quick access to resources</li>
            </ul>
            <h4>Main Menu</h4>
            <p>The main navigation menu is located on the left side of the screen and includes:</p>
            <ul>
              <li>Dashboard - Your home screen</li>
              <li>Courses - Access all your courses</li>
              <li>Calendar - View scheduled classes and assignments</li>
              <li>Messages - Communicate with teachers or students</li>
              <li>Resources - Access additional learning materials</li>
              <li>Profile - Manage your account settings</li>
            </ul>
            <p>If you need more help navigating the platform, please check out our video tutorials or contact support.</p>
          `
        },
        {
          id: 'school-codes',
          title: 'Understanding School Access Codes',
          content: `
            <h3>School Access Codes</h3>
            <p>School access codes are unique identifiers that connect students and teachers to their specific school within EduHub. Here's what you need to know:</p>
            <h4>What is a School Access Code?</h4>
            <p>A school access code is a 6-character alphanumeric code (e.g., ABC123) that is unique to each school registered on EduHub.</p>
            <h4>How to Get Your School's Access Code</h4>
            <p>If you're a:</p>
            <ul>
              <li><strong>Student or Teacher:</strong> Your school administrator will provide you with the access code. This might be shared via email, during orientation, or through your school's communication channels.</li>
              <li><strong>School Administrator:</strong> When you register your school on EduHub, a unique access code will be generated automatically. You can find this code in your admin dashboard.</li>
            </ul>
            <h4>Why Access Codes are Important</h4>
            <p>Access codes ensure that students and teachers are connected to the correct school, giving them access to the right courses, teachers, and resources. They also help maintain the security and privacy of each school's digital environment.</p>
            <p>If you've lost your access code or are having trouble with it, please contact your school administrator or our support team.</p>
          `
        }
      ]
    },
    {
      id: 'for-teachers',
      name: 'For Teachers',
      icon: <FaChalkboardTeacher className="text-xl text-primary dark:text-blue-300" />,
      topics: [
        {
          id: 'create-course',
          title: 'Creating and Managing Courses',
          content: `
            <h3>Creating and Managing Your Courses</h3>
            <p>As a teacher on EduHub, you cannot create your courses but can manage them. Here's how:</p>
            <h4>Creating a New Course</h4>
            <ol>
              <li>Creating a course is the job of the administrator</li>
              <li>Once the course is created, you will be assigned to the course that you teach by the administrator</li>
            </ol>
            <h4>Managing Your Course</h4>
            <p>Once your course is created, you can:</p>
            <ul>
              <li><strong>Add Content:</strong> Upload lessons, resources, assignments, and assessments.</li>
              <li><strong>Organize Modules:</strong> Structure your course into modules or units for easier navigation.</li>
              <li><strong>Monitor Progress:</strong> Track student engagement and performance.</li>
              <li><strong>Communicate:</strong> Send announcements and messages to enrolled students.</li>
            </ul>
          `
        },
        {
          id: 'assignments',
          title: 'Creating Assignments and Assessments',
          content: `
            <h3>Creating Effective Assignments and Assessments</h3>
            <p>Create engaging assignments and assessments to evaluate student learning:</p>
            <h4>Types of Assessments Available</h4>
            <ul>
              <li><strong>Quizzes:</strong> Multiple choice, true/false, matching, and short answer questions.</li>
              <li><strong>Assignments:</strong> File uploads, essays, research papers, and projects.</li>
              <li><strong>Discussions:</strong> Threaded discussions for collaborative learning.</li>
              <li><strong>Practical Assessments:</strong> Skill demonstrations and performance tasks.</li>
            </ul>
            <h4>Creating an Assignment</h4>
            <ol>
              <li>Navigate to your course and click on "Assignments" in the course menu.</li>
              <li>Click "Create New Assignment."</li>
              <li>Fill in the details:
                <ul>
                  <li>Title and description</li>
                  <li>Instructions for students</li>
                  <li>Due date and submission options</li>
                  <li>Grading criteria and point value</li>
                  <li>Attachments or additional resources</li>
                </ul>
              </li>
              <li>Click "Save" to make the assignment available to students.</li>
            </ol>
            <p>Remember to provide clear instructions and evaluation criteria to help students understand your expectations.</p>
          `
        }
      ]
    },
    {
      id: 'for-students',
      name: 'For Students',
      icon: <FaGraduationCap className="text-xl text-primary dark:text-blue-300" />,
      topics: [
        {
          id: 'enrolling',
          title: 'Enrolling in Courses',
          content: `
            <h3>How to Enroll in Courses</h3>
            <p>Enrolling in courses on EduHub is quick and easy. Follow these steps:</p>
            <h4>Finding and Joining Courses</h4>
            <ol>
              <li>Log in to your EduHub account.</li>
              <li>From your dashboard, click on "Courses" in the main menu.</li>
              <li>Click on "Browse Courses" to see available courses from your school.</li>
              <li>When you find a course you want to join, click on the "Enroll" button.</li>
              <li>Some courses may require an enrollment key provided by your teacher.</li>
              <li>Once enrolled, the course will appear on your dashboard and in your courses list.</li>
            </ol>
            <h4>Self-Enrollment vs. Teacher Enrollment</h4>
            <p>Depending on your school's policy, you may be:</p>
            <ul>
              <li><strong>Automatically enrolled</strong> in required courses by administrators or teachers.</li>
              <li>Able to <strong>self-enroll</strong> in elective or optional courses.</li>
            </ul>
            <p>If you can't find a course or have trouble enrolling, contact your teacher or school administrator for assistance.</p>
          `
        },
        {
          id: 'submitting-work',
          title: 'Submitting Assignments',
          content: `
            <h3>Submitting Your Assignments</h3>
            <p>Learn how to successfully submit your assignments on EduHub:</p>
            <h4>Step-by-Step Submission Process</h4>
            <ol>
              <li>Log in to your EduHub account and navigate to your course.</li>
              <li>Find the assignment in the course modules or assignments section.</li>
              <li>Click on the assignment to view details and instructions.</li>
              <li>Click the "Submit Assignment" button.</li>
              <li>Depending on the assignment type, you may:
                <ul>
                  <li>Upload a file (document, presentation, image, etc.)</li>
                  <li>Type text directly into a text box</li>
                  <li>Record audio or video</li>
                  <li>Complete an online quiz</li>
                </ul>
              </li>
              <li>Review your submission and click "Submit" to finalize.</li>
              <li>You'll receive a confirmation when your submission is successful.</li>
            </ol>
            <h4>Tips for Successful Submissions</h4>
            <ul>
              <li>Submit well before the deadline to avoid last-minute technical issues.</li>
              <li>Check file size and format requirements before uploading.</li>
              <li>Save a copy of your work before submitting.</li>
              <li>Verify that your submission was received by checking the status in your assignment list.</li>
            </ul>
            <p>If you encounter any issues while submitting your work, contact your teacher or EduHub support immediately.</p>
          `
        }
      ]
    },
    {
      id: 'technical-support',
      name: 'Technical Support',
      icon: <FaUserGraduate className="text-xl text-primary dark:text-blue-300" />,
      topics: [
        {
          id: 'password-reset',
          title: 'Resetting Your Password',
          content: `
            <h3>How to Reset Your Password</h3>
            <p>If you've forgotten your password or need to change it for security reasons, follow these steps:</p>
            <h4>Forgotten Password</h4>
            <ol>
              <li>Go to the EduHub login page.</li>
              <li>Click on "Forgot Password" below the login form.</li>
              <li>Enter the email address associated with your account.</li>
              <li>Check your email for a password reset link.</li>
              <li>Click the link and follow the instructions to create a new password.</li>
              <li>Use your new password to log in.</li>
            </ol>
            <h4>Changing Your Current Password</h4>
            <ol>
              <li>Log in to your EduHub account.</li>
              <li>Click on your profile picture or icon in the top right corner.</li>
              <li>Select "Account Settings" or "Profile."</li>
              <li>Navigate to the "Security" or "Password" section.</li>
              <li>Enter your current password, then your new password twice to confirm.</li>
              <li>Click "Save" or "Update Password."</li>
            </ol>
            <p>For security, choose a strong password that includes a mix of letters, numbers, and special characters.</p>
          `
        },
        {
          id: 'system-requirements',
          title: 'System Requirements',
          content: `
            <h3>System Requirements for EduHub</h3>
            <p>To ensure the best experience with EduHub, make sure your device meets these minimum requirements:</p>
            <h4>Computer Requirements</h4>
            <ul>
              <li><strong>Operating System:</strong> Windows 10+, macOS 10.13+, or ChromeOS</li>
              <li><strong>Browser:</strong> Latest version of Chrome, Firefox, Safari, or Edge</li>
              <li><strong>RAM:</strong> 4GB minimum (8GB recommended)</li>
              <li><strong>Screen Resolution:</strong> 1280x720 minimum</li>
              <li><strong>Internet Connection:</strong> Broadband connection (1 Mbps or faster)</li>
            </ul>
            <h4>Mobile Device Requirements</h4>
            <ul>
              <li><strong>Operating System:</strong> iOS 13+ or Android 8.0+</li>
              <li><strong>Browser:</strong> Latest version of Chrome or Safari</li>
              <li><strong>App:</strong> EduHub mobile app available on App Store and Google Play</li>
              <li><strong>Internet Connection:</strong> Wi-Fi or mobile data (3G or faster)</li>
            </ul>
            <h4>Additional Requirements</h4>
            <ul>
              <li><strong>Audio:</strong> Speakers or headphones</li>
              <li><strong>Video Conferencing:</strong> Webcam and microphone (for virtual classes)</li>
              <li><strong>Storage:</strong> At least 1GB of free space for downloading resources</li>
              <li><strong>Plugins:</strong> JavaScript enabled, cookies allowed</li>
            </ul>
            <p>If you're experiencing technical issues, try updating your browser or contacting our support team.</p>
          `
        }
      ]
    }
  ];

  // Handle category expansion
  const toggleCategory = (categoryId: string) => {
    setExpandedCategory(expandedCategory === categoryId ? null : categoryId);
    setSelectedTopic(null);
  };

  // Handle topic selection
  const selectTopic = (topic: HelpTopic) => {
    setSelectedTopic(topic);
  };

  // Filter help topics based on search term
  const filteredCategories = searchTerm.length > 2
    ? helpCategories.map(category => ({
        ...category,
        topics: category.topics.filter(topic =>
          topic.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          topic.content.toLowerCase().includes(searchTerm.toLowerCase())
        )
      })).filter(category => category.topics.length > 0)
    : helpCategories;

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="bg-blue-50 dark:bg-gray-900 py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-6">
              Help <span className="text-primary">Center</span>
            </h1>
            <p className="text-lg text-gray-700 dark:text-gray-300 mb-8">
              Find answers to your questions and learn how to make the most of EduHub.
            </p>
            <div className="relative max-w-2xl mx-auto">
              <input
                type="text"
                placeholder="Search for help topics..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white dark:bg-gray-700 rounded-full py-3 px-6 pl-12 shadow-md focus:outline-none focus:ring-2 focus:ring-primary dark:text-white"
              />
              <FaSearch className="absolute left-4 top-4 text-gray-500 dark:text-gray-400" />
            </div>
          </div>
        </div>
      </section>

      {/* Help Content Section */}
      <section className="py-16 bg-white dark:bg-gray-800">
        <div className="container mx-auto px-4">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Categories and Topics */}
            <div className="lg:w-1/3">
              <div className="bg-blue-50 dark:bg-gray-700 rounded-lg shadow-md p-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                  Help Topics
                </h2>
                <div className="space-y-4">
                  {filteredCategories.length > 0 ? (
                    filteredCategories.map(category => (
                      <div key={category.id} className="border-b border-gray-200 dark:border-gray-600 pb-4 last:border-b-0 last:pb-0">
                        <button
                          onClick={() => toggleCategory(category.id)}
                          className="flex items-center justify-between w-full text-left font-medium text-gray-900 dark:text-white hover:text-primary dark:hover:text-blue-300 focus:outline-none"
                        >
                          <div className="flex items-center">
                            {category.icon}
                            <span className="ml-2">{category.name}</span>
                          </div>
                          {expandedCategory === category.id ? (
                            <FaChevronDown className="text-gray-500 dark:text-gray-400" />
                          ) : (
                            <FaChevronRight className="text-gray-500 dark:text-gray-400" />
                          )}
                        </button>
                        
                        {expandedCategory === category.id && (
                          <div className="mt-2 ml-6 space-y-2">
                            {category.topics.map(topic => (
                              <button
                                key={topic.id}
                                onClick={() => selectTopic(topic)}
                                className={`block text-left ${
                                  selectedTopic?.id === topic.id
                                    ? 'text-primary dark:text-blue-300 font-medium'
                                    : 'text-gray-700 dark:text-gray-300 hover:text-primary dark:hover:text-blue-300'
                                }`}
                              >
                                {topic.title}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-700 dark:text-gray-300">No topics match your search. Try different keywords.</p>
                  )}
                </div>
              </div>
              
              <div className="mt-6 bg-blue-50 dark:bg-gray-700 rounded-lg shadow-md p-6">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3">
                  Need More Help?
                </h3>
                <p className="text-gray-700 dark:text-gray-300 mb-4">
                  Can&apos;t find what you&apos;re looking for? Our support team is here to help.
                </p>
                <Link href="/contact" className="block text-center bg-primary hover:bg-secondary text-white font-bold py-2 px-4 rounded-md transition-colors duration-300">
                  Contact Support
                </Link>
              </div>
            </div>
            
            {/* Content Area */}
            <div className="lg:w-2/3">
              <div className="bg-white dark:bg-gray-700 rounded-lg shadow-md p-6 min-h-[500px]">
                {selectedTopic ? (
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                      {selectedTopic.title}
                    </h2>
                    <div
                      className="prose prose-blue max-w-none dark:prose-invert text-gray-700 dark:text-gray-300"
                      dangerouslySetInnerHTML={{ __html: selectedTopic.content }}
                    />
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <FaBookOpen className="text-5xl text-primary dark:text-blue-300 mb-4" />
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                      Welcome to the Help Center
                    </h2>
                    <p className="text-gray-700 dark:text-gray-300 max-w-lg">
                      Select a topic from the menu on the left to view detailed instructions and guidance. If you can&apos;t find what you need, don&apos;t hesitate to contact our support team.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HelpCenterPage;