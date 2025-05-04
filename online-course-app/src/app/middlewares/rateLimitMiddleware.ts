/**
 * Rate Limiting Middleware
 * 
 * Implements rate limiting for API endpoints to prevent abuse.
 * Uses a simple in-memory store for development; should use Redis or similar in production.
 * 
 * This implements the Token Bucket Algorithm for rate limiting.
 * 
 * @author Nadia
 */

import { NextRequest } from 'next/server';

// Simple in-memory store for rate limiting
// NOTE: This is only suitable for development!
// In production, use Redis or another distributed cache
const rateLimitStore = new Map<string, {
  tokens: number,
  lastRefill: number
}>();

/**
 * Rate limit result interface
 */
interface RateLimitResult {
  success: boolean;
  remainingRequests: number;
  resetTime: number; // Unix timestamp
  error?: string;
}

/**
 * Apply rate limiting to a request using Token Bucket Algorithm
 * 
 * @param {NextRequest|Request} req - The HTTP request
 * @param {number} windowInSeconds - Time window in seconds (e.g., 60 for per-minute limiting)
 * @param {number} maxRequests - Maximum requests allowed in the time window
 * @returns {Promise<RateLimitResult>} Rate limit check result
 */
export async function rateLimit(
  req: NextRequest | Request,
  windowInSeconds: number,
  maxRequests: number
): Promise<RateLimitResult> {
  // Get client identifier (IP address in this simple example)
  // In production, you might use a combination of IP, user ID, etc.
  // You should also use a more reliable way to get the client IP
  const clientIp = req.headers.get('x-forwarded-for') || 
                  req.headers.get('x-real-ip') || 
                  'unknown';
  
  // Create a unique key for this client and endpoint
  const url = new URL(req.url);
  const endpoint = url.pathname;
  const key = `${clientIp}:${endpoint}`;
  
  const now = Date.now();
  
  // Get or create rate limit entry for this client
  if (!rateLimitStore.has(key)) {
    rateLimitStore.set(key, {
      tokens: maxRequests - 1, // Use one token for this request
      lastRefill: now
    });
    
    return {
      success: true,
      remainingRequests: maxRequests - 1,
      resetTime: now + (windowInSeconds * 1000)
    };
  }
  
  // Get current rate limit state
  const limitState = rateLimitStore.get(key)!;
  
  // Calculate token refill based on time elapsed
  const timeElapsed = now - limitState.lastRefill;
  const tokensToAdd = Math.floor(timeElapsed / (windowInSeconds * 1000 / maxRequests));
  
  // Refill tokens if time has passed
  if (tokensToAdd > 0) {
    limitState.tokens = Math.min(maxRequests, limitState.tokens + tokensToAdd);
    limitState.lastRefill = now;
  }
  
  // Check if we have tokens available
  if (limitState.tokens > 0) {
    // Use a token and allow the request
    limitState.tokens -= 1;
    rateLimitStore.set(key, limitState);
    
    // Calculate reset time
    const resetTime = now + ((maxRequests - limitState.tokens) * (windowInSeconds * 1000 / maxRequests));
    
    return {
      success: true,
      remainingRequests: limitState.tokens,
      resetTime
    };
  } else {
    // Rate limit exceeded
    // Calculate when the client can make another request
    const timeToNextToken = (windowInSeconds * 1000 / maxRequests) - 
                         (now - limitState.lastRefill) % (windowInSeconds * 1000 / maxRequests);
    
    const resetTime = now + timeToNextToken;
    
    return {
      success: false,
      remainingRequests: 0,
      resetTime,
      error: 'Rate limit exceeded'
    };
  }
}

/**
 * Clear expired rate limit entries (maintenance function)
 * Should be called periodically in a real application
 * 
 * @param {number} olderThan - Clear entries older than this many milliseconds
 */
export function cleanupRateLimits(olderThan: number = 3600000): void {
  const now = Date.now();
  
  for (const [key, state] of rateLimitStore.entries()) {
    if (now - state.lastRefill > olderThan) {
      rateLimitStore.delete(key);
    }
  }
}