const { GoogleGenerativeAI } = require('./node_modules/@google/generative-ai');
const dotenv = require('dotenv');
dotenv.config();

async function listModels() {
    try {
        const apiKey = process.env.GEMINI_API_KEY;
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
        const data = await response.json();
        console.log(JSON.stringify(data, null, 2));
    } catch(err) {
        console.error(err);
    }
}
listModels();
