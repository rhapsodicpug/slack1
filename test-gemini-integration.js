const axios = require('axios');

// Test configuration
const TEST_CONFIG = {
  base_url: "http://localhost:3000",
  channel_id: "C093FMQ93BR", // Replace with your actual channel ID
  user_id: "U12345678"       // Replace with your actual user ID
};

// Test cases for comprehensive testing
const testCases = [
  {
    name: "Basic Slack + Gemini Test",
    payload: {
      channel_id: TEST_CONFIG.channel_id,
      user_id: TEST_CONFIG.user_id,
      text: "5" // Fetch 5 messages
    },
    expected: "Should fetch messages, generate AI summary, and post both to Slack"
  },
  {
    name: "Default Message Count Test",
    payload: {
      channel_id: TEST_CONFIG.channel_id,
      user_id: TEST_CONFIG.user_id,
      text: "" // Empty text should use default (50 messages)
    },
    expected: "Should use default 50 messages and generate summary"
  },
  {
    name: "Custom Message Count Test",
    payload: {
      channel_id: TEST_CONFIG.channel_id,
      user_id: TEST_CONFIG.user_id,
      text: "10" // Fetch 10 messages
    },
    expected: "Should fetch 10 messages and generate summary"
  },
  {
    name: "Missing Channel ID Test",
    payload: {
      user_id: TEST_CONFIG.user_id,
      text: "5"
    },
    expected: "Should return validation error for missing channel_id"
  },
  {
    name: "Missing User ID Test",
    payload: {
      channel_id: TEST_CONFIG.channel_id,
      text: "5"
    },
    expected: "Should return validation error for missing user_id"
  },
  {
    name: "Invalid Message Count Test",
    payload: {
      channel_id: TEST_CONFIG.channel_id,
      user_id: TEST_CONFIG.user_id,
      text: "999" // Too many messages
    },
    expected: "Should cap at 200 messages and generate summary"
  }
];

async function runTest(testCase) {
  console.log(`\n🧪 Running: ${testCase.name}`);
  console.log(`📋 Expected: ${testCase.expected}`);
  console.log(`📤 Payload:`, JSON.stringify(testCase.payload, null, 2));

  try {
    const response = await axios.get(TEST_CONFIG.base_url, {
      params: testCase.payload,
      timeout: 30000 // 30 seconds for AI processing
    });

    console.log(`✅ SUCCESS (${response.status})`);
    console.log(`📥 Response:`, JSON.stringify(response.data, null, 2));

    // Extract key information
    if (response.data.message) {
      console.log(`💬 Message: ${response.data.message}`);
    }
    if (response.data.summary) {
      console.log(`🤖 AI Summary: ${response.data.summary}`);
    }
    if (response.data.message_count) {
      console.log(`📊 Message Count: ${response.data.message_count}`);
    }
    if (response.data.slack_summary_posted) {
      console.log(`✅ Summary Posted to Slack: ${response.data.slack_summary_posted}`);
    }
    if (response.data.slack_history_posted) {
      console.log(`✅ History Posted to Slack: ${response.data.slack_history_posted}`);
    }

    return { success: true, data: response.data };

  } catch (error) {
    console.log(`❌ FAILED`);
    
    if (error.response) {
      console.log(`📥 Error Response (${error.response.status}):`, JSON.stringify(error.response.data, null, 2));
      
      // Check for specific error types
      if (error.response.data.error) {
        console.log(`🚨 Error: ${error.response.data.error}`);
      }
      
      return { success: false, error: error.response.data };
    } else {
      console.log(`🌐 Network Error: ${error.message}`);
      return { success: false, error: { error: error.message } };
    }
  }
}

async function runAllTests() {
  console.log('🚀 Slack + Gemini Integration Test Suite');
  console.log('=========================================');
  console.log(`📊 Running ${testCases.length} test cases`);
  console.log(`📋 Test Channel ID: ${TEST_CONFIG.channel_id}`);
  console.log(`👤 Test User ID: ${TEST_CONFIG.user_id}`);
  console.log(`🌐 Endpoint: ${TEST_CONFIG.base_url}`);

  const results = {
    total: testCases.length,
    passed: 0,
    failed: 0,
    details: []
  };

  for (let i = 0; i < testCases.length; i++) {
    const testCase = testCases[i];
    console.log(`\n${'='.repeat(60)}`);
    console.log(`Test ${i + 1}/${testCases.length}`);
    
    const result = await runTest(testCase);
    
    results.details.push({
      name: testCase.name,
      success: result.success,
      data: result.data || result.error
    });

    if (result.success) {
      results.passed++;
    } else {
      results.failed++;
    }

    // Delay between tests to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  // Summary
  console.log(`\n${'='.repeat(60)}`);
  console.log('📊 TEST SUMMARY');
  console.log('================');
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`📊 Total: ${results.total}`);
  console.log(`📈 Success Rate: ${((results.passed / results.total) * 100).toFixed(1)}%`);

  // Detailed results
  console.log(`\n📋 DETAILED RESULTS`);
  console.log('===================');
  results.details.forEach((detail, index) => {
    const status = detail.success ? '✅' : '❌';
    console.log(`${status} ${index + 1}. ${detail.name}`);
  });

  return results;
}

// Check if server is running
async function checkServer() {
  try {
    await axios.get(TEST_CONFIG.base_url, { 
      timeout: 5000,
      params: { channel_id: "test", user_id: "test" }
    });
    console.log('✅ Server is running on port 3000');
    return true;
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.log('❌ Server is not running on port 3000');
      console.log('💡 Start the server with: npm run start:dev');
    } else if (error.response) {
      // If we get a response (even an error), the server is running
      console.log('✅ Server is running and responding');
      return true;
    } else {
      console.log('❌ Server check failed:', error.message);
    }
    return false;
  }
}

// Check environment variables
function checkEnvironment() {
  console.log('🔍 Checking environment variables...');
  
  const requiredVars = ['SLACK_BOT_TOKEN', 'GEMINI_API_KEY'];
  const missing = [];
  
  requiredVars.forEach(varName => {
    if (!process.env[varName]) {
      missing.push(varName);
      console.log(`❌ ${varName} is not set`);
    } else {
      console.log(`✅ ${varName} is set`);
    }
  });
  
  if (missing.length > 0) {
    console.log('\n🚨 Missing environment variables:');
    missing.forEach(varName => {
      console.log(`   - ${varName}`);
    });
    console.log('\n💡 Set them with:');
    console.log(`   $env:SLACK_BOT_TOKEN="your-slack-token"`);
    console.log(`   $env:GEMINI_API_KEY="your-gemini-api-key"`);
    return false;
  }
  
  console.log('✅ All environment variables are set');
  return true;
}

// Main execution
async function main() {
  console.log('🔍 Checking environment...');
  const envOk = checkEnvironment();
  
  if (!envOk) {
    console.log('\n❌ Environment not properly configured. Please set the required variables.');
    return;
  }

  console.log('\n🔍 Checking server status...');
  const serverRunning = await checkServer();
  
  if (!serverRunning) {
    console.log('\n🚀 To start testing:');
    console.log('1. Start the server: npm run start:dev');
    console.log('2. Run this test: node test-gemini-integration.js');
    return;
  }

  console.log('\n🎯 Starting Slack + Gemini integration tests...');
  await runAllTests();
}

// Run the tests
main().catch(console.error); 