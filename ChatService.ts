import OpenAI from "openai";
import { ChatDatabase, Message } from "./ChatDatabase";

export class ChatService {
    private _threadId: string | null = null;
    private _messages: Message[] = [];
  
    constructor(
      private openai: OpenAI,
      private assistantId: string,
      private additionalInstructions: string,
      private chatDb: ChatDatabase
    ) {}
  
    get threadId(): string | null {
      return this._threadId;
    }
  
    set threadId(value: string | null) {
      this._threadId = value;
    }
  
    get messages(): Message[] {
      return this._messages;
    }
  
    set messages(value: Message[]) {
      this._messages = value;
    }
  
    public async createThread(userMessage: string): Promise<void> {
      this._messages = [{ role: 'user', content: userMessage }];
      try {
        const thread = await this.openai.beta.threads.create({ messages: this._messages });
        this._threadId = thread.id;
        this.chatDb.saveMessage(this._threadId, this._messages[0]);
        await this.runAssistant(this._threadId);
      } catch (error) {
        console.error('Error creating thread:', error);
      }
    }
  
    public async addMessageToThread(threadId: string, message: Message): Promise<void> {
      try {
        await this.openai.beta.threads.messages.create(threadId, { role: message.role, content: message.content });
      } catch (error) {
        console.error('Error adding message to thread:', error);
      }
    }
  
    public async runAssistant(threadId: string): Promise<void> {
      try {
        const stream = await this.openai.beta.threads.runs.create(threadId, {
          assistant_id: this.assistantId,
          additional_instructions: this.additionalInstructions,
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
          const assistantMessage: Message = { role: 'assistant', content: assistantResponse };
          this._messages.push(assistantMessage);
          this.chatDb.saveMessage(threadId, assistantMessage);
  
          if (this._messages.length > 32) {
            this._messages = this._messages.slice(-32);
          }
          console.log('\n');  // Add newline after assistant response
        }
      } catch (error) {
        console.error('Error running assistant:', error);
      }
    }
  }
  