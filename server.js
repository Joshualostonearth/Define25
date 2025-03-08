// server.js
const express = require('express');
const app = express();
const port = 3000;

// Configuration
const API_TOKEN = "hugging-face-token"; // Your Hugging Face token
const API_URL = "https://api-inference.huggingface.co/models/mistralai/Mixtral-8x7B-Instruct-v0.1";
const headers = {
    "Authorization": `Bearer ${API_TOKEN}`,
    "Content-Type": "application/json"
};

// Basic FAQ database
const faqDatabase = {
    "what is a stock": "A stock represents ownership in a company. When you buy a stock, you own a small piece of that company.",
    "how do i invest": "To invest, you typically need to open a brokerage account, deposit funds, and then choose investments like stocks, bonds, or mutual funds.",
    "what is interest": "Interest is the cost of borrowing money or the return earned on savings/investments, usually expressed as a percentage."
};

// Hardcoded exchange rates (for demo purposes; replace with API in production)
const exchangeRates = {
    "aed": { "inr": 23.6569 }, // 1 UAE Dirham to Indian Rupee (approx. March 8, 2025)
    "usd": { "inr": 83.50 },   // 1 US Dollar to Indian Rupee
    "inr": { "aed": 0.04227 }  // 1 Indian Rupee to UAE Dirham
};

// Middleware
app.use(express.json());
app.use(express.static('public'));

// Helper function for FAQ checking
function checkFAQ(message) {
    const lowerMessage = message.toLowerCase().trim();
    return faqDatabase[lowerMessage] || null;
}

// Function to convert **text** to <b>text</b>
function formatBoldText(text) {
    return text.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>');
}

// Helper function to check if the question is finance-related
function isFinanceRelated(message) {
    const lowerMessage = message.toLowerCase().trim();
    const financeKeywords = [
        // General Finance Terms
        'stock', 'invest', 'interest', 'finance', 'money', 'budget', 'savings', 'retirement',
        'bank', 'loan', 'credit', 'debt', 'fund', 'bond', 'mutual', 'portfolio', 'economy',
        'financial', 'wealth', 'trade', 'trading', 'currency', 'tax', 'insurance', 'mortgage',
        'dividend', 'equity', 'crypto', 'cryptocurrency', 'market', 'capital', 'asset', 'liability',
        'dirham', 'dharam', 'dh', 'dhs', 'aed', 'rupee', 'rupies', 'inr', 'dollar', 'usd',
        'exchange', 'rate', 'convert', 'fixed', 'deposit', 'account', 'return', 'principal',

        // Digital Banking Terms
        'upi', 'netbanking', 'neft', 'rtgs', 'imps', 'wallet', 'paytm', 'google pay', 'apple pay', 
        'paypal', 'venmo', 'revolut', 'stripe', 'square', 'fintech', 'digital wallet',
        'virtual card', 'contactless', 'online banking', 'mobile banking', 'qr code', 'upi pin',

        // Investment and Trading Terms
        'etf', 'index fund', 'stock market', 'broker', 'payment','nifty', 'sensex', 'forex', 'nasdaq',
        'ipo', 'shares', 'bull market', 'bear market', 'futures', 'options', 'hedge fund', 
        'short selling', 'leveraged', 'derivatives', 'stop loss', 'blue chip',

        // Financial Services Terms
        'lending', 'microfinance', 'remittance', 'wire transfer', 'overdraft',
        'credit score', 'fico', 'bank statement', 'atm', 'cheque', 'checkbook', 
        'credit card', 'debit card', 'prepaid card', 'interest rate', 'balance transfer', 
        'loan emi', 'emi calculator', 'mortgage calculator', 'personal loan', 'home loan', 
        'auto loan', 'student loan', 'refinance', 'collateral', 'default', 'foreclosure',

        // Accounting & Bookkeeping
        'invoice', 'ledger', 'audit', 'cash flow', 'profit', 'loss', 'balance sheet',
        'income statement', 'tax filing', 'gst', 'vat', 'capital gains', 'net worth',
        'payroll', 'dividends', 'expense report',

        // International Finance & Currencies
        'euro', 'eur', 'pound', 'gbp', 'yen', 'jpy', 'yuan', 'cny', 'franc', 'chf',
        'peso', 'cad', 'aud', 'krw', 'sgd', 'idr', 'myr', 'zar',

        // Crypto-Specific Terms
        'blockchain', 'bitcoin', 'ethereum', 'dogecoin', 'nft', 'mining', 'wallet address',
        'ledger', 'defi', 'metamask', 'cold wallet', 'hot wallet',
        
        // Banking & Account Management Keywords
        'account balance', 'check balance', 'reset password', 'lost card', 'stolen card', 
        'replace card', 'contact information', 'update details', 'two-factor', '2fa', 
        'authentication', 'security question', 'pin code', 'pin number', 'account number', 
        'routing number', 'iban', 'swift code', 'branch code', 'internet banking',
        
        // Digital Transactions & Payments Keywords
        'online payment', 'payment failed', 'transaction failed', 'payment declined',
        'spending limit', 'card limit', 'transaction limit', 'digital wallet', 'e-wallet',
        'e-statement', 'paperless', 'contactless payment', 'tap to pay', 'nfc payment',
        'merchant', 'pos terminal', 'payment gateway', 'payment processor', 'chargeback',
        'refund', 'transaction history', 'pending transaction', 'authorized payment',
        
        // Budgeting & Financial Insights Keywords
        'track expenses', 'expense tracking', 'monthly expenses', '50/30/20 rule', 
        'budgeting rule', 'reduce spending', 'cut expenses', 'financial planning',
        'credit score', 'improve credit', 'fico score', 'utility bills', 'financial goal',
        'spending habit', 'financial health', 'money management', 'expense ratio',
        'cash flow', 'discretionary spending', 'necessary expenses', 'zero-based budget',
        
        // Security & Fraud Prevention Keywords
        'phishing', 'scam', 'fraud', 'suspicious activity', 'suspicious transaction',
        'security breach', 'data breach', 'identity theft', 'secure transaction',
        'tokenization', 'password manager', 'strong password', 'secure password',
        'account security', 'transaction alert', 'fraud alert', 'security question',
        'biometric', 'fingerprint', 'face recognition', 'voice recognition',
        
        // Sustainability & Eco-Friendly Finance Keywords
        'green investment', 'sustainable investment', 'esg', 'environmental', 
        'social', 'governance', 'carbon footprint', 'carbon neutral', 'eco-friendly',
        'paperless statement', 'digital statement', 'socially responsible', 
        'ethical investing', 'impact investing', 'green bond', 'climate risk',
        'sustainability', 'renewable energy', 'clean energy', 'green banking',
        'sustainable finance', 'green credit card', 'eco card'
    ];

    return financeKeywords.some(keyword => lowerMessage.includes(keyword));
}


// Helper function to handle currency conversion
function handleCurrencyConversion(message) {
    const lowerMessage = message.toLowerCase().trim();
    const conversionPattern = /(?:how much is|what is|convert)\s*(\d*\.?\d*)\s*(dirham|dharam|dh|dhs|aed|dollar|usd|rupee|rupies|inr)\s*(in|to|into)?\s*(dirham|dharam|dh|dhs|aed|dollar|usd|rupee|rupies|inr)/i;
    const match = lowerMessage.match(conversionPattern);
    
    if (match) {
        const amount = parseFloat(match[1]) || 1;
        let fromCurrency = match[2].toLowerCase()
            .replace(/dharam|dh|dhs/, 'aed')
            .replace(/dollar/, 'usd')
            .replace(/rupies|rupee/, 'inr');
        let toCurrency = match[4].toLowerCase()
            .replace(/dharam|dh|dhs/, 'aed')
            .replace(/dollar/, 'usd')
            .replace(/rupies|rupee/, 'inr');

        const fromRate = exchangeRates[fromCurrency];
        if (fromRate && fromRate[toCurrency]) {
            const rate = fromRate[toCurrency];
            const convertedAmount = amount * rate;
            return `FinBot: ${amount} ${fromCurrency.toUpperCase()} is approximately <b>${convertedAmount.toFixed(2)} ${toCurrency.toUpperCase()}</b> based on current exchange rates.`;
        } else {
            return "FinBot: Sorry, I don’t have the exchange rate for that currency pair.";
        }
    }
    return null;
}

// Chat endpoint
app.post('/chat', async (req, res) => {
    const { message } = req.body;
    try {
        // Check if the question is finance-related
        if (!isFinanceRelated(message)) {
            const response = "FinBot: I can't help you with that, can you ask about something related to finance?";
            return res.json({ response });
        }

        // Check for currency conversion
        const conversionResponse = handleCurrencyConversion(message);
        if (conversionResponse) {
            return res.json({ response: conversionResponse });
        }

        // Check FAQ first
        const faqAnswer = checkFAQ(message);
        if (faqAnswer) {
            const formattedResponse = formatBoldText(`FinBot: ${faqAnswer}`);
            return res.json({ response: formattedResponse });
        }

        // Fallback to model using built-in fetch
        const prompt = `[INST] You are a FinTech expert. Provide a concise answer to this finance-related question with numbered steps where applicable, using **text** to highlight key points. If the question is not finance-related, respond only with: "I can't help you with that, can you ask about something related to finance?": ${message} [/INST]`;
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify({
                inputs: prompt,
                parameters: {
                    max_length: 150,
                    temperature: 0.7,
                    top_p: 0.95
                }
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP error! status: ${response.status}, details: ${errorText}`);
        }

        const data = await response.json();
        if (!data[0]?.generated_text) {
            throw new Error('Invalid response format from API');
        }

        const botResponse = formatBoldText(
            data[0].generated_text.replace(prompt, "").trim()
        );
        res.json({ response: `FinBot: ${botResponse}` });
    } catch (error) {
        console.error('Error:', error.message);
        const errorResponse = formatBoldText(`FinBot: Sorry, I encountered an error: ${error.message}`);
        res.status(500).json({ response: errorResponse });
    }
});

// Serve the HTML file
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
