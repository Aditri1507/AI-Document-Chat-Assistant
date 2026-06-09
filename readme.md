DocuMind AI

AI-powered document chat assistant built with React, Node.js, MongoDB, and Google's Gemini API.

Overview

DocuMind AI allows users to upload documents and ask questions based on the uploaded content. The application uses Retrieval-Augmented Generation (RAG) to provide contextual answers from document data instead of generic AI responses.

 Features

Authentication

* User Registration
* User Login
* JWT Authentication
* Protected Routes

Document Management

* Upload PDF files
* Upload TXT files
* Upload DOCX files
* Automatic text extraction
* Document chunking
* Vector embedding generation
* MongoDB document storage

AI-Powered Chat

* ChatGPT-style interface
* Context-aware responses
* Retrieval-Augmented Generation (RAG)
* Semantic search using embeddings
* Thread-based chat history
* Persistent conversations

Chat History

* Multiple chat threads
* Conversation persistence
* Sidebar history navigation
* Resume previous conversations

 Tech Stack

Frontend

* React.js
* Axios
* React Hooks
* Custom CSS

Backend

* Node.js
* Express.js
* MongoDB
* Mongoose

AI & NLP

* Google Gemini API
* LangChain
* Gemini Embeddings

Authentication

* JWT (JSON Web Token)
* bcrypt

Architecture

User Uploads Document
↓
Text Extraction
↓
Document Chunking
↓
Embedding Generation
↓
MongoDB Storage
↓
User Question
↓
Question Embedding
↓
Similarity Search
↓
Relevant Context Retrieval
↓
Gemini Response Generation
↓
Display Answer

## Project Structure

```text
DocuMind-AI/
│
├── frontend/
│   ├── src/
│   ├── public/
│   ├── package.json
│
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── config/
│   │
│   ├── uploads/
│   ├── package.json
│
├── README.md
└── .gitignore
```

## Database Collections

### Users

```json
{
  "_id": "",
  "name": "",
  "email": "",
  "password": ""
}
```

### Chats

```json
{
  "_id": "",
  "userId": "",
  "title": "",
  "messages": [
    {
      "role": "user",
      "content": ""
    },
    {
      "role": "assistant",
      "content": ""
    }
  ],
  "createdAt": ""
}
```

### Documents

```json
{
  "_id": "",
  "userId": "",
  "fileName": "",
  "chunks": [
    {
      "text": "",
      "embedding": []
    }
  ],
  "createdAt": ""
}
```

Installation

Clone Repository

### Backend Setup

```bash
cd backend
npm install
npm run dev


### Frontend Setup

cd frontend
npm install
npm run dev


## Environment Variables

Create a `.env` file inside the backend directory.

```env
MONGO_URI=your_mongodb_connection_string

JWT_SECRET=your_jwt_secret

GEMINI_API_KEY=your_gemini_api_key
```

## API Endpoints

### Authentication

#### Register User

```http
POST /api/auth/signup
```

#### Login User

```http
POST /api/auth/login
```

### Document APIs

#### Upload Document

```http
POST /api/upload
```

### Chat APIs

#### Ask Question

```http
POST /api/chat
```

#### Get Chat History

```http
GET /api/chat/history
```

#### Get Chat Thread

```http
GET /api/chat/:id
```
