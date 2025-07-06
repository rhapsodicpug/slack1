const axios = require('axios');

async function testEnhancedSlackTool() {
  const testPayload = {
    args: {
      channel_id: "C093FMQ93BR", // Replace with your actual channel ID
      user_id: "U12345678",      // Replace with your actual user ID
      text: "10"                 // Fetch 10 messages
    },
    secrets: {
      SLACK_BOT_TOKEN: process.env.SLACK_BOT_TOKEN,
      GEMINI_API_KEY: process.env.GEMINI_API_KEY
    }
  };

  try {
    console.log('🧪 Testing Enhanced Slack Chat Summarizer Tool...');
    console.log('📋 Test payload:', JSON.stringify(testPayload, null, 2));
    
    const response = await axios.post('http://localhost:3000', testPayload, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Response received:');
    console.log('Status:', response.status);
    console.log('Data:', JSON.stringify(response.data, null, 2));

    // Extract key information
    const data = response.data;
    if (data.summary) {
      console.log('\n🤖 AI Summary:');
      console.log(data.summary);
    }
    
    if (data.message_count) {
      console.log(`\n📊 Processed ${data.message_count} messages`);
    }

    if (data.slack_summary_posted && data.slack_history_posted) {
      console.log('✅ Both summary and full history posted to Slack successfully!');
    }

  } catch (error) {
    console.error('❌ Error testing enhanced tool:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  }
}

// Check if required environment variables are set
if (!process.env.SLACK_BOT_TOKEN) {
  console.error('❌ SLACK_BOT_TOKEN environment variable is not set');
  console.log('💡 Set it with: $env:SLACK_BOT_TOKEN="your-slack-token"');
  process.exit(1);
}

if (!process.env.GEMINI_API_KEY) {
  console.error('❌ GEMINI_API_KEY environment variable is not set');
  console.log('💡 Set it with: $env:GEMINI_API_KEY="your-gemini-api-key"');
  console.log('🔗 Get your API key from: https://makersuite.google.com/app/apikey');
  process.exit(1);
}

testEnhancedSlackTool(); 