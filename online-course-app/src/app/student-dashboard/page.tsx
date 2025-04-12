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
            <div className = "min-h-screen flex flex-col items-start justify-items-start bg-blue-50 p-6 ">
                <section>
                    <div className="flex gap-20">

                            <div className="ml-20 bg-white rounded-xl p-8 w-80">
                                <h2 className="text-lg font-semibold text-black">Courses</h2>
                                <p className="text-base text-black">0</p>
                            </div>

                            <div className="bg-white rounded-xl p-8 w-80">
                                <h2 className="text-lg font-semibold text-black">To Do</h2>
                                <p className="text-base text-black">0</p>
                            </div>              
                        </div>
                </section>

                <section className="mt-8 w-full">
                    <div className="mt-8 w-full">
                        <div className="bg-blue-50">
                        <h2 className="text-lg font-semibold text-black">Courses</h2>
                        </div>
                    </div>
                </section>
            </div>  
    </div>  
    )
    
}