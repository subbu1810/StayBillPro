/**
 * Server Configuration
 * 
 * Toggle the IS_PRODUCTION constant to switch between 
 * Local (localhost) and Hostinger (Production) servers.
 */

const IS_PRODUCTION = false; // Set to true for Hostinger, false for Local

export const API_BASE_URL = IS_PRODUCTION 
    ? 'https://your-hostinger-domain.com/api'  // Replace with your Hostinger URL
    : 'http://localhost:5000/api';

export default API_BASE_URL;
