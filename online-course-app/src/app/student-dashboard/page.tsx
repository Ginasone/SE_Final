'use client';

import React from "react";

const StudentDashboard = () => {
    return (
        <div className="min-h-screen flex bg-blue-50">

            {/*Sidebar for Navigation*/}
            <div className="w-64 bg-white border-r shadow-sm">
                <div className="p-6">
                    <h1 className="text-xl font-bold mb-8">Student Portal</h1>
                    <nav>
                        <ul className="space-y-4">
                            <li>
                                <a href="#" className="flex items-center text-blue-600 font-medium">
                                    <span className="mr-2">📊</span>
                                    Dashboard
                                </a>
                            </li>

                            <li>
                                <a href="#" className="flex items-center text-gray-600 hover:text-blue-600">
                                    <span className="mr-2">📚</span>
                                    Courses
                                </a>
                            </li>

                            <li className="mt-auto pt-8">
                                <a href="#" className="flex items-center text-gray-600 hover:text-red-600">
                                    <span className="mr-2">🚪</span>
                                    Log out
                                </a>
                            </li>
                        </ul>
                    </nav>
                </div>
            </div>

            {/*Main Section*/}
            <div className="flex-1 p-6">
        <div className="flex justify-between items-center pb-4 mb-6">
          <h1 className="text-4xl text-gray-500 font-normal">Dashboard</h1>
          <button className="text-2xl text-gray-500">⋮</button>
        </div>

        {/* Stats section with course count and todo count */}
        <div className="flex gap-20 mb-8">
          <div className="ml-20 bg-white rounded-xl p-8 w-80">
            <h2 className="text-lg font-semibold text-black">Courses</h2>
            <p className="text-base text-black">0</p>
          </div>

          <div className="bg-white rounded-xl p-8 w-80">
            <h2 className="text-lg font-semibold text-black">Notifications</h2>
            <p className="text-base text-black">0</p>
          </div>
        </div>

        {/* Course cards section */}
        <section className="mt-8 w-full">
          <div className="bg-blue-50">
            <h2 className="text-lg font-semibold text-black">Courses</h2>
          </div>
          
          <div className="flex flex-wrap gap-4 mt-4">
            {/* Course card 1 */}
                       <div className="w-96 h-64 bg-green-200 rounded-lg overflow-hidden shadow-sm relative">
                            <div className="p-4 h-full flex flex-col">
                                <div className="flex justify-end">
                                    <button className="text-gray-700">⋮</button>
                                </div>
                            </div>
                            {/* White footer at bottom of card */}
                            <div className="absolute bottom-0 left-0 right-0 bg-white p-4">
                                <p className="text-base font-medium">Software Engineering</p>
                            </div>
                        </div>
            
            {/* Course card 2 */}
            <div className="w-96 h-64 bg-blue-200 rounded-lg overflow-hidden shadow-sm">
              <div className="p-4 h-full flex flex-col justify-between">
                <div className="flex justify-end">
                  <button className="text-white">⋮</button>
                </div>
                <div className="bg-white p-3 mt-auto">
                  <p className="text-sm font-medium">Web Technologies</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Right sidebar - To do section */}
      <div className="w-80 border-l bg-white p-6">
        <h2 className="text-lg font-medium mb-4">Notifications</h2>
        
        {/* Notification item 1 */}
        <div className="mb-6 border-b pb-2">
          <div className="flex justify-between">
            <div>
              <p className="text-red-500">New Quiz Added <span className="float-right">✕</span></p>
              <p className="text-sm text-gray-600">Web Technologies</p>
              <p className="text-sm text-gray-600">100 points | 30 Apr at 23:59</p>
            </div>
          </div>
        </div>
        
        {/* Todo item 2 */}
        <div className="mb-6 border-b pb-2">
          <div className="flex justify-between">
            <div>
              <p className="text-red-500">Chapter Added <span className="float-right">✕</span></p>
              <p className="text-sm text-gray-600">Software Engineering</p>
              <p className="text-sm text-gray-600">100 points | 30 Apr at 23:59</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
    