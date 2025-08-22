#!/usr/bin/env node
/**
 * fix-image-urls.js
 * 
 * This script fixes encoding issues in product image URLs in the products.json file.
 * It properly encodes special characters, standardizes file extensions, and fixes volume mismatches.
 * 
 * Usage:
 *   node scripts/fix-image-urls.js
 */

const fs = require('fs');
const path = require('path');
const { URL } = require('url');

// Configuration
const PRODUCTS_FILE_PATH = path.join(process.cwd(), 'public', 'data', 'products.json');
const BACKUP_FILE_PATH = path.join(process.cwd(), 'public', 'data', 'products.json.bak');

// Volume corrections for specific products
const VOLUME_CORRECTIONS = {
  '74467': { nameVolume: '1250L', correctVolume: 1250 }, // Fix volume to match name
  '78374': { nameVolume: '7500L', correctVolume: 7500 }  // Fix volume to match name
};

/**
 * Properly encodes a URL without double-encoding already encoded parts
 * @param {string} url - The URL to encode
 * @returns {string} - The properly encoded URL
 */
function encodeUrlProperly(url) {
  if (!url || typeof url !== 'string') {
    return url;
  }

  try {
    // Parse the URL to get its components
    const parsedUrl = new URL(url);
    
    // Split the pathname into segments for careful encoding
    const segments = parsedUrl.pathname.split('/').map(segment => {
      if (!segment) return segment;
      
      // Try to decode first to prevent double encoding
      let decodedSegment;
      try {
        decodedSegment = decodeURIComponent(segment);
      } catch {
        decodedSegment = segment;
      }
      
      // Encode special characters manually to ensure proper handling
      return decodedSegment
        .replace(/'/g, '%27')                // Encode apostrophes
        .replace(/ /g, '%20')                // Encode spaces
        .replace(/\(/g, '%28')               // Encode opening parentheses
        .replace(/\)/g, '%29')               // Encode closing parentheses
        .replace(/\[/g, '%5B')               // Encode opening brackets
        .replace(/\]/g, '%5D');              // Encode closing brackets
    });
    
    // Reconstruct the pathname
    parsedUrl.pathname = segments.join('/');
    
    // Convert file extensions to lowercase
    if (parsedUrl.pathname.match(/\.(jpg|jpeg|png|gif|svg|webp)$/i)) {
      parsedUrl.pathname = parsedUrl.pathname.replace(/\.(JPG|JPEG|PNG|GIF|SVG|WEBP)$/i, match => 
        match.toLowerCase()
      );
    }
    
    return parsedUrl.toString();
  } catch (error) {
    // If URL parsing fails, apply manual encoding
    console.warn(`Warning: Could not parse URL: ${url}. Applying manual encoding.`);
    
    return url
      .replace(/'/g, '%27')
      .replace(/ /g, '%20')
      .replace(/\.JPG/g, '.jpg')
      .replace(/\.PNG/g, '.png')
      .replace(/\.GIF/g, '.gif')
      .replace(/\.SVG/g, '.svg')
      .replace(/\.WEBP/g, '.webp');
  }
}

/**
 * Validates if a URL is properly formatted
 * @param {string} url - The URL to validate
 * @returns {boolean} - Whether the URL is valid
 */
function isValidUrl(url) {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Main function to fix product image URLs
 */
async function fixProductImageUrls() {
  console.log('🔍 Starting image URL fix process...');
  
  // Read the products file
  let productsData;
  try {
    const fileContent = await fs.promises.readFile(PRODUCTS_FILE_PATH, 'utf8');
    productsData = JSON.parse(fileContent);
    console.log(`✅ Successfully read products.json with ${productsData.length} products`);
  } catch (error) {
    console.error('❌ Error reading products.json:', error.message);
    process.exit(1);
  }
  
  // Create a backup of the original file
  try {
    await fs.promises.writeFile(BACKUP_FILE_PATH, JSON.stringify(productsData, null, 2));
    console.log(`✅ Created backup at ${BACKUP_FILE_PATH}`);
  } catch (error) {
    console.error('❌ Error creating backup:', error.message);
    process.exit(1);
  }
  
  // Statistics
  let urlsFixed = 0;
  let volumesFixed = 0;
  let invalidUrls = 0;
  
  // Process each product
  const fixedProducts = productsData.map(product => {
    const originalUrl = product.imageUrl;
    const originalVolume = product.volume;
    
    // Fix image URL encoding
    if (product.imageUrl) {
      product.imageUrl = encodeUrlProperly(product.imageUrl);
      
      // Log changes if the URL was modified
      if (product.imageUrl !== originalUrl) {
        console.log(`\n🔧 Fixed URL for product ${product.id} (${product.name}):`);
        console.log(`   BEFORE: ${originalUrl}`);
        console.log(`   AFTER:  ${product.imageUrl}`);
        urlsFixed++;
      }
      
      // Validate the URL
      if (!isValidUrl(product.imageUrl)) {
        console.warn(`⚠️ Warning: Product ${product.id} still has an invalid URL after fixing: ${product.imageUrl}`);
        invalidUrls++;
      }
    }
    
    // Fix volume mismatches for specific products
    if (VOLUME_CORRECTIONS[product.id]) {
      const correction = VOLUME_CORRECTIONS[product.id];
      if (product.volume !== correction.correctVolume) {
        console.log(`\n📏 Fixed volume for product ${product.id} (${product.name}):`);
        console.log(`   BEFORE: ${product.volume}`);
        console.log(`   AFTER:  ${correction.correctVolume} (to match name: ${correction.nameVolume})`);
        product.volume = correction.correctVolume;
        volumesFixed++;
      }
    }
    
    return product;
  });
  
  // Write the fixed data back to the file
  try {
    await fs.promises.writeFile(PRODUCTS_FILE_PATH, JSON.stringify(fixedProducts, null, 2));
    console.log(`\n✅ Successfully wrote fixed data to products.json`);
  } catch (error) {
    console.error('❌ Error writing fixed data:', error.message);
    process.exit(1);
  }
  
  // Print summary
  console.log('\n📊 Summary:');
  console.log(`   Total products processed: ${productsData.length}`);
  console.log(`   URLs fixed: ${urlsFixed}`);
  console.log(`   Volumes fixed: ${volumesFixed}`);
  console.log(`   Invalid URLs remaining: ${invalidUrls}`);
  
  if (urlsFixed > 0 || volumesFixed > 0) {
    console.log('\n✅ Fixes applied successfully!');
  } else {
    console.log('\n🔍 No issues found that needed fixing.');
  }
}

// Run the main function
fixProductImageUrls().catch(error => {
  console.error('❌ Unhandled error:', error);
  process.exit(1);
});
