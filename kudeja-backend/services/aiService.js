const { GoogleGenerativeAI } = require('@google/generative-ai');

const KUDEJA_KNOWLEDGE = `
You are the Kudeja Trading AI Assistant, a helpful and knowledgeable expert on Ethiopian technology services.
Company Profile:
- Name: Kudeja Trading PLC
- Market: Ethiopia (Addis Ababa)
- Experience: 5+ years of premium electronics and service delivery.
- Values: Quality, reliability, and customer satisfaction.

Your Personality:
- Professional, warm, and highly responsive.
- You speak fluently in both English and Amharic, but you MUST ONLY reply in the single language the user typed in.
- You provide detailed specs when asked.
- You never say "I don't know" - instead, offer to check with a human agent.

Services We Provide:
1. Computers & Laptops: High-end brands (HP, Dell, Apple, Lenovo).
2. Printing Solutions: Industrial and home printers/copiers.
3. Security: CCTV and surveillance systems for homes and businesses.
4. Events: Professional event organization and tech setup.

Context for current inventory:
{{productContext}}

Instructions:
- When a client asks about a specific product or you recommend a product, provide some key specifications first.
- After the specifications, ALWAYS include a direct link to the product using exactly this format: http://localhost:5173/product/<id> (replace <id> with the actual product ID from the inventory context). This link will be converted into a button automatically.
- If a user mentions "responsiveness" or "speed", emphasize that we have local support available 24/7.
- Use emojis to make the conversation friendly.
`;

/**
 * Generates an AI response using Gemini if available, otherwise falls back to keyword matching.
 */
const getAIResponse = async (userMessage, productContext = "") => {
    const geminiKey = process.env.GEMINI_API_KEY;
    const msg = userMessage.toLowerCase();
    const isAmharic = /[\u1200-\u137F]/.test(userMessage);

    // 1. Detection for Handoff / Human Escalation (Always check first)
    const needsAgent = msg.includes('agent') || msg.includes('admin') || msg.includes('human') ||
        msg.includes('speak to') || msg.includes('እባክዎን ሰው') || msg.includes('አስተዳዳሪ') ||
        msg.includes('contact') || msg.includes('call') || msg.includes('phone') ||
        msg.includes('ስልክ');

    if (needsAgent) {
        return {
            reply: isAmharic
                ? "እሺ! እርስዎን ለመርዳት የቡድናችን አባል እንዲገኝ መልእክት ልከናል:: እባክዎ ለጥቂት ጊዜ ይጠብቁ፣ በቅርቡ ይቀላቀሉናል! 👋"
                : "Certainly! I've placed a request for one of our human experts to assist you. They'll be joining this conversation shortly. Please stay with us! 👋",
            escalate: true
        };
    }

    // 2. Try Gemini if API key is present
    if (geminiKey && geminiKey !== 'your_gemini_api_key_here') {
        try {
            console.log(`🤖 Gemini Attempt: Key format: ${geminiKey.substring(0, 3)}... Target: gemini-2.5-flash`);
            const genAI = new GoogleGenerativeAI(geminiKey);
            const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

            const languageInstruction = isAmharic ? "IMPORTANT: The user asked in Amharic. You MUST reply ONLY in Amharic. Do not use English." : "IMPORTANT: The user asked in English. You MUST reply ONLY in English. Do not use Amharic.";

            const prompt = KUDEJA_KNOWLEDGE.replace('{{productContext}}', productContext) + 
                          `\n\n${languageInstruction}\n\nUser Question: ${userMessage}`;

            const result = await model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();
            
            console.log('✅ Gemini Success: Response generated.');
            return {
                reply: text,
                escalate: false
            };
        } catch (error) {
            console.error('❌ Gemini Detail Error:', {
                message: error.message,
                code: error.code,
                status: error.status,
                stack: error.stack?.split('\n')[0]
            });
            // Fallthrough to keyword matching
        }
    }

    // 3. Fallback Keyword Matching (Enhanced)
    const KUDEJA_IDENT = isAmharic 
      ? "ኩዴጃ ትሬዲንግ (Kudeja Trading) የተለያዩ የኮምፒውተር እቃዎች፣ ፕሪንተሮች እና የደህንነት ካሜራዎችን በማቅረብ ላይ ይገኛል::" 
      : "I am the Kudeja Trading Assistant. We specialize in high-quality computers, printers, and security solutions in Ethiopia.";

    // Simple matching for greetings
    if (msg.includes('help') || msg.includes('hi') || msg.includes('hello') || msg.includes('ሰላም') || msg.includes('እርዳታ')) {
        return {
            reply: isAmharic
                ? `ሰላም! ${KUDEJA_IDENT} እንዴት ልረዳዎት እችላለሁ? ስለ ኮምፒውተሮች፣ ፕሪንተሮች ወይም የደህንነት ካሜራዎች መጠየቅ ይችላሉ። እንዲሁም ለሌሉ እቃዎች ልዩ ትዕዛዝ መስጠት ይችላሉ።`
                : `Hello!, hey!, hi! ${KUDEJA_IDENT} How can I assist you today? I can check our stock. We also accept special pre-orders for items not currently in stock!`,
            escalate: false
        };
    }

    // Product search fallback
    if (productContext && productContext.trim().length > 0) {
        const queryTerms = msg.split(/[ ,.!?]+/).filter(word => word.length >= 2);
        const allProductLines = productContext.split('\n');

        const scoredMatches = allProductLines.map(line => {
            const lowerLine = line.toLowerCase();
            const score = queryTerms.reduce((sum, term) => sum + (lowerLine.includes(term) ? 1 : 0), 0);
            return { line, score };
        }).filter(item => item.score > 0).sort((a, b) => b.score - a.score);

        if (scoredMatches.length > 0) {
            const bestMatches = scoredMatches.slice(0, 2).map(m => {
                const parts = m.line.split(' | ').reduce((acc, part) => {
                    const [key, val] = part.split(': ');
                    acc[key.trim()] = val?.trim();
                    return acc;
                }, {});

                const name = parts.NAME;
                const price = parts.PRICE;
                const specs = parts.SPECS || 'Not listed';
                const id = parts.ID;

                if (isAmharic) {
                    return `✨ **${name}**\n💰 ዋጋ: **${price} ETB**\n⚙️ መግለጫ: ${specs}\n🔗 ዝርዝር: http://localhost:5173/product/${id}`;
                }
                return `✨ **${name}**\n💰 Price: **${price} ETB**\n⚙️ Specs: ${specs}\n🔗 Details: http://localhost:5173/product/${id}`;
            });

            return {
                reply: isAmharic
                    ? `የምንመክረው የተመረጡ እቃዎች ዝርዝር:\n\n${bestMatches.join('\n\n')}\n\nተጨማሪ እርዳታ ይፈልጋሉ?`
                    : `Here are our top recommendations for you:\n\n${bestMatches.join('\n\n')}\n\nWould you like help with ordering?`,
                escalate: false
            };
        }
    }

    return {
        reply: isAmharic
            ? "ይቅርታ፣ ጥያቄዎ በደንብ አልገባኝም:: እባክዎን የሚፈልጉትን ብራንድ፣ እቃ ወይም አገልግሎት ቢጥቀሱልኝ የተሻለ መረጃ ልሰጥዎት እችላለሁ::"
            : "I'm sorry, I didn't quite catch that. Could you please specify the product, brand, or service you are interested in? I'll do my best to find it for you in our catalog.",
        escalate: false
    };
};

module.exports = { getAIResponse };
