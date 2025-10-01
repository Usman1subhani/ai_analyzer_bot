export default () => ({
  // Groq API Configuration (Primary - we're using this now)
  groq: {
    apiKey: process.env.GROQ_API_KEY || '',
    apiUrl: process.env.GROQ_API_URL || 'https://api.groq.com/openai/v1',
  },
  // DeepSeek API Configuration (Backup)
  deepseek: {
    apiKey: process.env.DEEPSEEK_API_KEY || '',
    apiUrl: process.env.DEEPSEEK_API_URL || 'https://api.deepseek.com/v1',
  },
  // Gemini API Configuration (Alternative backup)
  gemini: {
    apiKey: process.env.GEMINI_API_KEY || '',
  },
  // File upload configuration
  uploadPath: process.env.UPLOAD_PATH || './uploads',
  // Application settings
  app: {
    port: process.env.PORT || 3000,
    environment: process.env.NODE_ENV || 'development',
  },
});
