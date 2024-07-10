
# Assistants-Api

Assistants-Api is a chat application that integrates with OpenAI's API to facilitate interactive conversations with an assistant. The application logs user and assistant messages to a SQLite database, maintaining the conversation context within each thread.

## Features

- Interactive chat with an OpenAI assistant
- Logs conversation to a SQLite database
- Maintains conversation context within threads
- User-friendly interface for managing chat threads and messages

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

1. Start the server:
    ```bash
    npx ts-node src/main.ts
    ```
2. Open your browser and navigate to `http://localhost:3000` to access the chat interface.
3. Use the interface to create new threads, send messages, and view conversation history.

## Code Overview

### Imports

- `OpenAI` from `openai`: For interacting with the OpenAI API.
- `express`, `body-parser`: For creating the API server.
- `dotenv`: For environment variable management.
- `better-sqlite3`: For SQLite database operations.

### Main Components

- `ChatDatabase`: Manages database operations for saving and loading messages.
- `ChatService`: Handles the chat logic and interactions with OpenAI.
- `main.ts`: Sets up the Express server and defines API endpoints.
- `app.js`: Manages the front-end logic and interactions with the server.
- `index.html`: Provides the main structure for the user interface.
- `styles.css`: Contains the styles for the user interface.

## Example Interaction

```plaintext
User: Hello!
Assistant: Hello [Your Name], how can I assist you today?
```

## Contributing

We welcome contributions to improve Assistants-Api. Please follow these steps to contribute:

1. Fork the repository.
2. Create a new branch (`git checkout -b feature-branch`).
3. Make your changes.
4. Commit your changes (`git commit -am 'Add new feature'`).
5. Push to the branch (`git push origin feature-branch`).
6. Create a new Pull Request.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
