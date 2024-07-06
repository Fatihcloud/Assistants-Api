#!/usr/bin/env -S ts-node
import OpenAI from 'openai';
import readline from 'readline';
import dotenv from 'dotenv';

dotenv.config();

const openai = new OpenAI();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const assistantId = process.env.ASSISTANT_ID as string;
const additionalInstructions = process.env.ADDITIONAL_INSTRUCTIONS as string;

if (!assistantId) {
  throw new Error("Environment variable ASSISTANT_ID must be set.");
}

if (!additionalInstructions) {
  throw new Error("Environment variable ADDITIONAL_INSTRUCTIONS must be set.");
}

let thread: any | null = null;

interface Message {
  role: "user" | "assistant";
  content: string;
}

let messages: Message[] = [];

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
      additional_instructions: additionalInstructions,
      stream: true,
    });

    let assistantResponse = '';

    for await (const event of stream) {
      if (event.event === 'thread.message.delta') {
        const chunk = event.data.delta.content?.[0];
        if (chunk && 'text' in chunk && chunk.text?.value) {
          process.stdout.write(chunk.text.value);
          assistantResponse += chunk.text.value;
        }
      }
    }

    if (assistantResponse) {
      messages.push({ role: 'assistant', content: assistantResponse });

      if (messages.length > 32) {
        messages = messages.slice(messages.length - 32);
      }
      console.log('\n');  // Add newline after assistant response
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