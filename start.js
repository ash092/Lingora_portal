#!/usr/bin/env node
/**
 * Minimal startup wrapper for Hostinger deployment
 * Runs the pre-built dist/index.js without requiring npm install
 */

// Load environment variables from .env if it exists
try {
  require('dotenv').config();
} catch (e) {
  // dotenv not required, env vars should be set by Hostinger
}

// Import and run the pre-built server
require('./dist/index.js');
