export default () => ({
  deepseek: {
    apiKey: process.env.DEEPSEEK_API_KEY,
    apiUrl: 'https://api.deepseek.com/v1/chat/completions',
  },
  uploadPath: process.env.UPLOAD_PATH || './uploads',
});