// src/index.ts
import { summarizeSlackChat } from './tool-call';

export async function handler(event: any): Promise<any> {
  console.log('Handler received event:', JSON.stringify(event, null, 2));

  try {
    await summarizeSlackChat(event);

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Tool execution initiated successfully.' }),
    };
  } catch (error: unknown) { // Explicitly type 'error' as 'unknown'
    console.error('Error in handler:', error);

    let errorMessage = 'An unknown error occurred.';
    if (error instanceof Error) { // Check if it's an Error object
      errorMessage = error.message;
    } else if (typeof error === 'string') { // Check if it's a string
      errorMessage = error;
    } else if (typeof error === 'object' && error !== null && 'message' in error) {
        // Check if it's an object with a 'message' property
        errorMessage = (error as { message: string }).message;
    }


    return {
      statusCode: 500,
      body: JSON.stringify({ error: errorMessage }),
    };
  }
}