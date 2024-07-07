#!/usr/bin/env -S ts-node
import OpenAI from 'openai';
import readline from 'readline';
import dotenv from 'dotenv';
import { ChatDatabase, Message } from './ChatDatabase';
import { ChatService } from './ChatService';

dotenv.config();

const openai = new OpenAI();
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const assistantId = process.env.ASSISTANT_ID as string;
const additionalInstructions = process.env.ADDITIONAL_INSTRUCTIONS as string;
const chatDb = new ChatDatabase('./chat.db');
const chatService = new ChatService(openai, assistantId, additionalInstructions, chatDb);

if (!assistantId || !additionalInstructions) {
  throw new Error("Environment variables ASSISTANT_ID and ADDITIONAL_INSTRUCTIONS must be set.");
}

function askForNextAction(): void {
  rl.question('Yeni bir sohbete geçmek ister misiniz (y/n)? ', async (answer: string) => {
    if (answer.trim().toLowerCase() === 'y') {
      chatService.threadId = null;  // Yeni bir sohbet başlatmak için threadId'yi sıfırlıyoruz
      promptUser();
    } else {
      selectExistingThread();
    }
  });
}

function promptUser(): void {
  rl.question('Mesajınızı girin: ', async (userMessage: string) => {
    const userMessageObject: Message = { role: 'user', content: userMessage };
    chatService.messages.push(userMessageObject);
    if (chatService.threadId) {
      chatDb.saveMessage(chatService.threadId, userMessageObject);
      await chatService.addMessageToThread(chatService.threadId, userMessageObject);
      await chatService.runAssistant(chatService.threadId);
      askForNextAction();  // Yeni bir işlem yapıldıktan sonra aksiyon sor
    } else {
      await chatService.createThread(userMessage);
      askForNextAction();  // Yeni bir işlem yapıldıktan sonra aksiyon sor
    }
  });
}

function selectExistingThread(): void {
  const threadIds = chatDb.getAllThreadIds();
  if (threadIds.length === 0) {
    console.log('Hiç mevcut sohbet bulunamadı, yeni bir sohbet başlatılıyor...');
    promptUser();
    return;
  }
  console.log('Mevcut sohbetler:');
  threadIds.forEach((id, index) => console.log(`${index + 1}: Thread ID ${id}`));
  rl.question('Devam etmek istediğiniz sohbetin numarasını girin: ', async (index: string) => {
    const selectedIndex = parseInt(index.trim(), 10) - 1;
    if (selectedIndex >= 0 && selectedIndex < threadIds.length) {
      chatService.threadId = threadIds[selectedIndex];
      chatService.messages = chatDb.loadMessages(chatService.threadId);
      console.log('Seçilen sohbet yükleniyor...');
      for (const message of chatService.messages) {
        console.log(`${message.role}: ${message.content}`);
      }
      promptUser();
    } else {
      console.log('Geçersiz seçim, yeni bir sohbet başlatılıyor...');
      promptUser();
    }
  });
}

async function main() {
  askForNextAction();
}

main();
