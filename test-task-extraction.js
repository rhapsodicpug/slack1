const axios = require('axios');

// Test configuration
const BASE_URL = 'http://localhost:3000';
const SLACK_BOT_TOKEN = process.env.SLACK_BOT_TOKEN;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// Test channel and user IDs
const TEST_CHANNEL_ID = 'C093FMQ93BR';
const TEST_USER_ID = 'U12345678';

console.log('🧪 SLACK TASK EXTRACTOR TEST SUITE');
console.log('=====================================\n');

async function runTest(testName, testFunction) {
  console.log(`🧪 Running: ${testName}`);
  try {
    await testFunction();
    console.log(`✅ SUCCESS: ${testName}\n`);
  } catch (error) {
    console.log(`❌ FAILED: ${testName}`);
    console.log(`🚨 Error: ${error.message}\n`);
  }
}

async function testBasicTaskExtraction() {
  console.log('📋 Expected: Should extract tasks from recent chat messages');
  
  const response = await axios.get(`${BASE_URL}/`, {
    params: {
      channel_id: TEST_CHANNEL_ID,
      user_id: TEST_USER_ID,
      text: '10'
    }
  });

  console.log('📥 Response:', JSON.stringify(response.data, null, 2));
  
  // Validate response structure
  if (!response.data.tasks) {
    throw new Error('Response missing tasks array');
  }
  
  if (!response.data.tasks_for_sheets) {
    throw new Error('Response missing tasks_for_sheets array');
  }
  
  if (!response.data.summary) {
    throw new Error('Response missing summary');
  }
  
  console.log(`💬 Message: ${response.data.message}`);
  console.log(`📋 Tasks Extracted: ${response.data.tasks.length}`);
  console.log(`📊 Tasks for Sheets: ${response.data.tasks_for_sheets.length}`);
  console.log(`📝 Summary: ${response.data.summary}`);
  console.log(`✅ Slack Message Posted: ${response.data.slack_message_posted}`);
}

async function testDefaultMessageCount() {
  console.log('📋 Expected: Should extract tasks from default 50 messages');
  
  const response = await axios.get(`${BASE_URL}/`, {
    params: {
      channel_id: TEST_CHANNEL_ID,
      user_id: TEST_USER_ID,
      text: ''
    }
  });

  console.log('📥 Response:', JSON.stringify(response.data, null, 2));
  
  if (response.data.message_count > 50) {
    throw new Error('Should not fetch more than 50 messages by default');
  }
  
  console.log(`💬 Message: ${response.data.message}`);
  console.log(`📋 Tasks Extracted: ${response.data.tasks.length}`);
  console.log(`📊 Message Count: ${response.data.message_count}`);
}

async function testCustomMessageCount() {
  console.log('📋 Expected: Should extract tasks from 5 messages');
  
  const response = await axios.get(`${BASE_URL}/`, {
    params: {
      channel_id: TEST_CHANNEL_ID,
      user_id: TEST_USER_ID,
      text: '5'
    }
  });

  console.log('📥 Response:', JSON.stringify(response.data, null, 2));
  
  if (response.data.message_count > 5) {
    throw new Error('Should not fetch more than 5 messages');
  }
  
  console.log(`💬 Message: ${response.data.message}`);
  console.log(`📋 Tasks Extracted: ${response.data.tasks.length}`);
  console.log(`📊 Message Count: ${response.data.message_count}`);
}

async function testMissingChannelId() {
  console.log('📋 Expected: Should return validation error for missing channel_id');
  
  try {
    await axios.get(`${BASE_URL}/`, {
      params: {
        user_id: TEST_USER_ID,
        text: '5'
      }
    });
    throw new Error('Should have returned an error');
  } catch (error) {
    if (error.response && error.response.status === 400) {
      console.log('📥 Error Response (400):', JSON.stringify(error.response.data, null, 2));
      console.log('✅ Correctly returned validation error');
    } else {
      throw error;
    }
  }
}

async function testMissingUserId() {
  console.log('📋 Expected: Should return validation error for missing user_id');
  
  try {
    await axios.get(`${BASE_URL}/`, {
      params: {
        channel_id: TEST_CHANNEL_ID,
        text: '5'
      }
    });
    throw new Error('Should have returned an error');
  } catch (error) {
    if (error.response && error.response.status === 400) {
      console.log('📥 Error Response (400):', JSON.stringify(error.response.data, null, 2));
      console.log('✅ Correctly returned validation error');
    } else {
      throw error;
    }
  }
}

async function testInvalidMessageCount() {
  console.log('📋 Expected: Should cap at 200 messages and extract tasks');
  
  const response = await axios.get(`${BASE_URL}/`, {
    params: {
      channel_id: TEST_CHANNEL_ID,
      user_id: TEST_USER_ID,
      text: '999'
    }
  });

  console.log('📥 Response:', JSON.stringify(response.data, null, 2));
  
  if (response.data.message_count > 200) {
    throw new Error('Should not fetch more than 200 messages');
  }
  
  console.log(`💬 Message: ${response.data.message}`);
  console.log(`📋 Tasks Extracted: ${response.data.tasks.length}`);
  console.log(`📊 Message Count: ${response.data.message_count}`);
}

async function testTasksForSheetsFormat() {
  console.log('📋 Expected: Should return properly formatted tasks for Google Sheets');
  
  const response = await axios.get(`${BASE_URL}/`, {
    params: {
      channel_id: TEST_CHANNEL_ID,
      user_id: TEST_USER_ID,
      text: '10'
    }
  });

  console.log('📥 Response:', JSON.stringify(response.data, null, 2));
  
  // Validate tasks_for_sheets format
  const tasksForSheets = response.data.tasks_for_sheets;
  if (!Array.isArray(tasksForSheets)) {
    throw new Error('tasks_for_sheets should be an array');
  }
  
  if (tasksForSheets.length > 0) {
    const firstTask = tasksForSheets[0];
    const requiredFields = ['id', 'task', 'status', 'created_date', 'source'];
    
    for (const field of requiredFields) {
      if (!(field in firstTask)) {
        throw new Error(`tasks_for_sheets missing required field: ${field}`);
      }
    }
    
    if (firstTask.status !== 'Pending') {
      throw new Error('Default status should be "Pending"');
    }
    
    if (firstTask.source !== 'Slack Chat') {
      throw new Error('Source should be "Slack Chat"');
    }
  }
  
  console.log(`💬 Message: ${response.data.message}`);
  console.log(`📋 Tasks for Sheets: ${tasksForSheets.length}`);
  console.log(`📊 Sample Task:`, tasksForSheets[0] || 'No tasks found');
}

// Main test execution
async function runAllTests() {
  console.log('🚀 Starting Slack Task Extractor Tests...\n');
  
  await runTest('Basic Task Extraction Test', testBasicTaskExtraction);
  await runTest('Default Message Count Test', testDefaultMessageCount);
  await runTest('Custom Message Count Test', testCustomMessageCount);
  await runTest('Missing Channel ID Test', testMissingChannelId);
  await runTest('Missing User ID Test', testMissingUserId);
  await runTest('Invalid Message Count Test', testInvalidMessageCount);
  await runTest('Tasks for Sheets Format Test', testTasksForSheetsFormat);
  
  console.log('============================================================');
  console.log('📊 TEST SUMMARY');
  console.log('================');
  console.log('✅ All tests completed!');
  console.log('📋 Check the output above for detailed results.');
}

// Check if server is running
async function checkServer() {
  try {
    await axios.get(`${BASE_URL}/`, {
      params: {
        channel_id: 'test',
        user_id: 'test',
        text: '1'
      },
      timeout: 5000
    });
    console.log('✅ Server is running on', BASE_URL);
    return true;
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.log('❌ Server is not running. Please start the server first:');
      console.log('   npm run start:dev');
      return false;
    }
    // Other errors are expected for invalid test data
    return true;
  }
}

// Run tests
async function main() {
  const serverRunning = await checkServer();
  if (!serverRunning) {
    process.exit(1);
  }
  
  if (!SLACK_BOT_TOKEN || !GEMINI_API_KEY) {
    console.log('❌ Environment variables not set. Please set:');
    console.log('   SLACK_BOT_TOKEN');
    console.log('   GEMINI_API_KEY');
    process.exit(1);
  }
  
  await runAllTests();
}

main().catch(console.error); 