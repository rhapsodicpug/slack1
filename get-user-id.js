const { WebClient } = require('@slack/web-api');
require('dotenv').config();

async function getUserInfoAndChannels() {
  const slackToken = process.env.SLACK_BOT_TOKEN;
  
  if (!slackToken) {
    console.log('❌ SLACK_BOT_TOKEN is not set.');
    console.log('💡 Please set your Slack bot token in the .env file:');
    console.log('   SLACK_BOT_TOKEN=xoxb-your-bot-token-here');
    return;
  }

  const web = new WebClient(slackToken);

  try {
    console.log('🔍 Getting your Slack user information...');
    const authTest = await web.auth.test();
    console.log('\n✅ Your Slack User Information:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`👤 User ID: ${authTest.user_id}`);
    console.log(`📝 Username: ${authTest.user}`);
    console.log(`🏢 Team: ${authTest.team}`);
    console.log(`🏢 Team ID: ${authTest.team_id}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n💡 You can now use this User ID in your Slack tool calls!');
    console.log(`   Example: "Get chat history from channel C1234567890 for user ${authTest.user_id}"`);

    // List channels
    console.log('\n🔍 Fetching list of channels you have access to...');
    let channels = [];
    let cursor = undefined;
    do {
      const response = await web.conversations.list({
        limit: 1000,
        types: 'public_channel,private_channel',
        cursor
      });
      if (response.channels) {
        channels = channels.concat(response.channels);
      }
      cursor = response.response_metadata && response.response_metadata.next_cursor ? response.response_metadata.next_cursor : undefined;
    } while (cursor);

    if (channels.length === 0) {
      console.log('❌ No channels found. Make sure your bot is a member of at least one channel.');
    } else {
      console.log(`\n✅ You have access to ${channels.length} channels. Here are some of them:`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      channels.slice(0, 20).forEach((ch, idx) => {
        console.log(`${idx + 1}. #${ch.name}  (ID: ${ch.id})`);
      });
      if (channels.length > 20) {
        console.log(`...and ${channels.length - 20} more channels.`);
      }
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('\n💡 Use the channel ID (e.g., C1234567890) in your Slack tool calls!');
    }

  } catch (error) {
    console.error('❌ Error getting user or channel information:', error.message);
    if (error.message.includes('invalid_auth')) {
      console.log('\n💡 Your Slack token appears to be invalid. Please check:');
      console.log('   1. The token starts with "xoxb-"');
      console.log('   2. The token is correct and not expired');
      console.log('   3. The bot has the necessary permissions');
    }
  }
}

getUserInfoAndChannels(); 