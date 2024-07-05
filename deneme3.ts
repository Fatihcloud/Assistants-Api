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
    messages = [{ role: 'user', content: userMessage }];
    thread = await openai.beta.threads.create({ messages: messages });
    await runAssistant(thread.id, assistantId);
  } catch (error) {
    console.error('Error creating thread:', error);
  }
}

async function addMessageToThread(threadId: string, message: Message) {
  try {
    await openai.beta.threads.messages.create(threadId, { role: message.role, content: message.content });
  } catch (error) {
    console.error('Error adding message to thread:', error);
  }
}

async function runAssistant(threadId: string, assistantId: string) {
  try {
    const stream = await openai.beta.threads.runs.create(threadId, {
      assistant_id: assistantId,
      additional_instructions: 'Please address the user as Jane Doe. The user has a premium account.',
      stream: true,
    });

    let assistantResponse = '';

    for await (const event of stream) {
      if (event.event === 'thread.message.delta') {
        const chunk = event.data.delta.content?.[0];
        if (chunk && 'text' in chunk && chunk.text?.value) {
          assistantResponse += chunk.text.value;
        }
      }
    }

    if (assistantResponse) {
      console.log(assistantResponse);
      messages.push({ role: 'assistant', content: assistantResponse });

      if (messages.length > 32) {
        messages = messages.slice(messages.length - 32);
      }
    }
    promptUser();
  } catch (error) {
    console.error('Error running assistant:', error);
  }
}

function promptUser() {
  rl.question('Mesajınızı girin: ', async (userMessage: string) => {
    const userMessageObject: Message = { role: 'user', content: userMessage };
    messages.push(userMessageObject);

    if (messages.length > 32) {
      messages = messages.slice(messages.length - 32);
    }

    if (thread) {
      await addMessageToThread(thread.id, userMessageObject);
      await runAssistant(thread.id, assistantId);
    } else {
      await createThread(userMessage);
    }
  });
}

promptUser();
