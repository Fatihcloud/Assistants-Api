#!/usr/bin/env -S npm run tsn -T

import OpenAI from 'openai';
import readline from 'readline';

const openai = new OpenAI();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

async function main() {
  // Mevcut asistan ID'sini burada kullanacağız
  const assistantId = 'asst_kp6O4R8RffQtWVwaIovWPqCm';

  rl.question('Mesajınızı girin: ', async (userMessage) => {
    const thread = await openai.beta.threads.create({
      messages: [
        {
          role: 'user',
          content: userMessage,
        },
      ],
    });

    const stream = await openai.beta.threads.runs.create(thread.id, {
      assistant_id: assistantId,  // Mevcut asistan ID'sini burada kullanıyoruz
      additional_instructions: 'Please address the user as Jane Doe. The user has a premium account.',
      stream: true,
    });

    for await (const event of stream) {
      if (event.event === 'thread.message.delta') {
        const chunk = event.data.delta.content?.[0];
        if (chunk && 'text' in chunk && chunk.text?.value) {
          process.stdout.write(chunk.text.value ?? '');
        }
      }
    }

    console.log();
    rl.close();
  });
}

main();
