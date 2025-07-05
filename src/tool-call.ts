import { WebClient } from '@slack/web-api';

/**
 * This function handles the Mosaia tool call for fetching Slack chat history.
 * It fetches recent messages and posts them back to the Slack channel.
 *
 * @param {object} payload - The payload received from the Mosaia agent,
 * containing context like channel ID and user ID.
 * @param {string} payload.channel_id - The ID of the Slack channel to fetch messages from.
 * @param {string} payload.user_id - The ID of the user who invoked the command.
 * @param {string} [payload.text] - Optional text provided with the command (e.g., number of messages to fetch).
 * @returns {Promise<any>}
 */
export async function summarizeSlackChat(payload: { channel_id: string; user_id: string; text: string }): Promise<any> {
  console.log('=== TOOL CALL STARTED ===');
  console.log('Payload received:', JSON.stringify(payload, null, 2));
  
  const { channel_id, user_id, text } = payload;

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

  // Initialize Slack WebClient with your bot token
  const slackToken = process.env.ENV_VAR_ONE;
  console.log('Slack token available:', !!slackToken);
  
  if (!slackToken) {
    console.error('ENV_VAR_ONE (Slack token) is not set in environment variables.');
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Slack token not configured. Please set ENV_VAR_ONE in Mosaia dashboard.' })
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
          messages: []
        })
      };
    }

    // Format messages for Slack display
    const formattedMessages = history.messages.map(msg => {
        const userName = msg.user ? `<@${msg.user}>` : 'Unknown User';
        const messageText = msg.text || '';
      const timestamp = msg.ts ? new Date(parseFloat(msg.ts) * 1000).toLocaleString() : '';
      
      return `*${userName}* [${timestamp}]: ${messageText}`;
    });

    // Create the message to post back to Slack
    const messageText = `*Chat History (${formattedMessages.length} messages):*\n\n${formattedMessages.join('\n\n')}`;

    console.log('Posting message back to Slack...');

    // Post the chat history back to the Slack channel
    const postResult = await web.chat.postMessage({
            channel: channel_id,
      text: messageText,
      unfurl_links: false,
      unfurl_media: false
    });

    console.log('Message posted successfully:', postResult.ok);

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: `Successfully posted ${formattedMessages.length} messages back to Slack channel.`,
        channel_id: channel_id,
        message_count: formattedMessages.length,
        slack_response: postResult.ok
      })
    };

  } catch (error) {
    console.error('Error fetching or posting Slack messages:', error);
    
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
