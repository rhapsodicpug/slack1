const dotenv = require('dotenv');
const express = require('express');
const { handler } = require('../dist/index');

dotenv.config();

const app = express();

const { SLACK_BOT_TOKEN, GEMINI_API_KEY, PORT } = process.env;

if(SLACK_BOT_TOKEN === undefined) {
    console.log('`SLACK_BOT_TOKEN` not set. Please set your Slack bot token.');
    process.exit(1);
}

if(GEMINI_API_KEY === undefined) {
    console.log('`GEMINI_API_KEY` not set. Please set your Gemini API key.');
    process.exit(1);
}

console.log('✅ SLACK_BOT_TOKEN loaded:', !!SLACK_BOT_TOKEN);
console.log('✅ GEMINI_API_KEY loaded:', !!GEMINI_API_KEY);

app.get('/', async (req, res) => {
    const { channel_id, user_id, text } = req.query;

    const event = {
        body: JSON.stringify({
            args: {
                channel_id,
                user_id,
                text: text || ""
            },
            secrets: {
                SLACK_BOT_TOKEN,
                GEMINI_API_KEY
            }
        })
    }

    const result = await handler(event)

    res.status(result.statusCode).send(result.body);
});

const port = PORT || 3000;
app.listen(port, () => {
    console.log(`Local development server running on port ${port}`);
    console.log('GET requests to / with query params: channel_id, user_id, text');
});
