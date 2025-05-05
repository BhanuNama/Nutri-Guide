require('dotenv').config();

// Export environment variables
module.exports = {
  PORT: process.env.PORT || 3000,
  MONGODB_URI: process.env.MONGODB_URI,
  JWT_SECRET: process.env.JWT_SECRET,
  GENAI_API_KEY: process.env.GEMINI_API_KEY,
  SPOONACULAR_API_KEY: process.env.SPOONACULAR_API_KEY
}; 