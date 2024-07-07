#!/usr/bin/env -S ts-node
import OpenAI from 'openai';
import express from 'express';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import { ChatDatabase, Message } from './controllers/ChatDatabase';
import { ChatService } from './services/ChatService';

dotenv.config();

const app = express();
const port = 3000;

app.use(bodyParser.json());

const openai = new OpenAI();
const assistantId = process.env.ASSISTANT_ID as string;
const additionalInstructions = process.env.ADDITIONAL_INSTRUCTIONS as string;
const chatDb = new ChatDatabase('./chat.db');
const chatService = new ChatService(openai, assistantId, additionalInstructions, chatDb);

if (!assistantId || !additionalInstructions) {
  throw new Error("Environment variables ASSISTANT_ID and ADDITIONAL_INSTRUCTIONS must be set.");
}

app.post('/api/chat', async (req, res) => {
  const { message } = req.body;
  if (!chatService.threadId) {
    await chatService.createThread(message);
  } else {
    const userMessage: Message = { role: 'user', content: message };
    chatService.messages.push(userMessage);
    chatDb.saveMessage(chatService.threadId, userMessage);
    await chatService.addMessageToThread(chatService.threadId, userMessage);
    await chatService.runAssistant(chatService.threadId);
  }
  res.json({ messages: chatService.messages });
});

app.get('/api/messages', (req, res) => {
  if (chatService.threadId) {
    const messages = chatDb.loadMessages(chatService.threadId);
    res.json({ messages });
  } else {
    res.json({ messages: [] });
  }
});

app.get('/api/threads', (req, res) => {
  const threads = chatDb.getAllThreadIds();
  res.json({ threads });
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
