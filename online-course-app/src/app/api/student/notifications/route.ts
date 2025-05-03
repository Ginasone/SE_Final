/**
 * Student Notifications API Routes
 * 
 * Implements the Controller layer in the MVC pattern for student notifications.
 * This module follows the REST API design pattern with appropriate HTTP methods.
 * 
 * Design Patterns:
 * - MVC (Model-View-Controller): This file represents the Controller component
 * - Command Pattern: Each HTTP method acts as a specific command operation
 * 
 * @author Nadia
 */

import { NextResponse } from 'next/server';
import StudentService from '../../services/StudentService';
import { validateRequest } from '@/app/utils/requestValidator';

/**
 * GET handler for student notifications
 * 
 * ENDPOINT: /api/student/notifications?studentId=X&limit=Y
 * PURPOSE: Fetch recent notifications for a student
 * ACCESS: Authenticated students (self) or admins
 * 
 * @param {Request} req - The incoming HTTP request
 * @returns {Promise<NextResponse>} JSON response with notifications
 */
export async function GET(req: Request) {
  try {
    // Extract and validate query parameters
    const url = new URL(req.url);
    const studentId = url.searchParams.get('studentId');
    const limitParam = url.searchParams.get('limit');
    
    // Parameter validation
    if (!studentId || isNaN(Number(studentId))) {
      return NextResponse.json(
        { error: 'Valid student ID is required' },
        { status: 400 }
      );
    }
    
    // Convert limit to number and validate
    const limit = limitParam ? parseInt(limitParam, 10) : 10;
    if (isNaN(limit) || limit < 1 || limit > 50) {
      return NextResponse.json(
        { error: 'Limit must be a number between 1 and 50' },
        { status: 400 }
      );
    }
    
    // Call service layer to get notifications
    const notifications = await StudentService.getStudentNotifications(Number(studentId), limit);
    
    // Return the notifications with appropriate status code
    return NextResponse.json(notifications);
  } catch (error) {
    console.error('Error in notifications GET route:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

/**
 * PATCH handler for marking notifications as read
 * 
 * ENDPOINT: /api/student/notifications
 * METHOD: PATCH
 * PURPOSE: Mark a notification as read
 * ACCESS: Authenticated students (self) or admins
 * 
 * @param {Request} req - The incoming HTTP request with notification ID
 * @returns {Promise<NextResponse>} JSON response with success status
 */
export async function PATCH(req: Request) {
  try {
    // Parse request body and validate
    let body;
    try {
      body = await req.json();
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }
    
    // Validate required fields
    const { notificationId } = body;
    if (!notificationId || isNaN(Number(notificationId))) {
      return NextResponse.json(
        { error: 'Valid notification ID is required' },
        { status: 400 }
      );
    }
    
    // Call service layer to mark notification as read
    const success = await StudentService.markNotificationAsRead(Number(notificationId));
    
    if (!success) {
      return NextResponse.json(
        { error: 'Failed to update notification' },
        { status: 500 }
      );
    }
    
    // Return success response
    return NextResponse.json({ 
      success: true,
      message: 'Notification marked as read successfully' 
    });
  } catch (error) {
    console.error('Error in notifications PATCH route:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}