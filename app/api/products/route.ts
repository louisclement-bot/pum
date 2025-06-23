import { promises as fs } from 'fs';
import { NextResponse } from 'next/server';
import path from 'path';

/**
 * GET handler for /api/products
 * Serves the products.json file as a proper JSON API response
 * Includes caching and CORS headers
 */
export async function GET() {
  try {
    // Define the path to the products.json file
    const filePath = path.join(process.cwd(), 'public', 'data', 'products.json');
    
    // Read the file from the filesystem
    const fileData = await fs.readFile(filePath, 'utf8');
    
    // Parse the JSON to validate it and to ensure we're returning valid JSON
    const products = JSON.parse(fileData);
    
    // Return the products with appropriate headers
    return NextResponse.json(products, {
      status: 200,
      headers: {
        // CORS headers
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        
        // Caching headers - cache for 1 hour
        'Cache-Control': 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400',
      },
    });
  } catch (error) {
    console.error('Error serving products data:', error);
    
    // Return a proper error response
    return NextResponse.json(
      { 
        error: 'Failed to load products data',
        message: process.env.NODE_ENV === 'development' ? (error as Error).message : 'Internal server error'
      },
      { 
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        }
      }
    );
  }
}

/**
 * OPTIONS handler for CORS preflight requests
 */
export async function OPTIONS() {
  return NextResponse.json({}, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400', // 24 hours
    },
  });
}
