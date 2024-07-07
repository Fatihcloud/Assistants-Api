
# Assistants-Api

This is a simple command-line chat application that integrates with OpenAI's API to interact with an assistant. The application logs user and assistant messages to a SQLite database and maintains a conversation thread.

## Features

- Interactive chat with an OpenAI assistant
- Logs conversation to a SQLite database
- Maintains conversation context within a session

## Prerequisites

- Node.js and npm installed
- OpenAI API key

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
ASSISTANT_ID=your-assistant-id
ADDITIONAL_INSTRUCTIONS=Please address the user as [Your Name]. The user has a premium account.
```

## Usage

1. Save the script as `main.ts`.
2. Run the script using the following command:
    ```bash
    npx ts-node src/main.ts
    ```
3. Enter your messages when prompted.

## API Endpoints

### Send a Message

```sh
curl -X POST http://localhost:3000/api/chat -H "Content-Type: application/json" -d '{
  "message": "Hello, how are you?"
}'
```

### Get Messages

```sh
curl -X GET http://localhost:3000/api/messages
```

### Get All Thread IDs

```sh
curl -X GET http://localhost:3000/api/threads
```

## Code Overview

### Imports

- `OpenAI` from `openai`: For interacting with the OpenAI API.
- `express`, `body-parser`: For creating the API server.
- `dotenv`: For environment variable management.
- `better-sqlite3`: For SQLite database operations.

### Variables

- `openai`: Instance of the OpenAI client.
- `chatDb`: Instance of the ChatDatabase class for database operations.
- `chatService`: Instance of the ChatService class for handling chat logic.

### Functions

- `ChatDatabase`: Manages database operations for saving and loading messages.
- `ChatService`: Handles the chat logic and interactions with OpenAI.
- `main.ts`: Sets up the Express server and defines API endpoints.

## Example

```plaintext
Enter your message: Hello!
Assistant: Hello [Your Name], how can I assist you today?
```

## Notes

- The assistant will address the user as specified in the `.env` file.
- The conversation context is maintained within a session but not across different sessions.
- The SQLite database (`chat.db`) will store all messages.

## Contributing

1. Fork the repository.
2. Create a new branch (`git checkout -b feature-branch`).
3. Make your changes.
4. Commit your changes (`git commit -am 'Add new feature'`).
5. Push to the branch (`git push origin feature-branch`).
6. Create a new Pull Request.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
