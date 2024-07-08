#!/usr/bin/env -S ts-node
import OpenAI from 'openai';
import express from 'express';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import cors from 'cors';
import path from 'path';
import { ChatDatabase, Message } from './controllers/ChatDatabase';
import { ChatService } from './services/ChatService';
import { createServer } from 'http';
import { Server } from 'socket.io';

dotenv.config();

const app = express();
const port = 3000;

const httpServer = createServer(app);
const io = new Server(httpServer);

app.use(bodyParser.json());
app.use(cors());

// Statik dosyaları sunmak için
app.use(express.static(path.join(__dirname, '../public')));

const openai = new OpenAI();
const assistantId = process.env.ASSISTANT_ID as string;
const additionalInstructions = process.env.ADDITIONAL_INSTRUCTIONS as string;
const chatDb = new ChatDatabase('./chat.db');
const chatService = new ChatService(openai, assistantId, additionalInstructions, chatDb);

if (!assistantId || !additionalInstructions) {
  throw new Error("Environment variables ASSISTANT_ID and ADDITIONAL_INSTRUCTIONS must be set.");
}

app.post('/api/chat', async (req, res) => {
  const { message, threadId } = req.body;
  if (!threadId) {
    await chatService.createThread(message);
  } else {
    const userMessage: Message = { role: 'user', content: message };
    chatService.messages.push(userMessage);
    chatDb.saveMessage(threadId, userMessage);
    await chatService.addMessageToThread(threadId, userMessage);
    await chatService.runAssistant(threadId);
  }
  res.json({ threadId: chatService.threadId, messages: chatService.messages });
  io.emit('newMessage', { threadId: chatService.threadId, messages: chatService.messages });
});

app.get('/api/messages', (req, res) => {
  const threadId = req.query.threadId as string;
  if (threadId) {
    const messages = chatDb.loadMessages(threadId);
    res.json({ messages });
  } else {
    res.json({ messages: [] });
  }
});

app.get('/api/threads', (req, res) => {
  const threads = chatDb.getAllThreadIds();
  res.json({ threads });
});

httpServer.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
