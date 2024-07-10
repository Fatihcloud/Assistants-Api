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
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

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
  console.log('Received message:', message, 'for thread:', threadId);
  if (!threadId) {
    await chatService.createThread(message);
    console.log('Created new thread:', chatService.threadId);
    res.json({ threadId: chatService.threadId, messages: chatService.messages });
  } else {
    const userMessage: Message = { role: 'user', content: message };
    await chatService.addMessageToThread(threadId, userMessage);
    await chatService.runAssistant(threadId);
    const updatedMessages = chatDb.loadMessages(threadId);
    console.log('Updated messages for thread:', threadId, updatedMessages);
    res.json({ threadId, messages: updatedMessages });
  }
  io.emit('newMessage', { threadId: chatService.threadId, messages: chatService.messages });
});

app.get('/api/messages', (req, res) => {
  const threadId = req.query.threadId as string;
  console.log('Fetching messages for thread:', threadId);
  if (threadId) {
    const messages = chatDb.loadMessages(threadId);
    console.log('Fetched messages for thread:', threadId, messages);
    res.json({ messages });
  } else {
    res.json({ messages: [] });
  }
});

app.get('/api/threads', (req, res) => {
  console.log('Fetching all thread IDs');
  const threads = chatDb.getAllThreadIds();
  console.log('Fetched thread IDs:', threads);
  res.json({ threads });
});

app.delete('/api/thread/:threadId', (req, res) => {
  const threadId = req.params.threadId;
  console.log('Deleting thread:', threadId);
  chatDb.deleteThread(threadId);
  res.sendStatus(200);
});

httpServer.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
