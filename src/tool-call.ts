import { WebClient } from '@slack/web-api';
import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * Get the current user's ID using the Slack API
 * @param slackToken - The Slack bot token
 * @returns Promise with user ID and username
 */
export async function getCurrentUserInfo(slackToken: string): Promise<{ user_id: string; username: string }> {
  const web = new WebClient(slackToken);
  
  try {
    const authTest = await web.auth.test();
    return {
      user_id: authTest.user_id!,
      username: authTest.user!
    };
  } catch (error) {
    console.error('Error getting user info:', error);
    throw new Error('Failed to get current user information from Slack');
  }
}

/**
 * Extract tasks from chat messages using Gemini AI
 * @param messages - Array of formatted chat messages
 * @param geminiApiKey - Gemini API key
 * @returns Promise with extracted tasks
 */
export async function extractTasksWithGemini(messages: string[], geminiApiKey: string): Promise<{ tasks: string[], summary: string }> {
  try {
    const genAI = new GoogleGenerativeAI(geminiApiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const chatText = messages.join('\n\n');
    
    const prompt = `Analyze the following Slack chat conversation and extract all tasks, action items, and assignments mentioned. \n\nReturn the response in this exact JSON format:\n{\n  "tasks": [\n    "Task 1 description",\n    "Task 2 description",\n    "Task 3 description"\n  ],\n  "summary": "Brief summary of the conversation context"\n}\n\nGuidelines:\n- Extract only actionable tasks and assignments\n- Include who is responsible if mentioned\n- Include deadlines if mentioned\n- Keep task descriptions clear and concise\n- If no tasks are found, return empty array for tasks\n- Summary should be 1-2 sentences about the conversation context\n\nChat conversation:\n${chatText}\n\nResponse (JSON only):`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let responseText = response.text();

    // Remove code block markers if present
    responseText = responseText.trim();
    if (responseText.startsWith('```json')) {
      responseText = responseText.replace(/^```json/, '').trim();
    }
    if (responseText.startsWith('```')) {
      responseText = responseText.replace(/^```/, '').trim();
    }
    if (responseText.endsWith('```')) {
      responseText = responseText.replace(/```$/, '').trim();
    }

    // Try to parse the JSON response
    try {
      const parsed = JSON.parse(responseText);
      return {
        tasks: Array.isArray(parsed.tasks) ? parsed.tasks : [],
        summary: typeof parsed.summary === 'string' ? parsed.summary : 'No summary available'
      };
    } catch (parseError) {
      console.error('Failed to parse Gemini response as JSON:', responseText);
      // Fallback: extract tasks manually from the response
      // Try to extract lines that look like tasks
      const lines = responseText.split('\n').map(line => line.trim()).filter(line => line && !line.startsWith('{') && !line.startsWith('}') && !line.startsWith('"summary"'));
      // Remove any leading 'tasks:' or similar
      const taskLines = lines.filter(line =>
        line.startsWith('-') ||
        line.startsWith('•') ||
        line.startsWith('*') ||
        line.match(/^\d+\./) ||
        line.toLowerCase().includes('task') ||
        line.toLowerCase().includes('need to') ||
        line.toLowerCase().includes('should') ||
        line.toLowerCase().includes('will')
      ).map(line => line.replace(/^[-•*\d.\s]+/, '').replace(/",?$/, '').replace(/^"/, '').trim());
      return {
        tasks: taskLines.length > 0 ? taskLines : ['No specific tasks identified'],
        summary: 'Tasks extracted from conversation'
      };
    }
  } catch (error) {
    console.error('Error extracting tasks with Gemini:', error);
    return {
      tasks: ['Error extracting tasks'],
      summary: 'Error processing conversation'
    };
  }
}

/**
 * This function handles the Mosaia tool call for fetching Slack chat history,
 * extracting tasks with Gemini AI, and posting the results back to Slack.
 *
 * @param {object} payload - The payload received from the Mosaia agent,
 * containing context like channel ID and user ID.
 * @param {string} payload.channel_id - The ID of the Slack channel to fetch messages from.
 * @param {string} payload.user_id - The ID of the user who invoked the command.
 * @param {string} [payload.text] - Optional text provided with the command (e.g., number of messages to fetch).
 * @param {object} payload.secrets - Contains SLACK_BOT_TOKEN and GEMINI_API_KEY
 * @returns {Promise<any>}
 */
export async function summarizeSlackChat(payload: { 
  channel_id: string; 
  user_id: string; 
  text: string; 
  secrets: { 
    SLACK_BOT_TOKEN: string;
    GEMINI_API_KEY: string;
  } 
}): Promise<any> {
  console.log('=== SLACK TASK EXTRACTOR TOOL CALL STARTED ===');
  console.log('Payload received:', JSON.stringify(payload, null, 2));
  
  const { channel_id, user_id, text, secrets } = payload;

  // Validate required parameters
  if (!channel_id) {
    console.error('Missing channel_id parameter');
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'channel_id is required' })
    };
  }

  if (!user_id) {
    console.error('Missing user_id parameter');
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'user_id is required' })
    };
  }

  // Initialize Slack WebClient with your bot token from secrets
  const slackToken = secrets.SLACK_BOT_TOKEN;
  const geminiApiKey = secrets.GEMINI_API_KEY;
  
  console.log('Slack token available:', !!slackToken);
  console.log('Gemini API key available:', !!geminiApiKey);
  
  if (!slackToken) {
    console.error('SLACK_BOT_TOKEN is not set in secrets.');
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Slack token not configured. Please set SLACK_BOT_TOKEN in Mosaia dashboard.' })
    };
  }

  if (!geminiApiKey) {
    console.error('GEMINI_API_KEY is not set in secrets.');
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Gemini API key not configured. Please set GEMINI_API_KEY in Mosaia dashboard.' })
    };
  }
  
  const web = new WebClient(slackToken);

  // Determine how many messages to fetch (default to 50, or parse from user input)
  let limit = 50;
  if (text && text.trim() !== '') {
    const parsedLimit = parseInt(text, 10);
    if (!isNaN(parsedLimit) && parsedLimit > 0 && parsedLimit <= 200) {
      limit = parsedLimit;
    }
  }

  console.log(`Fetching ${limit} messages from channel: ${channel_id}`);

  try {
    // Fetch recent messages from the Slack channel
    const history = await web.conversations.history({
      channel: channel_id,
      limit: limit,
    });

    console.log(`Fetched ${history.messages?.length || 0} messages from Slack`);

    if (!history.messages || history.messages.length === 0) {
      console.log('No messages found, posting empty message to Slack');
      
      await web.chat.postMessage({
        channel: channel_id,
        text: `No recent messages found in this channel.`
      });
      
      return {
        statusCode: 200,
        body: JSON.stringify({ 
          message: 'No recent messages found in this channel.',
          tasks: [],
          summary: 'No messages to analyze',
          tasks_for_sheets: []
        })
      };
    }

    // Format messages for analysis
    const formattedMessages = history.messages.map(msg => {
        const userName = msg.user ? `<@${msg.user}>` : 'Unknown User';
        const messageText = msg.text || '';
      const timestamp = msg.ts ? new Date(parseFloat(msg.ts) * 1000).toLocaleString() : '';
      
      return `*${userName}* [${timestamp}]: ${messageText}`;
    });

    // Extract tasks using Gemini AI
    console.log('Extracting tasks with Gemini AI...');
    const { tasks, summary } = await extractTasksWithGemini(formattedMessages, geminiApiKey);
    console.log('Tasks extracted:', tasks);
    console.log('Summary:', summary);

    // Format tasks for Google Sheets (clean format)
    const tasksForSheets = tasks.map((task, index) => ({
      id: index + 1,
      task: task,
      status: 'Pending',
      created_date: new Date().toISOString().split('T')[0],
      source: 'Slack Chat'
    }));

    // Create the message to post back to Slack
    const taskList = tasks.length > 0 
      ? tasks.map((task, index) => `${index + 1}. ${task}`).join('\n')
      : 'No specific tasks identified in the conversation.';

    const slackMessage = `✅ *Tasks have been extracted and added to Google Sheets!*

📋 *Your tasks according to chats till now:*
${taskList}

📝 *Context Summary:* ${summary}

*Total tasks extracted: ${tasks.length}*`;

    console.log('Posting task summary back to Slack...');

    // Post the task summary
    const messageResult = await web.chat.postMessage({
      channel: channel_id,
      text: slackMessage,
      unfurl_links: false,
      unfurl_media: false
    });

    console.log('Message posted successfully:', messageResult.ok);

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: `Successfully extracted ${tasks.length} tasks from ${formattedMessages.length} messages.`,
        channel_id: channel_id,
        message_count: formattedMessages.length,
        tasks: tasks,
        summary: summary,
        tasks_for_sheets: tasksForSheets,
        slack_message_posted: messageResult.ok
      })
    };

  } catch (error) {
    console.error('Error fetching, analyzing, or posting Slack messages:', error);
    
    let errorMessage = 'An unknown error occurred while processing messages.';
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === 'string') {
      errorMessage = error;
    }

    // Try to post error message to Slack
    try {
      await web.chat.postMessage({
        channel: channel_id,
        text: `❌ Error: ${errorMessage}`
      });
    } catch (postError) {
      console.error('Failed to post error message to Slack:', postError);
    }

    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: errorMessage,
        details: error instanceof Error ? error.stack : 'No stack trace available'
      })
    };
  }
}
