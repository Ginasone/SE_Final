'use client'

import React, { useState, useEffect } from "react";
import { FaSchool, FaUser, FaBook, FaPlus, FaEdit, FaTrash, FaKey, FaCopy, FaFilter, FaSort, FaUserGraduate, FaChalkboardTeacher, FaUserShield, FaUsersCog, FaCalendarAlt, FaUsers } from "react-icons/fa";
import { MdDashboard } from "react-icons/md";
import { useRouter } from "next/navigation";

interface School {
    id: number;
    name: string;
    location: string;
    contact_email: string;
    contact_phone: string;
    access_code: string;
    status: 'active' | 'inactive';
}

interface User {
    id: number;
    full_name: string;
    email: string;
    role: 'student' | 'teacher' | 'admin';
    school_id: number | null;
    school_name?: string;
    status: 'active' | 'inactive';
    created_at: string;
}

interface Course {
    id: number;
    title: string;
    description: string;
    school_id: number | null;
    school_name?: string;
    teacher_id: number | null;
    teacher_name?: string;
    start_date:string;
    end_date: string;
    status: 'draft' | 'published' | 'archived';
    student_count?: number;
    created_at: string;
}

export default function AdminDashboardPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [isAuthorized, setIsAuthorized] = useState(false);

    const [activeTab, setActiveTab] = useState('dashboard');
    const [schools, setSchools] = useState<School[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    const [users, setUsers] = useState<User[]>([]);
    const [userLoading, setUserLoading] = useState(true);
    const [userFilter, setUserFilter] = useState('all');
    const [userSearchTerm, setUserSearchTerm] = useState('');
    const [userForm, setUserForm] = useState({
        id: 0,
        full_name: '',
        email: '',
        role: 'student' as 'student' | 'teacher' | 'admin',
        school_id: null as number | null,
        password: '',
        confirmPassword: '',
        status: 'active' as 'active' | 'inactive'
    });
    const [isUserEditMode, setIsUserEditMode] = useState(false);
    const [showUserForm, setShowUserForm] = useState(false);
    const [isResetPassword, setIsResetPassword] = useState(false);

    const [schoolForm, setSchoolForm] = useState({
        id: 0,
        name: '',
        location: '',
        contact_email: '',
        contact_phone: '',
        access_code: '',
        status: 'active' as 'active' | 'inactive'
    });

    const [isEditMode, setIsEditMode] = useState(false);
    const [showSchoolForm, setShowSchoolForm] = useState(false);
    const [regeneratingCodeFor, setRegeneratingCodeFor] = useState<number | null>(null);

    const [courses, setCourses] = useState<Course[]>([]);
    const [courseLoading, setCourseLoading] = useState(true);
    const [courseFilter, setCourseFilter] = useState('all');
    const [courseSearchTerm, setCourseSearchTerm] = useState('');
    const [courseForm, setCourseForm] = useState({
        id: 0,
        title: '',
        description: '',
        school_id: null as number | null,
        teacher_id: null as number | null,
        start_date:'',
        end_date: '',
        status: 'draft' as 'draft' | 'published' | 'archived'
    });
    const [isCourseEditMode, setIsCourseEditMode] = useState(false);
    const [showCourseForm, setShowCourseForm] = useState(false);
    const [teachers, setTeachers] = useState<User[]>([]);

    useEffect(() => {
        const token = localStorage.getItem('user-token');
        const userRole = localStorage.getItem('user-role');

        if (!token){
            router.push('/auth');
            return;
        }

        if (userRole !== 'admin'){
            const dashboardPath = userRole === 'teacher' ? '/teacher-dashboard' : '/student-dashboard';
            router.push(dashboardPath);
            return;
        }

        setIsAuthorized(true);
        setIsLoading(false);

        if (isAuthorized){
            fetchSchools();
            fetchUsers();
            fetchCourses();
            fetchTeachers();
        }
        
        if (courseForm.school_id) {
            const teachersForSchool = teachers.filter(teacher => 
              teacher.school_id === courseForm.school_id
            );
            console.log(`Filtered teachers for school ${courseForm.school_id}:`, teachersForSchool);
        }
    }, [ router, isAuthorized]);

    const fetchSchools = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/admin/schools');
            if (!response.ok){
                throw new Error('Failed to fetch schools');
            }
            const data = await response.json();
            setSchools(data.schools || []);
        }
        catch (err){
            console.error('Error fetching schools:', err);
            setError('Failed to load schools. Please try again later');
        }
        finally{
            setLoading(false);
        }
    };

    const resetSchoolForm = () => {
        setSchoolForm({
            id: 0,
            name: '',
            location: '',
            contact_email: '',
            contact_phone: '',
            access_code: '',
            status: 'active'
        });
        setIsEditMode(false);
    };

    const generateAccessCode = () => {
        const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        let result = '';
        for (let i = 0; i < 6; i++){
            result += characters.charAt(Math.floor(Math.random() * characters.length));
        }
        return result;
    };

    const handleSchoolFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            if (!schoolForm.name || !schoolForm.location || !schoolForm.contact_email){
                setError("Name, location, and contact email required");
                return;
            }

            const formData = { ...schoolForm };
            if (!isEditMode || !formData.access_code){
                formData.access_code = generateAccessCode();
            }

            const dataToSend = {
                name: formData.name,
                location: formData.location,
                contact_email: formData.contact_email,
                contact_phone: formData.contact_phone || '',
                access_code: formData.access_code,
                status: formData.status || 'active'
            };

            console.log("Sending data:", dataToSend);

            const url = isEditMode
            ? `/api/admin/schools/${formData.id}`
            : '/api/admin/schools';

            const method = isEditMode ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            if (!response.ok){
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to save school');
            }
            await fetchSchools();

            resetSchoolForm();
            setShowSchoolForm(false);

            setSuccessMessage(isEditMode ? 'School updated successfully!' : 'School created successfully');

            setTimeout(() => {
                setSuccessMessage('');
            }, 3000);
        }
        catch (err){
            console.error('Error saving school:', err);
            setError(err instanceof Error ? err.message : 'An unexpected error occurred');
        }
    };

    const handleEditSchool = (school: School) => {
        setSchoolForm({
            id: school.id,
            name: school.name,
            location: school.location,
            contact_email: school.contact_email,
            contact_phone: school.contact_phone,
            access_code: school.access_code,
            status: school.status
        });
        setIsEditMode(true);
        setShowSchoolForm(true);
    };

    const handleDeleteSchool = async (id: number) => {
        if (!confirm('Are you sure you want to delete this school?')){
            return;
        }
        try {
            const response = await fetch(`/api/admin/schools/${id}`, {
                method: 'DELETE',
            });
            if (!response.ok){
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to delete school');
            }
            await fetchSchools();

            setSuccessMessage('School deleted successfully!');

            setTimeout(() => {
                setSuccessMessage('');
            }, 3000);
        }
        catch (err){
            console.error('Error deleting school:', err);
            setError(err instanceof Error ? err.message : 'An unexpected error occurred');
        }
    };

    const handleRegenerateCode = async (schoolId: number) => {
        setRegeneratingCodeFor(schoolId);

        try {
            const newCode = generateAccessCode();

            const response = await fetch(`/api/admin/schools/${schoolId}/regenerate-code`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ access_code: newCode}),
            });

            if (!response.ok){
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to regenerate access code');
            }
            await fetchSchools();

            setSuccessMessage('Access code regenerated successfully!');

            setTimeout(() => {
                setSuccessMessage('');
            }, 3000);
        }
        catch (err) {
            console.error('Error regenerating access code:', err);
            setError(err instanceof Error ? err.message : 'An unexpected error occurred')
        }
        finally{
            setRegeneratingCodeFor(null);
        }
    };

    const handleCopyCode = (code: string) => {
        navigator.clipboard.writeText(code)
            .then(() => {
                setSuccessMessage('Access code copied to clipboard!');

                setTimeout(() => {
                    setSuccessMessage('');
                }, 3000);
            })
            .catch((err) => {
                console.error('Failed to copy code:', err);
                setError('Failed to copy access code to clipboard');
            });
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setSchoolForm(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const fetchUsers = async () => {
        setUserLoading(true);
        try {
            const response = await fetch('/api/admin/users');
            if (!response.ok){
                throw new Error('Failed to fetch users');
            }
            const data = await response.json();
            setUsers(data.users || []);
        }
        catch (err){
            console.error('Error fetching users:', err);
            setError('Failed to load users. Please try again later');
        }
        finally{
            setUserLoading(false);
        }
    };

    const fetchTeachers = async () => {
        try {
            const response = await fetch('/api/admin/teachers');
            if (!response.ok){
                throw new Error('Faield to fetch teachers');
            }
            const data = await response.json();
            setTeachers(data.teachers || []);
        }
        catch (err){
            console.error('Error fetching teachers:', err);
        }
    }

    const resetUserForm = () => {
        setUserForm({
            id: 0,
            full_name: '',
            email: '',
            role: 'student',
            school_id: null,
            password: '',
            confirmPassword: '',
            status: 'active'
        });
        setIsUserEditMode(false);
        setIsResetPassword(false);
    };

    const handleUserFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            if (!userForm.full_name || !userForm.email){
                setError("Name, and contact email required");
                return;
            }

            if (!isUserEditMode && (!userForm.password || userForm.password.length < 6)) {
                setError('Password must be at least 6 characters long');
                return;
            }

            if ((!isUserEditMode || isResetPassword) && userForm.password !== userForm.confirmPassword){
                setError('Passwords do not match');
                return;
            }
            
            const userData = {
                ...userForm,
                ...((!isUserEditMode || isResetPassword) ? { password: userForm.password } : {})
            };

            const { confirmPassword, ...dataToSend } = userData;

            const url = isUserEditMode
            ? `/api/admin/users/${userForm.id}`
            : '/api/admin/users';

            const method = isUserEditMode ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(dataToSend),
            });

            if (!response.ok){
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to save user');
            }
            await fetchUsers();

            resetUserForm();
            setShowUserForm(false);

            setSuccessMessage(isUserEditMode ? 'User updated successfully!' : 'User created successfully');

            setTimeout(() => {
                setSuccessMessage('');
            }, 3000);
        }
        catch (err){
            console.error('Error saving user:', err);
            setError(err instanceof Error ? err.message : 'An unexpected error occurred');
        }
    };

    const handleEditUser = (user: User) => {
        setUserForm({
            id: user.id,
            full_name: user.full_name,
            email: user.email,
            role: user.role,
            school_id: user.school_id,
            password: '',
            confirmPassword: '',
            status: user.status || 'active'
        });
        setIsUserEditMode(true);
        setIsResetPassword(false);
        setShowUserForm(true);
    };

    const handleDeleteUser = async (id: number) => {
        if (!confirm('Are you sure you want to delete this user?')){
            return;
        }
        try {
            const response = await fetch(`/api/admin/users/${id}`, {
                method: 'DELETE',
            });
            if (!response.ok){
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to delete user');
            }
            await fetchUsers();

            setSuccessMessage('User deleted successfully!');

            setTimeout(() => {
                setSuccessMessage('');
            }, 3000);
        }
        catch (err){
            console.error('Error deleting user:', err);
            setError(err instanceof Error ? err.message : 'An unexpected error occurred');
        }
    };

    const handleUserInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setUserForm(prev => ({
            ...prev,
            [name]: name === 'school_id' ? (value ? parseInt(value) : null) : value
        }));
    };

    const handleToggleResetPassword = () => {
        setIsResetPassword(!isResetPassword);
        if (!isResetPassword){
            setUserForm(prev => ({
                ...prev,
                password: '',
                confirmPassword: ''
            }));
        }
    };

    const filteredUsers = users.filter(user => {
        if (userFilter !== 'all' && user.role !== userFilter){
            return false;
        }
        if (
            userSearchTerm &&
            !user.full_name.toLowerCase().includes(userSearchTerm.toLowerCase()) &&
            !user.email.toLowerCase().includes(userSearchTerm.toLowerCase())
        ){
            return false;
        }
        return true;
    });

    const fetchCourses = async () => {
        setCourseLoading(true);
        try {
            const response = await fetch('/api/admin/courses');
            if (!response.ok){
                throw new Error('Failed to fetch courses');
            }
            const data = await response.json();
            setCourses(data.courses || []);
        }
        catch (err){
            console.error('Error fetching courses:', err);
            setError('Failed to load courses. Please try again later');
        }
        finally{
            setCourseLoading(false);
        }
    };

    const resetCourseForm = () => {
        setCourseForm({
            id: 0,
            title: '',
            description: '',
            school_id: null,
            teacher_id: null,
            start_date: '',
            end_date: '',
            status: 'draft'
        });
        setIsCourseEditMode(false);
    };

    const handleCourseFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            if (!courseForm.title){
                setError("Course title is required");
                return;
            }

            if (courseForm.status !== 'draft' && !courseForm.school_id) {
                setError('School must be selected for published courses');
                return;
            }
            
            const formattedData = {
                ...courseForm,
                start_date: courseForm.start_date || null,
                end_date: courseForm.end_date || null
            };

            const url = isCourseEditMode
            ? `/api/admin/courses/${courseForm.id}`
            : '/api/admin/courses';

            const method = isCourseEditMode ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formattedData),
            });

            if (!response.ok){
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to save course');
            }
            await fetchCourses();

            resetCourseForm();
            setShowCourseForm(false);

            setSuccessMessage(isCourseEditMode ? 'Course updated successfully!' : 'Course created successfully');

            setTimeout(() => {
                setSuccessMessage('');
            }, 3000);
        }
        catch (err){
            console.error('Error saving course:', err);
            setError(err instanceof Error ? err.message : 'An unexpected error occurred');
        }
    };

    const handleEditCourse = (course: Course) => {
        setCourseForm({
            id: course.id,
            title: course.title,
            description: course.description || '',
            school_id: course.school_id,
            teacher_id: course.teacher_id,
            start_date: course.start_date ? new Date(course.start_date).toISOString().split('T')[0] : '',
            end_date: course.end_date ? new Date(course.end_date).toISOString().split('T')[0] : '',
            status: course.status
        });
        setIsCourseEditMode(true);
        setShowCourseForm(true);
    };

    const handleDeleteCourse = async (id: number) => {
        if (!confirm('Are you sure you want to delete this course?')){
            return;
        }
        try {
            const response = await fetch(`/api/admin/courses/${id}`, {
                method: 'DELETE',
            });
            if (!response.ok){
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to delete course');
            }
            await fetchCourses();

            setSuccessMessage('Course deleted successfully!');

            setTimeout(() => {
                setSuccessMessage('');
            }, 3000);
        }
        catch (err){
            console.error('Error deleting course:', err);
            setError(err instanceof Error ? err.message : 'An unexpected error occurred');
        }
    };

    const handleCourseInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setCourseForm(prev => ({
            ...prev,
            [name]: ['school_id', 'teacher_id'].includes(name)
            ? (value ? parseInt(value, 10) : null)
            : value
        }));
    };
    const filteredCourses = courses.filter(course => {
        if (courseFilter !== 'all' && course.status !== courseFilter){
            return false;
        }
        if (
            courseSearchTerm &&
            !course.title.toLowerCase().includes(courseSearchTerm.toLowerCase()) &&
            !(course.description && course.description.toLowerCase().includes(courseSearchTerm.toLowerCase())) &&
            !(course.school_name && course.school_name.toLowerCase().includes(courseSearchTerm.toLowerCase()))
        ){
            return false;
        }
        return true;
    });

    const filteredTeachers = teachers.filter(teacher => 
        !courseForm.school_id || teacher.school_id === courseForm.school_id
    );

    if (isLoading){
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!isAuthorized){
        return null;
    }

    const stats = [
        { title: 'Schools', count: schools.length, icon: <FaSchool className="text-blue-500" size={24} /> },
        { title: 'Users', count: users.length, icon: <FaUser className="text-green-500" size={24} /> },
        { title: 'Courses', count: courses.length, icon: <FaBook className="text-yellow-500" size={24} /> },
    ];

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <div className="flex flex-col md:flex-row">
                <div className="w-full md:w-64 bg-white dark:bg-gray-800 shadow md:h-screen">
                    <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                        <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Admin Panel</h2>
                    </div>
                    <nav className="p-4">
                        <ul className="space-y-2">
                            <li>
                                <button
                                    onClick={() => setActiveTab('dashboard')}
                                    className={`w-full text-left flex items-center p-2 rounded-md ${
                                        activeTab === 'dashboard'
                                        ? 'bg-primary text-white'
                                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                                    }`}
                                >
                                    <MdDashboard className="mr-2"/>
                                    Dashboard
                                </button>
                            </li>
                            <li>
                                <button
                                    onClick={() => setActiveTab('schools')}
                                    className={`w-full text-left flex items-center p-2 rounded-md ${
                                        activeTab === 'schools'
                                        ? 'bg-primary text-white'
                                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                                    }`}
                                >
                                    <FaSchool className="mr-2"/>
                                    Schools
                                </button>
                            </li>
                            <li>
                                <button
                                    onClick={() => setActiveTab('users')}
                                    className={`w-full text-left flex items-center p-2 rounded-md ${
                                        activeTab === 'users'
                                        ? 'bg-primary text-white'
                                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                                    }`}
                                >
                                    <FaUser className="mr-2"/>
                                    Users
                                </button>
                            </li>
                            <li>
                                <button
                                    onClick={() => setActiveTab('courses')}
                                    className={`w-full text-left flex items-center p-2 rounded-md ${
                                        activeTab === 'courses'
                                        ? 'bg-primary text-white'
                                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                                    }`}
                                >
                                    <FaBook className="mr-2"/>
                                    Courses
                                </button>
                            </li>
                        </ul>
                    </nav>
                </div>

                <div className="flex-1 p-6">
                    {error && (
                        <div className="bg-red-100 dark:bg-red-900 border border-red-400 text-red-700 dark:text-red-200 px-4 py-3 rounded relative mb-4" role="alert">
                            <span className="block sm:inline">{error}</span>
                            <button
                                className="absolute top-0 bottom-0 right-0 px-4 py-3"
                                onClick={() => setError('')}
                            >
                                <span className="sr-only">Close</span>
                                <svg className="fill-current h-6 w-6 text-red-500" role="button" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                                    <path d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.819l-2.651 3.029a1.2 1.2 0 1 1-1.697-1.697l2.758-3.15-2.759-3.152a1.2 1.2 0 1 1 1.697-1.697L10 8.183l2.651-3.031a1.2 1.2 0 1 1 1.697 1.697l-2.758 3.152 2.758 3.15a1.2 1.2 0 0 1 0 1.698z"/>
                                </svg>
                            </button>
                        </div>
                    )}

                    {successMessage && (
                        <div className="bg-green-100 dark:bg-green-900 border border-green-400 text-green-700 dark:text-green-200 px-4 py-3 rounded relative mb-4" role="alert">
                            <span className="block sm:inline">{successMessage}</span>
                            <button
                                className="absolute top-0 bottom-0 right-0 px-4 py-3"
                                onClick={() => setSuccessMessage('')}
                            >
                                <span className="sr-only">Close</span>
                                <svg className="fill-current h-6 w-6 text-green-500" role="button" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                                    <path d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.819l-2.651 3.029a1.2 1.2 0 1 1-1.697-1.697l2.758-3.15-2.759-3.152a1.2 1.2 0 1 1 1.697-1.697L10 8.183l2.651-3.031a1.2 1.2 0 1 1 1.697 1.697l-2.758 3.152 2.758 3.15a1.2 1.2 0 0 1 0 1.698z"/>
                                </svg>
                            </button>
                        </div>
                    )}

                    {activeTab === 'dashboard' && (
                        <div>
                            <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">Admin Dashboard</h1>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                                {stats.map((stat, index) => (
                                    <div key={index} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 flex justify-between items-center">
                                        <div>
                                            <h3 className="text-lg font-semibold text-gray-600 dark:text-gray-300">{stat.title}</h3>
                                            <p className="text-3xl font-bold text-gray-800 dark:text-white">{stat.count}</p>
                                        </div>
                                        <div className="p-3 rounded-full bg-blue-50 dark:bg-blue-900">
                                            {stat.icon}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                                <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Welcome to EduHub, Admin!</h2>
                                <p className="text-gray-600 dark:text-gray-300">
                                    From this dashboard, you can manage schools, users, and courses. Each school has a unique access code that you can provide to teachers and students for registration
                                </p>
                                <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900 rounded-lg">
                                    <h3 className="text-lg font-medium text-blue-700 dark:text-blue-200 mb-2">Quick Tips:</h3>
                                    <ul className="list-disc list-inside text-blue-600 dark:text-blue-300 space-y-1">
                                        <li>Generate access codes</li>
                                        <li>Share these codes with teachers and students</li>
                                        <li>You can generate access codes if needed</li>
                                        <li>Manage school information and status</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'schools' && (
                        <div>
                            <div className="flex justify-between items-center mb-6">
                                <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Manage Schools</h1>
                                <button
                                    onClick={() => {
                                        resetSchoolForm();
                                        setShowSchoolForm(true);
                                    }}
                                    className="bg-primary hover:bg-secondary text-white px-4 py-2 rounded-md flex items-center"
                                >
                                    <FaPlus className="mr-2"/>
                                    Add School
                                </button>
                            </div>

                            {loading ? (
                                <div className="flex justify-center items-center h-64">
                                    <div className="animate-spin rounded-ful lh-12 w-12 border-t-2 border-b-2 border-primary"></div>
                                </div>
                            ) : schools.length === 0 ? (
                                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 text-center">
                                    <p className="text-gray-600 dark:text-gray-300">No schools found. Add your first school to get started!</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="min-w-full bg-white dark:bg-gray-800 rounded-lg shadow-md">
                                        <thead>
                                            <tr className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 uppercase text-sm leading-normal">
                                                <th className="py-3 px-6 text-left">Name</th>
                                                <th className="py-3 px-6 text-left">Location</th>
                                                <th className="py-3 px-6 text-left">Contact</th>
                                                <th className="py-3 px-6 text-left">Access Code</th>
                                                <th className="py-3 px-6 text-left">Status</th>
                                                <th className="py-3 px-6 text-left">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="text-gray-600 dark:text-gray-300 text-sm">
                                            {schools.map((school) => (
                                                <tr key={school.id} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                                                    <td className="py-3 px-6 text-left">{school.name}</td>
                                                    <td className="py-3 px-6 text-left">{school.location}</td>
                                                    <td className="py-3 px-6 text-left">
                                                        <div>{school.contact_email}</div>
                                                        <div className="text-xs text-gray-500 dark:text-gray-400">{school.contact_phone}</div>
                                                    </td>
                                                    <td className="py-3 px-6 text-left">
                                                        <div className="flex items-center">
                                                            <span className="font-mono bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded mr-2">
                                                                {school.access_code}
                                                            </span>
                                                            <button
                                                                onClick={() => handleCopyCode(school.access_code)}
                                                                className="text-gray-500 hover:text-primary dark:text-gray-400 dark:hover:text-blue-300"
                                                                title="Copy code"
                                                            >
                                                                <FaCopy />
                                                            </button>
                                                        </div>
                                                        <button
                                                            onClick={() => handleRegenerateCode(school.id)}
                                                            className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center mt-1"
                                                            disabled={regeneratingCodeFor === school.id}
                                                        >
                                                            {regeneratingCodeFor === school.id ? (
                                                                <span>Regenerating...</span>
                                                            ) : (
                                                                <>
                                                                    <FaKey className="mr-1" size={10}/>
                                                                    Regenerate
                                                                </>
                                                            )}
                                                        </button>
                                                    </td>
                                                    <td className="py-3 px-6 text-left">
                                                        <span className={`px-2 py-1 rounded-full text-xs ${
                                                            school.status === 'active'
                                                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                                            : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                                        }`}>
                                                            {school.status}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 px-6 text-center">
                                                        <div className="flex item-center justify-center">
                                                            <button
                                                                onClick={() => handleEditSchool(school)}
                                                                className="transform hover:text-primary hover:scale-110 mr-3"
                                                                title="Edit school"
                                                            >
                                                                <FaEdit />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteSchool(school.id)}
                                                                className="transform hover:text-red-500 hover:scale-110"
                                                                title="Delete school"
                                                            >
                                                                <FaTrash />
                                                            </button>
                                                        </div>
                                                    </td>    
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {showSchoolForm && (
                                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md">
                                        <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
                                            {isEditMode ? 'Edit School' : 'Add New School'}
                                        </h2>
                                        {isEditMode && (
                                            <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900 rounded-md">
                                                <p className="text-sm text-blue-700 dark:text-blue-200">
                                                    <span className="font-semibold">Access Code:</span> {schoolForm.access_code}
                                                </p>
                                            </div>
                                        )}
                                        <form onSubmit={handleSchoolFormSubmit}>
                                            <div className="mb-4">
                                                <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2" htmlFor="name">
                                                    School Name
                                                </label>
                                                <input
                                                    type="text"
                                                    id="name"
                                                    name="name"
                                                    value={schoolForm.name}
                                                    onChange={handleInputChange}
                                                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 dark:text-white dark:bg-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                                    required
                                                />
                                            </div>
                                            <div className="mb-4">
                                                <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2" htmlFor="location">
                                                    Location
                                                </label>
                                                <input
                                                    type="text"
                                                    id="location"
                                                    name="location"
                                                    value={schoolForm.location}
                                                    onChange={handleInputChange}
                                                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 dark:text-white dark:bg-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                                    required
                                                />
                                            </div>
                                            <div className="mb-4">
                                                <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2" htmlFor="contact_email">
                                                    Contact Email
                                                </label>
                                                <input
                                                    type="email"
                                                    id="contact_email"
                                                    name="contact_email"
                                                    value={schoolForm.contact_email}
                                                    onChange={handleInputChange}
                                                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 dark:text-white dark:bg-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                                    required
                                                />
                                            </div>
                                            <div className="mb-4">
                                                <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2" htmlFor="contact_phone">
                                                    Contact Phone
                                                </label>
                                                <input
                                                    type="text"
                                                    id="contact_phone"
                                                    name="contact_phone"
                                                    value={schoolForm.contact_phone}
                                                    onChange={handleInputChange}
                                                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 dark:text-white dark:bg-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                                    required
                                                />
                                            </div>
                                            <div className="mb-4">
                                                <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2" htmlFor="status">
                                                    Status
                                                </label>
                                                <select
                                                    id="status"
                                                    name="status"
                                                    value={schoolForm.status}
                                                    onChange={handleInputChange}
                                                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 dark:text-white dark:bg-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                                >
                                                    <option value="active">Active</option>
                                                    <option value="inactive">Inactive</option>
                                                </select>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <button
                                                    type="submit"
                                                    className="bg-primary hover:bg-secondary text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                                                >
                                                    Save
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setShowSchoolForm(false)}
                                                    className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        </form>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'users' && (
                        <div>
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
                                <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">Manage Users</h1>
                                <div className="flex flex-col sm:flex-row w-full md:w-auto gap-3">
                                    <div className="relative">
                                        <input
                                            type="text"
                                            placeholder="Search users..."
                                            value={userSearchTerm}
                                            onChange={(e) => setUserSearchTerm(e.target.value)}
                                            className="py-2 px-4 pr-10 border border-gray-300 dark:border-gray-600 rounded-md w-full shadow-sm focus:ring-primary focus:border-primary dark:bg-gray-700 dark:text-white"
                                        />
                                        <span className="absolute right-3 top-2.5 text-gray-400">
                                            <FaFilter/>
                                        </span>
                                    </div>
                                    <select
                                        value={userFilter}
                                        onChange={(e) => setUserFilter(e.target.value)}
                                        className="py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary focus:border-primary dark:bg-gray-700 dark:text-white"
                                    >
                                        <option value="all">All Roles</option>
                                        <option value="student">Students</option>
                                        <option value="teacher">Teachers</option>
                                        <option value="admin">Admins</option>
                                    </select>
                                    <button
                                        onClick={() => {
                                            resetUserForm();
                                            setShowUserForm(true);
                                        }}
                                        className="bg-primary hover:bg-secondary text-white px-4 py-2 rounded-md flex items-center justify-center"
                                    >
                                        <FaPlus className="mr-2"/>
                                        Add User
                                    </button>
                                </div>
                            </div>
                            
                            {userLoading ? (
                                <div className="flex justify-center items-center h-64">
                                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                                </div>
                            ) : filteredUsers.length === 0 ? (
                                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 text-center">
                                    <p className="text-gray-600 dark:text-gray-300">
                                        {userSearchTerm || userFilter !== 'all'
                                            ? 'No users match your search criteria'
                                            : 'No users found. Add your first user to get started'
                                        }
                                    </p>
                                </div>
                            ) : (
                                <div className="overflow-x auto">
                                    <table className="min-w-full bg-white dark:bg-gray-800 rounded-lg shadow-md">
                                        <thead>
                                            <tr className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 uppercase text-sm leading-normal">
                                                <th className="py-3 px-6 text-left">Name</th>
                                                <th className="py-3 px-6 text-left">Email</th>
                                                <th className="py-3 px-6 text-left">Role</th>
                                                <th className="py-3 px-6 text-left">School</th>
                                                <th className="py-3 px-6 text-left">Status</th>
                                                <th className="py-3 px-6 text-left">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="text-gray-600 dark:text-gray-300 text-sm">
                                            {filteredUsers.map((user) => (
                                                <tr key={user.id} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                                                    <td className="py-3 px-6 text-left">{user.full_name}</td>
                                                    <td className="py-3 px-6 text-left">{user.email}</td>
                                                    <td className="py-3 px-6 text-left">
                                                        <div className="flex items-center">
                                                            {user.role === 'student' && <FaUserGraduate className="mr-2 text-blue-500" />}
                                                            {user.role === 'teacher' && <FaChalkboardTeacher className="mr-2 text-green-500" />}
                                                            {user.role === 'admin' && <FaUserShield className="mr-2 text-red-500" />}
                                                            <span className="capitalize">{user.role}</span>
                                                        </div>
                                                    </td>
                                                    <td className="py-3 px-6 text-left">
                                                        {user.school_name || (user.role === 'admin' ? 'N/A' : 'Not assigned')}
                                                    </td>
                                                    <td className="py-3 px-6 text-left">
                                                        <span className={`px-2 py-1 rounded-full text-xs ${
                                                            user.status === 'active'
                                                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                                            : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                                        }`}>
                                                            {user.status || 'active'}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 px-6 text-center">
                                                        <div className="flex item-center justify-center">
                                                            <button
                                                                onClick={() => handleEditUser(user)}
                                                                className="transform hover:text-primary hover:scale-110 mr-3"
                                                                title="Edit User"
                                                            >
                                                                <FaEdit/>
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteUser(user.id)}
                                                                className="transform hover:text-red-500 hover:scale-110"
                                                                title="Delete User"
                                                            >
                                                                <FaTrash/>
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {showUserForm && (
                                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md overflow-y-auto max-h-[90vh]">
                                        <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
                                            {isUserEditMode ? 'Edit User' : 'Add New User'}
                                        </h2>
                                        <form onSubmit={handleUserFormSubmit}>
                                            <div className="mb-4">
                                                <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2" htmlFor="full_name">
                                                    Full Name
                                                </label>
                                                <input
                                                    type="text"
                                                    id="full_name"
                                                    name="full_name"
                                                    value={userForm.full_name}
                                                    onChange={handleUserInputChange}
                                                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 dark:text-white dark:bg-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                                    required
                                                />
                                            </div>
                                            <div className="mb-4">
                                                <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2" htmlFor="email">
                                                    Email
                                                </label>
                                                <input
                                                    type="email"
                                                    id="email"
                                                    name="email"
                                                    value={userForm.email}
                                                    onChange={handleUserInputChange}
                                                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 dark:text-white dark:bg-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                                    required
                                                />
                                            </div>
                                            <div className="mb-4">
                                                <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2" htmlFor="role">
                                                    Role
                                                </label>
                                                <select
                                                    id="role"
                                                    name="role"
                                                    value={userForm.role}
                                                    onChange={handleUserInputChange}
                                                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 dark:text-white dark:bg-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                                >
                                                    <option value="student">Student</option>
                                                    <option value="teacher">Teacher</option>
                                                    <option value="admin">Admin</option>
                                                </select>
                                            </div>
                                            {userForm.role !== 'admin' && (
                                                <div className="mb-4">
                                                    <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2" htmlFor="school_id">
                                                        School
                                                    </label>
                                                    <select
                                                        id="school_id"
                                                        name="school_id"
                                                        value={userForm.school_id || ''}
                                                        onChange={handleUserInputChange}
                                                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 dark:text-white dark:bg-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                                    >
                                                        <option value="">Select a school</option>
                                                        {schools.map(school => (
                                                            <option key={school.id} value={school.id}>{school.name}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            )}
                                            <div className="mb-4">
                                                <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2" htmlFor="status">
                                                    Status
                                                </label>
                                                <select
                                                    id="status"
                                                    name="status"
                                                    value={userForm.status}
                                                    onChange={handleUserInputChange}
                                                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 dark:text-white dark:bg-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                                >
                                                    <option value="active">Active</option>
                                                    <option value="inactive">Inactive</option>
                                                </select>
                                            </div>

                                            {isUserEditMode && (
                                                <div className="mb-4">
                                                    <button
                                                        type="button"
                                                        onClick={handleToggleResetPassword}
                                                        className="text-primary hover:text-secondary dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium"
                                                    >
                                                        {isResetPassword ? 'Cancel Password Reset' : 'Reset Password'}
                                                    </button>
                                                </div>
                                            )}

                                            {(!isUserEditMode || isResetPassword) && (
                                                <>
                                                    <div className="mb-4">
                                                        <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2" htmlFor="password">
                                                            Password
                                                        </label>
                                                        <input
                                                            type="password"
                                                            id="password"
                                                            name="password"
                                                            value={userForm.password}
                                                            onChange={handleUserInputChange}
                                                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 dark:text-white dark:bg-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                                            required={!isUserEditMode || isResetPassword}
                                                            minLength={6}
                                                        />
                                                    </div>
                                                    <div className="mb-4">
                                                        <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2" htmlFor="confirmPassword">
                                                            Confirm Password
                                                        </label>
                                                        <input
                                                            type="password"
                                                            id="confirmpassword"
                                                            name="confirmpassword"
                                                            value={userForm.confirmPassword}
                                                            onChange={handleUserInputChange}
                                                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 dark:text-white dark:bg-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                                            required={!isUserEditMode || isResetPassword}
                                                        />
                                                    </div>
                                                </>
                                            )}
                                            
                                            <div className="flex items-center justify-between">
                                                <button
                                                    type="submit"
                                                    className="bg-primary hover:bg-secondary text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                                                >
                                                    Save
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setShowUserForm(false)}
                                                    className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        </form>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'courses' && (
                        <div>
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
                            <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">Manage Courses</h1>
                            <div className="flex flex-col sm:flex-row w-full md:w-auto gap-3">
                                <div className="relative">
                                    <input
                                        type="text"
                                        placeholder="Search courses..."
                                        value={courseSearchTerm}
                                        onChange={(e) => setCourseSearchTerm(e.target.value)}
                                        className="py-2 px-4 pr-10 border border-gray-300 dark:border-gray-600 rounded-md w-full shadow-sm focus:ring-primary focus:border-primary dark:bg-gray-700 dark:text-white"
                                    />
                                    <span className="absolute right-3 top-2.5 text-gray-400">
                                        <FaFilter/>
                                    </span>
                                </div>
                                <select
                                    value={courseFilter}
                                    onChange={(e) => setCourseFilter(e.target.value)}
                                    className="py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary focus:border-primary dark:bg-gray-700 dark:text-white"
                                >
                                    <option value="all">All Status</option>
                                    <option value="draft">Draft</option>
                                    <option value="published">Published</option>
                                    <option value="archived">Archived</option>
                                </select>
                                <button
                                    onClick={() => {
                                        resetCourseForm();
                                        setShowCourseForm(true);
                                    }}
                                    className="bg-primary hover:bg-secondary text-white px-4 py-2 rounded-md flex items-center justify-center"
                                >
                                    <FaPlus className="mr-2"/>
                                    Add Course
                                </button>
                            </div>
                        </div>
                        
                        {courseLoading ? (
                            <div className="flex justify-center items-center h-64">
                                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                            </div>
                        ) : filteredCourses.length === 0 ? (
                            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 text-center">
                                <p className="text-gray-600 dark:text-gray-300">
                                    {courseSearchTerm || courseFilter !== 'all'
                                        ? 'No courses match your search criteria'
                                        : 'No courses found. Add your first course to get started'
                                    }
                                </p>
                            </div>
                        ) : (
                            <div className="overflow-x auto">
                                <table className="min-w-full bg-white dark:bg-gray-800 rounded-lg shadow-md">
                                    <thead>
                                        <tr className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 uppercase text-sm leading-normal">
                                            <th className="py-3 px-6 text-left">Title</th>
                                            <th className="py-3 px-6 text-left">School</th>
                                            <th className="py-3 px-6 text-left">Teacher</th>
                                            <th className="py-3 px-6 text-left">Dates</th>
                                            <th className="py-3 px-6 text-left">Status</th>
                                            <th className="py-3 px-6 text-left">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="text-gray-600 dark:text-gray-300 text-sm">
                                        {filteredCourses.map((course) => (
                                            <tr key={course.id} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                                                <td className="py-3 px-6 text-left">
                                                    <div className="font-medium">{course.title}</div>
                                                    {course.description && (
                                                        <div className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-xs">
                                                            {course.description.substring(0, 60)}{course.description.length > 60 ? '...' : ''}
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="py-3 px-6 text-left">{course.school_name || 'Not assigned'}</td>
                                                <td className="py-3 px-6 text-left">{course.teacher_name || 'Not assigned'}</td>
                                                <td className="py-3 px-6 text-left">
                                                    {course.start_date ? (
                                                        <div>
                                                            <div className="flex items-center">
                                                                <FaCalendarAlt className="mr-1 text-blue-500" size={12}/>
                                                                <span>Start: {new Date(course.start_date).toLocaleDateString()}</span>
                                                            </div>
                                                            {course.end_date && (
                                                                <div className="flex items-center mt-1">
                                                                    <FaCalendarAlt className="mr-1 text-red-500" size={12} />
                                                                    <span>End: {new Date(course.end_date).toLocaleDateString()}</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <span className="text-gray-400">No dates set</span>
                                                    )}
                                                    
                                                </td>
                                                <td className="py-3 px-6 text-left">
                                                    <span className={`px-2 py-1 rounded-full text-xs ${
                                                        course.status === 'published'
                                                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                                        : course.status === 'draft'
                                                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                                                        : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                                                    }`}>
                                                        {course.status}
                                                    </span>
                                                    {course.student_count !== undefined && (
                                                        <div className="flex items-center mt-1 text-xs text-gray-500 dark:text-gray-400">
                                                            <FaUsers className="mr-1" size={10}/>
                                                            <span>{course.student_count} student{course.student_count !== 1 ? 's' : ''}</span>
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="py-3 px-6 text-center">
                                                    <div className="flex item-center justify-center">
                                                        <button
                                                            onClick={() => handleEditCourse(course)}
                                                            className="transform hover:text-primary hover:scale-110 mr-3"
                                                            title="Edit Course"
                                                        >
                                                            <FaEdit/>
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteCourse(course.id)}
                                                            className="transform hover:text-red-500 hover:scale-110"
                                                            title="Delete Course"
                                                        >
                                                            <FaTrash/>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {showCourseForm && (
                            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md overflow-y-auto max-h-[90vh]">
                                    <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
                                        {isCourseEditMode ? 'Edit Course' : 'Add New Course'}
                                    </h2>
                                    <form onSubmit={handleCourseFormSubmit}>
                                        <div className="mb-4">
                                            <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2" htmlFor="title">
                                                Course Title
                                            </label>
                                            <input
                                                type="text"
                                                id="title"
                                                name="title"
                                                value={courseForm.title}
                                                onChange={handleCourseInputChange}
                                                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 dark:text-white dark:bg-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                                required
                                            />
                                        </div>
                                        <div className="mb-4">
                                            <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2" htmlFor="description">
                                                Description
                                            </label>
                                            <textarea
                                                id="description"
                                                name="description"
                                                value={courseForm.description}
                                                onChange={handleCourseInputChange}
                                                rows={4}
                                                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 dark:text-white dark:bg-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                            />
                                        </div>
                                        <div className="mb-4">
                                            <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2" htmlFor="school_id">
                                                School
                                            </label>
                                            <select
                                                id="school_id"
                                                name="school_id"
                                                value={courseForm.school_id || ''}
                                                onChange={handleCourseInputChange}
                                                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 dark:text-white dark:bg-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                            >
                                                <option value="">Select a school</option>
                                                    {schools.map(school => (
                                                        <option key={school.id} value={school.id.toString()}>{school.name}</option>
                                                    ))}
                                            </select>
                                            {courseForm.status !== 'draft' && !courseForm.school_id && (
                                                <p className="text-xs text-red-500 mt-1">School is required for published courses</p>
                                            )}
                                        </div>
                                        <div className="mb-4">
                                            <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2" htmlFor="teacher_id">
                                                Teacher
                                            </label>
                                            <select
                                                id="teacher_id"
                                                name="teacher_id"
                                                value={courseForm.teacher_id || ''}
                                                onChange={handleCourseInputChange}
                                                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 dark:text-white dark:bg-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                            >
                                                <option value="">Assign a teacher</option>
                                                {filteredTeachers.length > 0 ? (
                                                    filteredTeachers.map(teacher => (
                                                        <option key={teacher.id} value={teacher.id}>{teacher.full_name}</option>
                                                    ))                        
                                                ) : (
                                                    <option value="" disabled>
                                                        {courseForm.school_id
                                                            ? 'No teachers available for selected school'
                                                            : 'Select a school first'
                                                        }
                                                    </option>
                                                )}
                                            </select>
                                        </div>
                                        <div className="mb-4">
                                            <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2" htmlFor="start_date">
                                                Start Date
                                            </label>
                                            <input
                                                type="date"
                                                id="start_date"
                                                name="start_date"
                                                value={courseForm.start_date}
                                                onChange={handleCourseInputChange}
                                                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 dark:text-white dark:bg-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                            />
                                        </div>
                                        <div className="mb-4">
                                            <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2" htmlFor="end_date">
                                                End Date
                                            </label>
                                            <input
                                                type="date"
                                                id="end_date"
                                                name="end_date"
                                                value={courseForm.end_date}
                                                min={courseForm.start_date}
                                                onChange={handleCourseInputChange}
                                                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 dark:text-white dark:bg-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                            />
                                            {courseForm.end_date && courseForm.start_date && new Date(courseForm.end_date) < new Date(courseForm.start_date) && (
                                                <p className="text-xs text-red-500 mt-1">End date cannot be before start date</p>
                                            )}
                                        </div>
                                        <div className="mb-4">
                                            <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2" htmlFor="status">
                                                Status
                                            </label>
                                            <select
                                                id="status"
                                                name="status"
                                                value={courseForm.status}
                                                onChange={handleCourseInputChange}
                                                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 dark:text-white dark:bg-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                            >
                                                <option value="draft">Draft</option>
                                                <option value="published">Published</option>
                                                <option value="archived">Archived</option>
                                            </select>
                                        </div>
                                        
                                        <div className="flex items-center justify-between">
                                            <button
                                                type="submit"
                                                className="bg-primary hover:bg-secondary text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                                            >
                                                Save
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setShowCourseForm(false)}
                                                className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        )}

                        
                    </div>
                    )}
                </div>    
            </div>
        </div>
    )
}