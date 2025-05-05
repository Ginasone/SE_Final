/**
 * Database Connection Singleton
 * 
 * This module implements the Singleton pattern for database connection management.
 * It provides a centralised MySQL connection pool that can be reused across the application.
 * 
 * IMPORTANT:
 * - Add all environment variables to .env file in production
 * - Connection pooling helps manage database connections efficiently
 * - Any changes to database config should be discussed with the team
 * 
 * @author Nadia
 * @version 1.0.0
 */

import mysql from 'mysql2/promise';

// Implementing Singleton pattern to ensure only one connection pool exists
class DatabaseConnection {
  private static instance: DatabaseConnection;
  private pool: mysql.Pool;
  
  private constructor() {
    // Create connection pool with environment variables or defaults
    this.pool = mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'coursesite',
      waitForConnections: true,
      connectionLimit: 10, // Adjust based on server capacity
      queueLimit: 0        // Unlimited queue size
    });
    
    console.log('Database connection pool initialized');
  }
  
  // Implements the Singleton pattern accessor
  public static getInstance(): DatabaseConnection {
    if (!DatabaseConnection.instance) {
      DatabaseConnection.instance = new DatabaseConnection();
    }
    return DatabaseConnection.instance;
  }
  
  /**
   * Execute a SQL query with optional parameters
   * 
   * @param {string} sql - SQL query to execute
   * @param {Array<unknown>} params - Array of parameters to bind to the query
   * @returns {Promise<unknown>} Query results
   * @throws {Error} Database errors will be thrown up to caller
   */
  public async query(sql: string, params: Array<unknown> = []): Promise<unknown> {
    try {
      // Destructuring to get only results, not metadata
      const [results] = await this.pool.execute(sql, params);
      return results;
    } catch (error) {
      console.error('Database query error:', error);
      throw error; // Re-throw to handle in service layer
    }
  }
}

// Export a singleton instance method for query execution
export const query = async (sql: string, params: Array<unknown> = []): Promise<unknown> => {
  return DatabaseConnection.getInstance().query(sql, params);
};

// Export the database connection instance for more complex operations
export default DatabaseConnection.getInstance();