'use client'

import { useState } from 'react';
import { FaChevronDown, FaChevronUp, FaSearch } from 'react-icons/fa';
import Link from 'next/link';

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
}

const FAQPage = () => {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  // Sample FAQ data
  const faqItems: FAQItem[] = [
    // General Questions
    {
      id: 'what-is-eduhub',
      question: 'What is EduHub?',
      answer: 'EduHub is an online learning platform designed specifically for Ghanaian students and schools. It provides a digital environment where students can access course materials, complete assignments, and interact with teachers remotely, all while following the Ghana Education Service curriculum.',
      category: 'general'
    },
    {
      id: 'who-can-use',
      question: 'Who can use EduHub?',
      answer: 'EduHub is designed for students, teachers, and school administrators in Ghana. Students can access lessons and assignments, teachers can create and manage courses, and administrators can oversee their school\'s digital education environment.',
      category: 'general'
    },
    {
      id: 'cost',
      question: 'How much does EduHub cost?',
      answer: 'EduHub offers different pricing models based on school size and requirements. Schools typically pay a subscription fee that covers all their teachers and students. For detailed pricing information, please contact our sales team through the Contact page.',
      category: 'general'
    },
    {
      id: 'internet-requirements',
      question: 'What are the internet requirements for using EduHub?',
      answer: 'EduHub is designed to work with modest internet connections. We recommend a connection speed of at least 1 Mbps for a smooth experience. The platform also has offline capabilities, allowing students to download content when they have internet access and work on it later when offline.',
      category: 'general'
    },
    
    // Account Questions
    {
      id: 'create-account',
      question: 'How do I create an EduHub account?',
      answer: 'To create an account, visit the EduHub website and click on "Register". Select your role (student, teacher, or administrator), and fill in your details. Students and teachers will need their school\'s access code, which is provided by school administrators.',
      category: 'account'
    },
    {
      id: 'forgot-password',
      question: 'I forgot my password. How can I reset it?',
      answer: 'On the login page, click "Forgot Password" and enter the email address associated with your account. You\'ll receive an email with instructions to reset your password. If you don\'t receive the email, check your spam folder or contact your school administrator.',
      category: 'account'
    },
    {
      id: 'change-email',
      question: 'Can I change my email address?',
      answer: 'Yes, you can change your email address in your account settings. Log in to your account, go to your profile settings, and update your email. Note that you will need to verify the new email address before the change takes effect.',
      category: 'account'
    },
    
    // For Students
    {
      id: 'join-course',
      question: 'How do I join a course?',
      answer: 'Once logged in, navigate to "Courses" and click "Browse Courses" to see available courses from your school. Click "Enroll" on the course you want to join. Some courses may require an enrollment key provided by your teacher.',
      category: 'students'
    },
    {
      id: 'submit-assignment',
      question: 'How do I submit an assignment?',
      answer: 'Navigate to the assignment in your course, click on it to view details, and then click "Submit Assignment". Depending on the assignment type, you may upload a file, type text directly, or complete an online quiz. Always review your submission before finalizing.',
      category: 'students'
    },
    {
      id: 'view-grades',
      question: 'Where can I see my grades?',
      answer: 'You can view your grades by going to the "Grades" section in your course navigation menu. This will show all your graded activities and feedback from your teacher. You can also access an overview of grades across all courses from your dashboard.',
      category: 'students'
    },
    
    // For Teachers
    {
      id: 'create-course',
      question: 'How do I create a new course?',
      answer: 'The administrator creates the courses and assigns a teacher to it. Once you log in, you can add content, assignments, and resources for the course you have been assigned to.',
      category: 'teachers'
    },
    {
      id: 'grade-assignments',
      question: 'How do I grade student assignments?',
      answer: 'Navigate to the assignment in your course, click on "View Submissions" to see all student submissions. Click on a submission to review it, add feedback, and assign a grade. You can also download submissions for offline grading if needed.',
      category: 'teachers'
    },
    {
      id: 'course-analytics',
      question: 'Can I see analytics about student engagement?',
      answer: 'Yes, EduHub provides analytics for teachers to track student engagement and performance. From your course, go to "Analytics" to view reports on student activity, submission rates, assessment results, and progress through course materials.',
      category: 'teachers'
    },
    
    // Technical Issues
    {
      id: 'cant-login',
      question: 'I can\'t log in to my account. What should I do?',
      answer: 'First, ensure you\'re using the correct email and password. Try resetting your password using the "Forgot Password" link. Check if you\'re connected to the internet and using a supported browser. If issues persist, contact your school administrator or our support team.',
      category: 'technical'
    },
    {
      id: 'file-upload',
      question: 'I\'m having trouble uploading files. What formats are supported?',
      answer: 'EduHub supports common file formats including PDF, Word (DOCX), Excel (XLSX), PowerPoint (PPTX), images (JPG, PNG), and media files (MP3, MP4). Ensure your file is under the maximum size limit (usually 50MB) and that you have a stable internet connection during upload.',
      category: 'technical'
    },
    {
      id: 'mobile-app',
      question: 'Is there a mobile app for EduHub?',
      answer: 'Not at the moment.',
      category: 'technical'
    }
  ];

  // Get unique categories
  const categories = [...new Set(faqItems.map(item => item.category))];

  // Category labels for display
  const categoryLabels: { [key: string]: string } = {
    'general': 'General Questions',
    'account': 'Account Management',
    'students': 'For Students',
    'teachers': 'For Teachers',
    'technical': 'Technical Issues'
  };

  // Toggle FAQ item expansion
  const toggleItem = (id: string) => {
    setActiveId(activeId === id ? null : id);
  };

  // Filter FAQ items based on search and category
  const filteredFAQs = faqItems.filter(item => {
    const matchesSearch = searchTerm === '' || 
      item.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.answer.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = activeCategory === null || item.category === activeCategory;
    
    return matchesSearch && matchesCategory;
  });

  // Group filtered FAQs by category
  const groupedFAQs: { [key: string]: FAQItem[] } = {};
  
  filteredFAQs.forEach(item => {
    if (!groupedFAQs[item.category]) {
      groupedFAQs[item.category] = [];
    }
    groupedFAQs[item.category].push(item);
  });

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="bg-blue-50 dark:bg-gray-900 py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-6">
              Frequently Asked <span className="text-primary">Questions</span>
            </h1>
            <p className="text-lg text-gray-700 dark:text-gray-300 mb-8">
              Find answers to common questions about using EduHub.
            </p>
            <div className="relative max-w-2xl mx-auto">
              <input
                type="text"
                placeholder="Search FAQ..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white dark:bg-gray-700 rounded-full py-3 px-6 pl-12 shadow-md focus:outline-none focus:ring-2 focus:ring-primary dark:text-white"
              />
              <FaSearch className="absolute left-4 top-4 text-gray-500 dark:text-gray-400" />
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Content Section */}
      <section className="py-16 bg-white dark:bg-gray-800">
        <div className="container mx-auto px-4">
          {/* Category Filters */}
          <div className="mb-10 flex flex-wrap justify-center gap-3">
            <button
              onClick={() => setActiveCategory(null)}
              className={`px-4 py-2 rounded-full text-sm font-medium ${
                activeCategory === null
                  ? 'bg-primary text-white'
                  : 'bg-blue-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-blue-100 dark:hover:bg-gray-600'
              }`}
            >
              All Questions
            </button>
            
            {categories.map(category => (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={`px-4 py-2 rounded-full text-sm font-medium ${
                  activeCategory === category
                    ? 'bg-primary text-white'
                    : 'bg-blue-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-blue-100 dark:hover:bg-gray-600'
                }`}
              >
                {categoryLabels[category]}
              </button>
            ))}
          </div>

          <div className="max-w-3xl mx-auto">
            {/* No results message */}
            {Object.keys(groupedFAQs).length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-700 dark:text-gray-300 text-lg mb-4">
                  No FAQs match your search criteria.
                </p>
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setActiveCategory(null);
                  }}
                  className="text-primary dark:text-blue-300 font-medium hover:underline"
                >
                  Clear filters and see all FAQs
                </button>
              </div>
            )}

            {/* Render FAQs by category */}
            {Object.entries(groupedFAQs).map(([category, items]) => (
              <div key={category} className="mb-10">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                  {categoryLabels[category]}
                </h2>
                <div className="space-y-4">
                  {items.map(item => (
                    <div 
                      key={item.id}
                      className="bg-blue-50 dark:bg-gray-700 rounded-lg shadow-md overflow-hidden"
                    >
                      <button
                        onClick={() => toggleItem(item.id)}
                        className="w-full text-left px-6 py-4 focus:outline-none flex items-center justify-between"
                      >
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white pr-8">
                          {item.question}
                        </h3>
                        {activeId === item.id ? (
                          <FaChevronUp className="text-primary dark:text-blue-300 flex-shrink-0" />
                        ) : (
                          <FaChevronDown className="text-gray-500 dark:text-gray-400 flex-shrink-0" />
                        )}
                      </button>
                      
                      {activeId === item.id && (
                        <div className="px-6 pb-6">
                          <div className="border-t border-gray-200 dark:border-gray-600 pt-4">
                            <p className="text-gray-700 dark:text-gray-300">
                              {item.answer}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Still need help section */}
          <div className="mt-16 max-w-3xl mx-auto bg-blue-100 dark:bg-blue-900 rounded-lg shadow-md p-8 text-center">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Still Have Questions?
            </h2>
            <p className="text-gray-700 dark:text-gray-300 mb-6">
              Can't find the answer you're looking for? Check our detailed help guides or reach out to our support team.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link
                href="/help"
                className="bg-white dark:bg-gray-700 text-primary dark:text-blue-300 hover:bg-gray-50 dark:hover:bg-gray-600 font-bold py-3 px-8 rounded-md transition-colors duration-300"
              >
                Browse Help Center
              </Link>
              <Link
                href="/contact"
                className="bg-primary hover:bg-secondary text-white font-bold py-3 px-8 rounded-md transition-colors duration-300"
              >
                Contact Support
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default FAQPage;