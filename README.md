
# Assistants-Api

This is a simple command-line chat application that integrates with OpenAI's API to interact with an assistant. The application logs user and assistant messages to a file and maintains a conversation thread.

## Features

- Interactive chat with an OpenAI assistant
- Logs conversation to a file
- Maintains conversation context within a session

## Prerequisites

- Node.js and npm installed
- OpenAI API key
- Create a directory named `logs` in the same directory as the script

## Installation

1. Clone the repository or download the project files.
    ```bash
    git clone <repository-url>
    cd Assistants-Api
    ```
2. Install the required packages.
    ```bash
    npm install
    ```

## Configuration

Create a `.env` file in the root directory of the project with the following content:

```plaintext
ASSISTANT_ID=ASSISTANT_ID
ADDITIONAL_INSTRUCTIONS=Please address the user as Fatih Bulut. The user has a premium account.
```

## Usage

1. Save the script as `main.ts`.
2. Run the script using the following command:
    ```bash
    npm run tsn -T main.ts
    ```
3. Enter your messages when prompted.

## Code Overview

### Imports

- `OpenAI` from `openai`: For interacting with the OpenAI API.
- `readline`: For reading user input from the command line.
- `fs` and `path`: For file system operations.

### Variables

- `openai`: Instance of the OpenAI client.
- `rl`: Readline interface for user input.
- `logFilePath`: Path to the log file.
- `assistantId`: ID of the assistant to interact with.
- `thread`: Variable to store the current conversation thread.
- `messages`: Array to store the conversation messages.

### Functions

- `logToFile(message)`: Appends a message to the log file.
- `createThread(userMessage)`: Creates a new conversation thread with the initial user message.
- `addMessageToThread(threadId, message)`: Adds a message to an existing thread.
- `runAssistant(threadId, assistantId)`: Runs the assistant and streams responses.
- `promptUser()`: Prompts the user for input and handles the conversation flow.

## Example

```plaintext
Mesajınızı girin: Hello!
Assistant: Hello Fatih Bulut, how can I assist you today?
```

## Notes

- The assistant will address the user as Fatih Bulut and assumes the user has a premium account.
- The conversation context is maintained within a session but not across different sessions.
- The log file (`chat_log.txt`) will be created in the `logs` directory.

## Contributing

1. Fork the repository.
2. Create a new branch (`git checkout -b feature-branch`).
3. Make your changes.
4. Commit your changes (`git commit -am 'Add new feature'`).
5. Push to the branch (`git push origin feature-branch`).
6. Create a new Pull Request.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
