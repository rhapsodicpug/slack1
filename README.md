# Slack Task Extractor Tool for Mosaia

A Mosaia tool that fetches recent chat history from a Slack channel, extracts tasks and action items using Google's Gemini AI, and provides a clean format for Google Sheets integration.

## Features

- 🤖 **AI-Powered Task Extraction**: Uses Google's Gemini AI to identify and extract actionable tasks from Slack conversations
- 📋 **Google Sheets Ready**: Returns tasks in a clean, structured format perfect for Google Sheets integration
- 📱 **Slack Integration**: Posts extracted tasks back to Slack with confirmation message
- 🔧 **Configurable Message Count**: Specify how many messages to fetch (default: 50, max: 200)
- 📊 **Rich Response Data**: Returns structured data to Mosaia with tasks, summary, and posting status

## Setup

### 1. Environment Variables

You'll need to set up two environment variables in the Mosaia dashboard:

- `SLACK_BOT_TOKEN`: Your Slack bot token
- `GEMINI_API_KEY`: Your Google Gemini API key

### 2. Getting Your Slack Bot Token

1. Go to [api.slack.com/apps](https://api.slack.com/apps)
2. Create a new app or select an existing one
3. Go to "OAuth & Permissions"
4. Add the following scopes:
   - `channels:history` - Read channel messages
   - `chat:write` - Post messages to channels
   - `users:read` - Read user information
5. Install the app to your workspace
6. Copy the "Bot User OAuth Token" (starts with `xoxb-`)

### 3. Getting Your Gemini API Key

1. Go to [makersuite.google.com/app/apikey](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the generated API key

### 4. Installation

```bash
npm install
npm run build
```

## Usage

### Local Development

```bash
npm run start:dev
```

### Testing

```bash
# Set environment variables
$env:SLACK_BOT_TOKEN="xoxb-your-token"
$env:GEMINI_API_KEY="your-gemini-api-key"

# Test the enhanced tool
npm run test:enhanced
```

### Mosaia Integration

The tool accepts the following parameters:

- `channel_id` (required): The Slack channel ID to fetch messages from
- `user_id` (required): The Slack user ID requesting the task extraction
- `text` (optional): Number of messages to fetch (default: 50, max: 200)

## Response Format

The tool returns a structured response with:

```json
{
  "message": "Successfully extracted X tasks from Y messages.",
  "channel_id": "C1234567890",
  "message_count": 10,
  "tasks": [
    "Task 1 description",
    "Task 2 description",
    "Task 3 description"
  ],
  "summary": "Brief summary of the conversation context",
  "tasks_for_sheets": [
    {
      "id": 1,
      "task": "Task 1 description",
      "status": "Pending",
      "created_date": "2025-01-07",
      "source": "Slack Chat"
    }
  ],
  "slack_message_posted": true
}
```

## Google Sheets Integration

The `tasks_for_sheets` array provides a clean format that can be directly used with Google Sheets:

- **id**: Unique identifier for each task
- **task**: The task description
- **status**: Default status (always "Pending")
- **created_date**: Date when the task was extracted
- **source**: Source of the task (always "Slack Chat")

## How It Works

1. **Fetch Messages**: Retrieves recent messages from the specified Slack channel
2. **AI Task Extraction**: Uses Gemini AI to analyze the conversation and extract actionable tasks
3. **Format for Sheets**: Structures the tasks in a clean format for Google Sheets integration
4. **Slack Notification**: Posts extracted tasks back to Slack with confirmation message
5. **Structured Response**: Returns comprehensive data to Mosaia for further processing

## Error Handling

The tool includes robust error handling for:
- Missing or invalid API keys
- Slack API errors
- Gemini AI service issues
- Network connectivity problems

All errors are logged and appropriate error messages are posted to Slack.

## Development

### Project Structure

```
slack1/
├── src/
│   ├── index.ts          # Main handler function
│   └── tool-call.ts      # Core tool logic with Gemini integration
├── bin/
│   ├── dev.js            # Development server
│   └── validate-manifest.js
├── .mosaia               # Tool manifest
└── package.json
```

### Building

```bash
npm run build
```

### Validation

```bash
npm run validate:manifest
```

## Troubleshooting

### Common Issues

1. **"Slack token not configured"**: Make sure `SLACK_BOT_TOKEN` is set in Mosaia dashboard
2. **"Gemini API key not configured"**: Ensure `GEMINI_API_KEY` is set in Mosaia dashboard
3. **Permission errors**: Verify your Slack bot has the required scopes
4. **Channel not found**: Check that the channel ID is correct and the bot is in the channel

### Getting Channel and User IDs

Use the included utility:

```bash
npm run get-user-id
```

This will help you find the correct IDs for testing.

## License

ISC
