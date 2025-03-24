'use client'

import Image from "next/image";
import Link from "next/link";
import { FaGraduationCap, FaBookReader, FaLaptop } from "react-icons/fa";

const Home = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <section className="bg-blue-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 py-16 flex flex-col md:flex-row items-center justify-between">
          <div className="md:w-1/2 mb-8 md:mb-0">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
              Learn Even From <span className="text-primary">Miles Away</span>
            </h1>
            <p className="text-lg text-gray-700 dark:text-gray-300 mb-8">
              The best online learning platform for Ghanaian students to access lessons, complete assignments, and connect with teachers from anywhere.
            </p>
            <Link
              href="/auth"
              className="bg-primary hover:bg-secondary text-white font-bold py-3 px-8 rounded-md transition-colors duration-300"
            >
              Register Now
            </Link>
          </div>
          <div className="md:w-1/2 flex justify-center">
            <div className="relative w-full max-w-md h-80">
              <Image
                src="/student-teacher.jpeg"
                alt="Student and teacher studying together"
                fill
                priority
                className="object-cover rounded-lg shadow-lg"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = "https://via.placeholder.com/500x400?text=Students+Learning";
                }}
              />
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-white dark:bg-gray-800">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-12">
            What We Offer
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-blue-50 dark:bg-gray-700 p-6 rounded-lg shadow-md">
              <div className="bg-blue-100 dark:bg-blue-900 w-16 h-16 rounded-full flex items-center justify-center mb-4 mx-auto">
                <FaGraduationCap className="text-3xl text-primary dark:text-blue-300"/>
              </div>
              <h3 className="text-xl font-semibold text-center text-gray-900 dark:text-white mb-3">
                GES Syllabus
              </h3>
              <p className="text-gray-700 dark:text-gray-300 text-center">
                Access lesons aligned with the Ghana Education Service curriculum, ensuring students stay no track with national educational standards
              </p>
            </div>

            <div className="bg-blue-50 dark:bg-gray-700 p-6 rounded-lg shadow-md">
              <div className="bg-blue-100 dark:bg-blue-900 w-16 h-16 rounded-full flex items-center justify-center mb-4 mx-auto">
                <FaBookReader className="text-3xl text-primary dark:text-blue-300"/>
              </div>
              <h3 className="text-xl font-semibold text-center text-gray-900 dark:text-white mb-3">
                Skills Development
              </h3>
              <p className="text-gray-700 dark:text-gray-300 text-center">
                Explore courses beyond the standard curriculum, developing practical skills and knowledge for future success.
              </p>
            </div>

            <div className="bg-blue-50 dark:bg-gray-700 p-6 rounded-lg shadow-md">
              <div className="bg-blue-100 dark:bg-blue-900 w-16 h-16 rounded-full flex items-center justify-center mb-4 mx-auto">
                <FaLaptop className="text-3xl text-primary dark:text-bule-300"/>
              </div>
              <h3 className="text-xl font-semibold text-center text-gray-900 dark:text-white mb-3">
                Interactive Learning
              </h3>
              <p className="text-gray-700 dark:text-gray-300 text-center">
                Engage with interactive lessons, quizzes, and assignments that make distance learning effective and enjoyable
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-blue-50 dark:bg-gray-900">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
              About EduHub
            </h2>
            <p className="text-lg text-gray-700 dark:text-gray-300 mb-8">
              EduHub is an innovative online platform designed specifically for Ghanaian students. Our platform connects students with qualified teachers from their schools, allowing them to access educational content aligned with the GES syllabus from anywhere with an internet connection
            </p>
            <p className="text-lg text-gray-700 dark:text-gray-300 mb-8">
              Beyond the standard curriculum, we offer courses on valuable skills and knowledge for international studies or personal development. Our missino is to make quality education accessible to all students regardless of location or circumstances.
            </p>
            <Link
              href="/about"
              className="text-primary hover:text-secondary dark:text-blue-300 dark:hover:text-blue-400 font-semibold inline-flex items-center"
            >
              Learn More About Us
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      <section className="py-16 bg-primary dark:bg-primary">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-6">
            Ready to Start Learning?
          </h2>
          <p className="text-xl text-white mb-8 max-w-2xl mx-auto">
            Join thousands of students who are already expanding their knowledge and skills with EduHub
          </p>
          <Link
            href="/auth"
            className="bg-white text-primary hover:bg-gray-100 font-bold py-3 px-8 rounded-md transition-colors duration-300"
          >
            Register Now
          </Link>
        </div>
      </section>
    </div>
  );
}

export default Home;