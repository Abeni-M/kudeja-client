/**
 * aiService.js
 * Handles AI responses for live chat and escalation logic.
 */

// Placeholder for an actual LLM integration (e.g., Gemini or OpenAI)
// To use a real AI, you would install @google/generative-ai and replace the simulate logic.

const KUDEJA_KNOWLEDGE = `
You are the Kudeja Trading AI Assistant. 
Kudeja Trading is a general trading company in Ethiopia with over 5 years of experience.
Services:
1. Computer and Accessories: High-performance computers and peripherals.
2. Printer and Copy Machine: Reliable printing and copying solutions.
3. Security Cameras: Advanced surveillance systems.
4. Special Event Organizer: Organizing memorable events.
Location: Addis Ababa, Ethiopia.
Response Tone: Professional, friendly, and helpful.
Instruction: If a user asks for a human, admin, agent, or has a complex issue (like specific order problems, 
refunds, or payments), respond that you are referring them to a human agent.
`;

/**
 * Generates an AI response and decides if escalation is needed.
 * @param {string} userMessage - The message from the user.
 * @param {string} productContext - Informational string about current stock.
 * @returns {Promise<{ reply: string, escalate: boolean }>}
 */
const getAIResponse = async (userMessage, productContext = "") => {
    const msg = userMessage.toLowerCase();

    // Check if message contains Amharic/Ethiopic characters (Unicode range U+1200 to U+137F)
    const isAmharic = /[\u1200-\u137F]/.test(userMessage);

    // 1. Detection for Handoff / Human Escalation
    const needsAgent = msg.includes('agent') || msg.includes('admin') || msg.includes('human') ||
        msg.includes('speak to') || msg.includes('እባክዎን ሰው') || msg.includes('አስተዳዳሪ') ||
        msg.includes('contact') || msg.includes('call') || msg.includes('phone');

    if (needsAgent) {
        return {
            reply: isAmharic
                ? "እሺ! እርስዎን ለመርዳት የቡድናችን አባል እንዲገኝ መልእክት ልከናል:: እባክዎ ለጥቂት ጊዜ ይጠብቁ፣ በቅርቡ ይቀላቀሉናል! 👋"
                : "Certainly! I've placed a request for one of our human experts to assist you. They'll be joining this conversation shortly. Please stay with us! 👋",
            escalate: true
        };
    }

    // 2. Greeting / Context
    const greeting = isAmharic ? "ሰላም!" : "Hello!";
    const KUDEJA_IDENT = isAmharic 
      ? "\nቡድናችን ኩዴጃ ትሬዲንግ (Kudeja Trading) የተለያዩ የኮምፒውተር እቃዎች፣ ፕሪንተሮች እና የደህንነት ካሜራዎችን በማቅረብ ላይ ይገኛል::" 
      : "\nI am the Kudeja Trading Assistant. We specialize in high-quality computers, printers, and security solutions in Ethiopia.";

    // 3. Category Assistance
    const categories = [
        { en: 'laptop', am: 'ላፕቶፕ', sub: 'HP, Dell, Apple, Lenovo' },
        { en: 'computer', am: 'ኮምፒውተር', sub: 'Desktop, Monitors' },
        { en: 'printer', am: 'ፕሪንተር', sub: 'Canon, HP, Epson' },
        { en: 'camera', am: 'ካሜራ', sub: 'Hikvision, Dahua, CCTV' },
        { en: 'cctv', am: 'ሲሲቲቪ', sub: 'Surveillance systems' }
    ];

    const matchedCategory = categories.find(cat => msg.includes(cat.en) || msg.includes(cat.am));

    if (matchedCategory && !msg.includes('brand') && !msg.includes('model')) {
        return {
            reply: isAmharic
                ? `አዎ፣ እኛ በርካታ ${matchedCategory.am} እቃዎች አሉን:: በተለየ የምንመክርዎት ታዋቂ ብራንዶች: ${matchedCategory.sub} ናቸው:: የትኛውን ብራንድ ወይም የተለየ ሞዴል እንደሚፈልጉ ቢነግሩኝ ዝርዝሩን አረጋግጥልዎታለሁ::`
                : `Yes, we have a great selection of ${matchedCategory.en}s! We stock major brands like ${matchedCategory.sub}. Is there a specific brand or model you're interested in? I'd be happy to check the details for you.`,
            escalate: false
        };
    }

    // Specific Item/Brand Check
    if (productContext && productContext.trim().length > 0) {
        // Normalize and extract meaningful query terms (min 3 chars)
        const queryTerms = msg.split(/[ ,.!?]+/).filter(word => word.length >= 2);

        const allProductLines = productContext.split('\n');

        // Find matches and rank them by how many terms they contain
        const scoredMatches = allProductLines.map(line => {
            const lowerLine = line.toLowerCase();
            const score = queryTerms.reduce((sum, term) => sum + (lowerLine.includes(term) ? 1 : 0), 0);
            return { line, score };
        }).filter(item => item.score > 0)
            .sort((a, b) => b.score - a.score); // Highest score (most matches) first

        if (scoredMatches.length > 0) {
            const topScore = scoredMatches[0].score;
            const bestMatches = scoredMatches.filter(m => m.score === topScore || m.score >= 2).map(m => {
                // Parse our pipe-delimited context
                const parts = m.line.split(' | ').reduce((acc, part) => {
                    const [key, val] = part.split(': ');
                    acc[key.trim()] = val?.trim();
                    return acc;
                }, {});

                const name = parts.NAME;
                const price = parts.PRICE;
                const stock = parts.STOCK;
                const specs = parts.SPECS || 'Not listed';
                const id = parts.ID;

                const statusLabel = stock === 'AVAILABLE' ? (isAmharic ? '✅ አሁን ይገኛል' : '✅ AVAILABLE') : (isAmharic ? '❌ የለም' : '❌ OUT OF STOCK');

                if (isAmharic) {
                    return `✨ **${name}**\n💰 ዋጋ: **${price} ETB**\n📦 ሁኔታ: ${statusLabel}\n⚙️ ጠቅላላ መግለጫ: ${specs}\n🔗 ዝርዝር ለመመልከት: http://localhost:5173/product/${id}`;
                }

                return `✨ **${name}**\n💰 Price: **${price} ETB**\n📦 Status: ${statusLabel}\n⚙️ Specs: ${specs}\n🔗 View Details: http://localhost:5173/product/${id}`;
            });

            return {
                reply: isAmharic
                    ? `የምንመክረው የተመረጡ እቃዎች ዝርዝር:\n\n${bestMatches.join('\n\n')}\n\nተጨማሪ እርዳታ ይፈልጋሉ?`
                    : `Here are our top recommendations for you:\n\n${bestMatches.join('\n\n')}\n\nWould you like help with ordering?`,
                escalate: false
            };
        } else if (queryTerms.some(t => ['hp', 'dell', 'apple', 'canon', 'lenovo', 'asus', 'laptop', 'printer', 'camera', 'hikvision'].includes(t))) {
            return {
                reply: isAmharic
                    ? "ለጊዜው ባዘዙት ብራንድ ወይም ሞዴል ክምችት የለንም። ነገር ግን በልዩ ትዕዛዝ ልናስመጣሎት እንችላለን! እባክዎን በስልክ ቁጥር 0911... ወይም በ አድራሻችን በመምጣት ያነጋግሩን።"
                    : "I've checked our current inventory, and that specific model is currently out of stock. However, we can often pre-order specific items for you! Please contact us directly at +251 911... or visit our office to place a manual order.",
                escalate: false
            };
        }
    }

    // Generic Consult
    if (msg.includes('help') || msg.includes('hi') || msg.includes('hello') || msg.includes('ሰላም') || msg.includes('እርዳታ')) {
        return {
            reply: isAmharic
                ? `ሰላም! ${KUDEJA_IDENT} እንዴት ልረዳዎት እችላለሁ? ስለ ኮምፒውተሮች፣ ፕሪንተሮች ወይም የደህንነት ካሜራዎች መጠየቅ ይችላሉ። እንዲሁም ለሌሉ እቃዎች ልዩ ትዕዛዝ መስጠት ይችላሉ።`
                : `Hello! ${KUDEJA_IDENT} How can I assist you today? I can check our stock for Laptops, Printers, or Security Cameras. We also accept special pre-orders for items not currently in stock!`,
            escalate: false
        };
    }

    // 141
    return {
        reply: isAmharic
            ? "ይቅርታ፣ ጥያቄዎ በደንብ አልገባኝም:: እባክዎን የሚፈልጉትን ብራንድ፣ እቃ ወይም አገልግሎት ቢጥቀሱልኝ የተሻለ መረጃ ልሰጥዎት እችላለሁ::"
            : "I'm sorry, I didn't quite catch that. Could you please specify the product, brand, or service you are interested in? I'll do my best to find it for you in our catalog.",
        escalate: false
    };
};

module.exports = { getAIResponse };
