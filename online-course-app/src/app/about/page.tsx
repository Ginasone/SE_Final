'use client'

import Image from "next/image";
import Link from "next/link";
import { FaGraduationCap, FaBookReader, FaChalkboardTeacher, FaUniversity, FaUsers } from "react-icons/fa";

const AboutPage = () => {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="bg-blue-50 dark:bg-gray-900 py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-6">
              About <span className="text-primary">EduHub</span>
            </h1>
            <p className="text-lg text-gray-700 dark:text-gray-300 mb-8">
              Bridging the gap in education through technology and innovation
            </p>
          </div>
        </div>
      </section>

      {/* Our Story Section */}
      <section className="py-16 bg-white dark:bg-gray-800">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center gap-12">
            <div className="md:w-1/2">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
                Our Story
              </h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                EduHub was founded in 2023 with a clear mission: to make quality education accessible to all Ghanaian students, regardless of their location or circumstances. We recognized the challenges many students face in accessing educational resources, especially those in remote areas or with limited mobility.
              </p>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                Our team of educators, technologists, and education enthusiasts came together to create a platform that connects students with their schools and teachers digitally, ensuring continuity in education even when physical attendance isn't possible.
              </p>
              <p className="text-gray-700 dark:text-gray-300">
                Today, EduHub serves thousands of students across Ghana, partnering with schools to deliver curriculum-aligned content while also offering additional skills development courses that prepare students for future opportunities.
              </p>
            </div>
            <div className="md:w-1/2 relative h-80 w-full">
              <Image
                src="/school-building.jpeg"
                alt="EduHub headquarters"
                fill
                className="object-cover rounded-lg shadow-lg"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = "https://via.placeholder.com/600x400?text=EduHub+Office";
                }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Our Mission Section */}
      <section className="py-16 bg-blue-50 dark:bg-gray-900">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
              Our Mission
            </h2>
            <p className="text-lg text-gray-700 dark:text-gray-300 mb-8">
              To empower Ghanaian students through accessible, quality education that bridges geographical and socioeconomic barriers, fostering a generation of knowledgeable, skilled, and confident learners.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                <div className="bg-blue-100 dark:bg-blue-900 w-16 h-16 rounded-full flex items-center justify-center mb-4 mx-auto">
                  <FaGraduationCap className="text-3xl text-primary dark:text-blue-300"/>
                </div>
                <h3 className="text-xl font-semibold text-center text-gray-900 dark:text-white mb-3">
                  Accessibility
                </h3>
                <p className="text-gray-700 dark:text-gray-300 text-center">
                  Making education available to all students regardless of location or circumstances
                </p>
              </div>

              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                <div className="bg-blue-100 dark:bg-blue-900 w-16 h-16 rounded-full flex items-center justify-center mb-4 mx-auto">
                  <FaBookReader className="text-3xl text-primary dark:text-blue-300"/>
                </div>
                <h3 className="text-xl font-semibold text-center text-gray-900 dark:text-white mb-3">
                  Quality
                </h3>
                <p className="text-gray-700 dark:text-gray-300 text-center">
                  Delivering high-standard education aligned with Ghana Education Service standards
                </p>
              </div>

              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                <div className="bg-blue-100 dark:bg-blue-900 w-16 h-16 rounded-full flex items-center justify-center mb-4 mx-auto">
                  <FaUsers className="text-3xl text-primary dark:text-blue-300"/>
                </div>
                <h3 className="text-xl font-semibold text-center text-gray-900 dark:text-white mb-3">
                  Inclusivity
                </h3>
                <p className="text-gray-700 dark:text-gray-300 text-center">
                  Creating opportunities for all students to learn and grow regardless of background
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Our Team Section */}
      <section className="py-16 bg-white dark:bg-gray-800">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-12">
            Our Team
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Team Member 1 */}
            <div className="flex flex-col items-center">
              <div className="w-40 h-40 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden mb-4 relative">
                <Image
                  src="/team-member1.jpeg"
                  alt="Team Member"
                  fill
                  className="object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = "https://via.placeholder.com/150?text=Team+Member";
                  }}
                />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Kofi Mensah</h3>
              <p className="text-primary dark:text-blue-300">Founder & CEO</p>
              <p className="text-gray-600 dark:text-gray-400 text-center mt-2">
                Former educator with 15 years of experience in Ghana's education system
              </p>
            </div>

            {/* Team Member 2 */}
            <div className="flex flex-col items-center">
              <div className="w-40 h-40 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden mb-4 relative">
                <Image
                  src="/team-member2.jpeg"
                  alt="Team Member"
                  fill
                  className="object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = "https://via.placeholder.com/150?text=Team+Member";
                  }}
                />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Ama Serwaa</h3>
              <p className="text-primary dark:text-blue-300">Chief Education Officer</p>
              <p className="text-gray-600 dark:text-gray-400 text-center mt-2">
                Curriculum development specialist with expertise in digital learning
              </p>
            </div>

            {/* Team Member 3 */}
            <div className="flex flex-col items-center">
              <div className="w-40 h-40 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden mb-4 relative">
                <Image
                  src="/team-member3.jpeg"
                  alt="Team Member"
                  fill
                  className="object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = "https://via.placeholder.com/150?text=Team+Member";
                  }}
                />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Kwame Osei</h3>
              <p className="text-primary dark:text-blue-300">Technology Director</p>
              <p className="text-gray-600 dark:text-gray-400 text-center mt-2">
                Tech entrepreneur with a passion for using technology to solve social challenges
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Partners Section */}
      <section className="py-16 bg-blue-50 dark:bg-gray-900">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-12">
            Our Partners
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md flex items-center justify-center h-32">
              <FaUniversity className="text-5xl text-primary dark:text-blue-300"/>
            </div>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md flex items-center justify-center h-32">
              <FaChalkboardTeacher className="text-5xl text-primary dark:text-blue-300"/>
            </div>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md flex items-center justify-center h-32">
              <FaBookReader className="text-5xl text-primary dark:text-blue-300"/>
            </div>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md flex items-center justify-center h-32">
              <FaGraduationCap className="text-5xl text-primary dark:text-blue-300"/>
            </div>
          </div>
          <div className="text-center mt-12">
            <p className="text-lg text-gray-700 dark:text-gray-300">
              We collaborate with schools, educational institutions, and organizations across Ghana to deliver quality education to all students.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-primary dark:bg-primary">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-6">
            Join the EduHub Community
          </h2>
          <p className="text-xl text-white mb-8 max-w-2xl mx-auto">
            Whether you're a student, teacher, or school administrator, there's a place for you in our growing educational ecosystem.
          </p>
          <Link
            href="/auth"
            className="bg-white text-primary hover:bg-gray-100 font-bold py-3 px-8 rounded-md transition-colors duration-300"
          >
            Get Started Today
          </Link>
        </div>
      </section>
    </div>
  );
};

export default AboutPage;