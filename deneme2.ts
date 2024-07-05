#!/usr/bin/env -S npm run tsn -T

import OpenAI from 'openai';
import readline from 'readline';
import fs from 'fs';
import path from 'path';

const openai = new OpenAI();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const logFilePath = path.join(__dirname, 'logs', 'chat_log.txt');

const assistantId = 'asst_kp6O4R8RffQtWVwaIovWPqCm';
let thread: any | null = null;

interface Message {
  role: "user" | "assistant";
  content: string;
}

let messages: Message[] = [];

function logToFile(message: string) {
  fs.appendFile(logFilePath, message + '\n', (err) => {
    if (err) {
      console.error('Failed to write to log file:', err);
    }
  });
}

async function createThread(userMessage: string) {
  try {
    logToFile('Creating new thread with message: ' + userMessage);
    messages = [{ role: 'user', content: userMessage }];

    logToFile('Messages being sent to create thread: ' + JSON.stringify(messages));
    thread = await openai.beta.threads.create({
      messages: messages,
    });
    logToFile('Thread created: ' + JSON.stringify(thread));

    await runAssistant(thread.id, assistantId);
  } catch (error) {
    if (error instanceof Error) {
      logToFile('Error creating thread: ' + error.message);
    } else {
      logToFile('Unknown error creating thread');
    }
    console.error('Error creating thread:', error);
  }
}

async function addMessageToThread(threadId: string, message: Message) {
  try {
    await openai.beta.threads.messages.create(threadId, {
      role: message.role,
      content: message.content,
    });
    logToFile('Message added to thread: ' + JSON.stringify(message));
  } catch (error) {
    if (error instanceof Error) {
      logToFile('Error adding message to thread: ' + error.message);
    } else {
      logToFile('Unknown error adding message to thread');
    }
    console.error('Error adding message to thread:', error);
  }
}

async function runAssistant(threadId: string, assistantId: string) {
  try {
    logToFile(`Running assistant on thread ${threadId} with assistant ${assistantId}`);
    logToFile('Messages being sent to assistant: ' + JSON.stringify(messages));
    const stream = await openai.beta.threads.runs.create(threadId, {
      assistant_id: assistantId,
      additional_instructions: 'Please address the user as Jane Doe. The user has a premium account.',
      stream: true,
    });

    let assistantResponse = '';

    for await (const event of stream) {
      logToFile('Event received: ' + JSON.stringify(event));
      if (event.event === 'thread.message.delta') {
        const chunk = event.data.delta.content?.[0];
        logToFile('Chunk received: ' + JSON.stringify(chunk));
        if (chunk && 'text' in chunk && chunk.text?.value) {
          assistantResponse += chunk.text.value;
        }
      }
    }

    if (assistantResponse) {
      logToFile('Assistant response: ' + assistantResponse);
      console.log(assistantResponse); // Tüm yanıtı bir kerede yazdırıyoruz
      messages.push({
        role: 'assistant',
        content: assistantResponse,
      });

      // En fazla 32 mesajı tutmak için eski mesajları kaldır
      if (messages.length > 32) {
        messages = messages.slice(messages.length - 32);
      }
    }

    logToFile('Updated messages after assistant response: ' + JSON.stringify(messages));
    logToFile('');
    promptUser();
  } catch (error) {
    if (error instanceof Error) {
      logToFile('Error running assistant: ' + error.message);
    } else {
      logToFile('Unknown error running assistant');
    }
    console.error('Error running assistant:', error);
  }
}

function promptUser() {
  rl.question('Mesajınızı girin: ', async (userMessage: string) => {
    logToFile('User message received: ' + userMessage);
    const userMessageObject: Message = { role: 'user', content: userMessage }; // Tür belirliyoruz
    messages.push(userMessageObject);

    // En fazla 32 mesajı tutmak için eski mesajları kaldır
    if (messages.length > 32) {
      messages = messages.slice(messages.length - 32);
    }

    if (thread) {
      logToFile('Continuing existing thread: ' + thread.id);
      await addMessageToThread(thread.id, userMessageObject);
      await runAssistant(thread.id, assistantId);
    } else {
      logToFile('No existing thread, creating new one.');
      await createThread(userMessage);
    }
  });
}

logToFile('Starting prompt...');
promptUser();
