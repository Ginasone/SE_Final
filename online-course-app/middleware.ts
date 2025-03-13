import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import jwt from 'jsonwebtoken';

const protectedPaths = [
    '/student-dashboard',
    '/teacher-dashboard',
    '/courses',
    '/profile',
    '/assignments',
];

const authPaths = [
    '/auth',
];

export async function middleware(request: NextRequest){
    const path = request.nextUrl.pathname;

    const token = request.cookies.get('token')?.value || request.headers.get('authorization')?.split(' ')[1];

    const isProtectedPath = protectedPaths.some(pp =>
        path === pp || path.startsWith(`${pp}/`)
    );

    const isAuthPath = authPaths.some(ap =>
        path === ap || path.startsWith(`${ap}/`)
    );

    const teacherPaths = ['/teacher-dashboard'];
    const studentPaths = ['/student-dashboard'];

    if (!token && isProtectedPath) {
        const url = new URL('/auth', request.url);
        url.searchParams.set('callbackUrl', encodeURI(request.url));
        return NextResponse.redirect(url);
    }

    if (token) {
        try {
            const secretKey = process.env.JWT_SECRET || '7f749666e7cba2f784b5bfe1c57f313557ce3ff3c74ed9637c56eeccef7e8af6de9cd800b2058fafc933bc1601b9c20249ed83e9783db020e20acf86a66badcd';
            const decoded = jwt.verify(token, secretKey) as jwt.JwtPayload;

            if (isAuthPath) {
                const dashboardPath = decoded.role === '2' ? '/teacher-dashboard' : '/student-dashboard';
                return NextResponse.redirect(new URL(dashboardPath, request.url));
            }

            if (teacherPaths.some(p => path == p || path.startsWith(`${p}/`)) && decoded.role !== '2') {
                return NextResponse.redirect(new URL('/student-dashboard', request.url));
            }

            if (studentPaths.some(p => path == p || path.startsWith(`${p}/`)) && decoded.role !== '1') {
                return NextResponse.redirect(new URL('/teacher-dashboard', request.url));
            }
        }
        catch (error) {
            if (isProtectedPath) {
                const response = NextResponse.redirect(new URL('/auth', request.url));
                response.cookies.delete('token');
                return response;
            }
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        '/((?!api|_next|_static|_vercel|[\\w-]+\\.\\w+).*)',
    ],
};