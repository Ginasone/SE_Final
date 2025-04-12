'use client';

import React from "react";

const StudentDashboard = () => {
    return(
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
    )
    
}