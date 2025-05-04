// app/api/auth/forgot-password/route.ts
import { NextRequest, NextResponse } from "next/server";
import mysql from "mysql2/promise";
import crypto from "crypto";
import nodemailer from "nodemailer";

const getConnection = async () => {
  return await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'coursesite',
  });
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { message: "Email is required" },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { message: "Invalid email format" },
        { status: 400 }
      );
    }

    const connection = await getConnection();

    // Check if user exists
    const [users] = await connection.execute(
      "SELECT * FROM users WHERE email = ?",
      [email]
    );

    if (!Array.isArray(users) || users.length === 0) {
      await connection.end();
      // For security reasons, don't reveal that the email doesn't exist
      return NextResponse.json(
        { message: "If your email is registered, you will receive password reset instructions" },
        { status: 200 }
      );
    }

    // Generate reset token and expiry
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date();
    resetTokenExpiry.setHours(resetTokenExpiry.getHours() + 1); // Token valid for 1 hour

    // Store token in database
    await connection.execute(
      "UPDATE users SET reset_token = ?, reset_token_expiry = ? WHERE email = ?",
      [resetToken, resetTokenExpiry, email]
    );

    await connection.end();

    // Create a reset link even if we don't send an email
    // (this allows testing without email setup)
    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/reset-password?token=${resetToken}`;
    
    try {
      // Email configuration with improved error handling and SSL settings
      const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_SERVER,
        port: parseInt(process.env.EMAIL_PORT || '587'),
        secure: process.env.EMAIL_SECURE === 'true',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASSWORD,
        },
        tls: {
          // Do not fail on invalid certs
          rejectUnauthorized: false,
          // Force using TLSv1.2 as minimum
          minVersion: 'TLSv1.2'
        }
      });

      await transporter.sendMail({
        from: process.env.EMAIL_FROM,
        to: email,
        subject: 'EduHub Password Reset',
        html: `
          <div>
            <h1>Reset Your Password</h1>
            <p>You requested a password reset for your EduHub account.</p>
            <p>Click the link below to reset your password. This link is valid for 1 hour.</p>
            <a href="${resetUrl}" style="display: inline-block; background-color: #3B82F6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Reset Password</a>
            <p>If you didn't request this reset, you can safely ignore this email.</p>
            <p>The EduHub Team</p>
          </div>
        `,
      });
      
      console.log('Password reset email sent successfully');
    } catch (emailError) {
      // Log the email error but don't fail the request
      console.error('Error sending password reset email:', emailError);
      
      // For development: If email fails, still return success but log the reset URL
      // so you can test without email
      console.log('Development reset URL (since email failed):', resetUrl);
    }

    return NextResponse.json(
      { message: "If your email is registered, you will receive password reset instructions" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error processing password reset:", error);
    return NextResponse.json(
      { message: "Failed to process password reset request" },
      { status: 500 }
    );
  }
}