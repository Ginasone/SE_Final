# EduHub - Online Course Platform for Ghanaian Schools

## Overview

EduHub is a comprehensive online learning platform designed specifically for Ghanaian students and teachers. This platform enables schools to share learning materials online, allows teachers to upload lessons based on the Ghana Education Service (GES) syllabus, and provides students with easy access to educational content from anywhere.

The application addresses the challenges highlighted during the COVID-19 pandemic, ensuring continuous learning even when physical attendance is not possible. It also supports students on the double-track system, enabling them to complete semester work online.

## Features

### For Administrators
- School management (registration, access code generation)
- User management (students, teachers, admins)
- Course oversight and monitoring
- Analytics and reporting

### For Teachers
- Course creation and management
- Content uploading (lessons, materials)
- Assignment creation and grading

### For Students
- Access to curriculum-aligned materials
- School-specific content access

## Tech Stack

### Frontend
- React.js
- Next.js
- Tailwind CSS
- ShadcnUI components
- React Icons

### Backend
- Next.js API routes
- MySQL database
- JWT for authentication and authorization

## Installation

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn
- MySQL (v5.7 or higher)

### Steps

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/eduhub.git
   cd eduhub
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Set up environment variables**
   Create a `.env.local` file in the root directory with the following variables:
   ```
   DB_HOST=localhost
   DB_USER=your_db_user
   DB_PASSWORD=your_db_password
   DB_NAME=coursesite
   JWT_SECRET=your_jwt_secret_key
   ```

4. **Set up the database**
   - Create a MySQL database named `coursesite`
   - Import the database schema from `coursesite.sql`

5. **Run the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   ```

6. **Access the application**
   Open your browser and go to `http://localhost:3000`

## Project Structure

```
eduhub/
├── app/                    # Next.js app directory
│   ├── api/                # API routes
│   ├── auth/               # Authentication pages
│   ├── admin-dashboard/    # Admin dashboard
│   ├── teacher-dashboard/  # Teacher dashboard
│   ├── student-dashboard/  # Student dashboard
│   └── ...
├── components/             # React components
├── public/                 # Static files
└── ...
```

## Authentication Flow

The application supports three user roles:
- **Admin**: System administrators who manage schools and users
- **Teacher**: Educators who create and manage courses
- **Student**: Learners who access course materials

Registration requires:
- For students and teachers: A valid school access code
- For admins: A special admin registration code

## Database Schema

The core database entities include:
- Users (admin, teacher, student)
- Schools
- Courses
- Enrollments
- Lessons
- Assignments
- Quizzes
- Questions and Answers

## Deployment

### Production Build
```bash
npm run build
# or
yarn build
```

### Start Production Server
```bash
npm start
# or
yarn start
```

## Security Considerations

- Passwords are hashed using bcrypt
- JWT tokens are used for authentication
- School-specific access codes ensure proper institutional access
- Admin-only endpoints are protected with middleware

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgements

- Ghana Education Service (GES) for curriculum alignment
- All contributing developers and educational institutions
