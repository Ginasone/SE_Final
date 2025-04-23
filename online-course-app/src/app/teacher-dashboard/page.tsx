'use client';

import React from "react";
import {FaBookReader} from 'react-icons/fa';
import { FaBookOpen } from "react-icons/fa";


const TeacherDashboard = () => {

    return(
        <div className="min-h-screen flex flex-col items-start justify-items-start bg-blue-50 p-6 ">
            <section>
                <div className="flex gap-20">
                    <div className="bg-white rounded-xl shadow-md p-8 w-80">
                        <h2 className="text-lg font-semibold text-black"><FaBookReader/>Students</h2>
                        <p className="text-base text-black">0</p>
                    </div>

                    <div className="ml-20 bg-white rounded-xl shadow-md p-8 w-80">
                        <h2 className="text-lg font-semibold text-black">Courses</h2>
                        <p className="text-base text-black">0</p>
                    </div>
                
                </div>
            </section>

            <section className="mt-8 w-full">
                <div className="mt-8 w-full">
                    <div className="bg-blue-50">
                    <h2 className="text-lg font-semibold text-black"><FaBookOpen />Courses</h2>
                    </div>
                </div>
            </section>
            

            

        </div>
    )
}

export default TeacherDashboard;