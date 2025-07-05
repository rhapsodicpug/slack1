import { WebClient } from '@slack/web-api';

/**
 * This function handles the Mosaia tool call for fetching Slack chat history.
 * It fetches recent messages and returns them directly without any processing.
 *
 * @param {object} payload - The payload received from the Mosaia agent,
 * containing context like channel ID and user ID.
 * @param {string} payload.channel_id - The ID of the Slack channel to fetch messages from.
 * @param {string} payload.user_id - The ID of the user who invoked the command.
 * @param {string} [payload.text] - Optional text provided with the command (e.g., number of messages to fetch).
 * @returns {Promise<any>}
 */
export async function summarizeSlackChat(payload: { channel_id: string; user_id: string; text?: string }): Promise<any> {
  const { channel_id, user_id, text } = payload;

  // Initialize Slack WebClient with your bot token
  const slackToken = process.env.ENV_VAR_ONE;
  if (!slackToken) {
    console.error('ENV_VAR_ONE (Slack token) is not set in environment variables.');
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Slack token not configured' })
    };
  }
  const web = new WebClient(slackToken);

  // Determine how many messages to fetch (default to 50, or parse from user input)
  let limit = 50;
  if (text) {
    const parsedLimit = parseInt(text, 10);
    if (!isNaN(parsedLimit) && parsedLimit > 0 && parsedLimit <= 200) {
      limit = parsedLimit;
    }
  }

  try {
    // Fetch recent messages from the Slack channel
    const history = await web.conversations.history({
      channel: channel_id,
      limit: limit,
    });

    if (!history.messages || history.messages.length === 0) {
      return {
        statusCode: 200,
        body: JSON.stringify({ 
          message: 'No recent messages found in this channel.',
          messages: []
        })
      };
    }

    // Format messages for return (keep it simple)
    const formattedMessages = history.messages.map(msg => ({
      user: msg.user || 'Unknown User',
      text: msg.text || '',
      timestamp: msg.ts ? new Date(parseFloat(msg.ts) * 1000).toISOString() : '',
      type: msg.subtype || 'message'
    }));

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: `Successfully fetched ${formattedMessages.length} messages from channel.`,
        channel_id: channel_id,
        message_count: formattedMessages.length,
        messages: formattedMessages
      })
    };

  } catch (error) {
    console.error('Error fetching Slack messages:', error);
    
    let errorMessage = 'An unknown error occurred while fetching messages.';
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === 'string') {
      errorMessage = error;
    }

    return {
      statusCode: 500,
      body: JSON.stringify({ error: errorMessage })
    };
  }
}
