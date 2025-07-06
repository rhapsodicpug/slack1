const { GoogleGenerativeAI } = require('@google/generative-ai');

// Simple test to verify Gemini integration
async function testGeminiIntegration() {
  console.log('🧪 Testing Gemini AI Integration...');
  
  // Check if API key is available
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.log('❌ GEMINI_API_KEY not found in environment');
    console.log('💡 Set it with: $env:GEMINI_API_KEY="your-api-key"');
    console.log('🔗 Get your API key from: https://makersuite.google.com/app/apikey');
    return false;
  }
  
  console.log('✅ GEMINI_API_KEY found');
  
  try {
    // Initialize Gemini
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    console.log('✅ Gemini model initialized');
    
    // Test with sample Slack messages
    const sampleMessages = [
      "*@user1* [2024-01-15 10:30:00]: Hey team, how's the project going?",
      "*@user2* [2024-01-15 10:32:00]: We're making good progress on the frontend",
      "*@user3* [2024-01-15 10:35:00]: Backend API is almost ready for testing",
      "*@user1* [2024-01-15 10:40:00]: Great! Let's schedule a demo for Friday"
    ];
    
    const chatText = sampleMessages.join('\n\n');
    
    const prompt = `Please provide a concise summary of the following Slack chat conversation. Focus on the main topics discussed, key decisions made, and important points raised. Keep the summary professional and under 200 words:

${chatText}

Summary:`;

    console.log('🤖 Generating summary with Gemini...');
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const summary = response.text();
    
    console.log('✅ Summary generated successfully!');
    console.log('📝 Generated Summary:');
    console.log('─'.repeat(50));
    console.log(summary);
    console.log('─'.repeat(50));
    
    return true;
    
  } catch (error) {
    console.log('❌ Error testing Gemini integration:');
    console.log('Error:', error.message);
    
    if (error.message.includes('API_KEY')) {
      console.log('💡 Check your API key format and permissions');
    } else if (error.message.includes('quota')) {
      console.log('💡 Check your API quota and billing');
    } else if (error.message.includes('model')) {
      console.log('💡 Check if the model name is correct');
    }
    
    return false;
  }
}

// Test the summarizeWithGemini function from the tool
async function testToolFunction() {
  console.log('\n🧪 Testing Tool Function Integration...');
  
  try {
    // Import the function from the compiled code
    const { summarizeWithGemini } = require('./dist/tool-call');
    
    console.log('✅ Tool function imported successfully');
    
    const sampleMessages = [
      "*@user1* [2024-01-15 10:30:00]: Project status update needed",
      "*@user2* [2024-01-15 10:32:00]: Frontend is 80% complete",
      "*@user3* [2024-01-15 10:35:00]: Backend integration pending"
    ];
    
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.log('❌ Cannot test tool function without API key');
      return false;
    }
    
    console.log('🤖 Testing summarizeWithGemini function...');
    const summary = await summarizeWithGemini(sampleMessages, apiKey);
    
    console.log('✅ Tool function works!');
    console.log('📝 Summary from tool function:');
    console.log('─'.repeat(50));
    console.log(summary);
    console.log('─'.repeat(50));
    
    return true;
    
  } catch (error) {
    console.log('❌ Error testing tool function:');
    console.log('Error:', error.message);
    return false;
  }
}

// Main test execution
async function main() {
  console.log('🚀 Gemini Integration Test Suite');
  console.log('=================================');
  
  const geminiTest = await testGeminiIntegration();
  const toolTest = await testToolFunction();
  
  console.log('\n📊 Test Results:');
  console.log('================');
  console.log(`Gemini API Test: ${geminiTest ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`Tool Function Test: ${toolTest ? '✅ PASSED' : '❌ FAILED'}`);
  
  if (geminiTest && toolTest) {
    console.log('\n🎉 All tests passed! Gemini integration is working correctly.');
  } else {
    console.log('\n⚠️ Some tests failed. Check the error messages above.');
  }
}

// Run the tests
main().catch(console.error); 