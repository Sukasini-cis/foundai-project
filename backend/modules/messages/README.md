# FoundAI - Messages Module (Full-Stack)

Full-stack real-time messaging portal with AngularJS, Node.js (Express), and MongoDB Atlas.

## Features

- **MongoDB Atlas Persistence**: Stores all conversations and individual message threads in the cloud.
- **RESTful Endpoints**:
  - `GET /api/conversations`: Retrieves all conversation threads.
  - `GET /api/conversations/:id/messages`: Retrieves messages for a specific conversation.
  - `POST /api/conversations/:id/messages`: Sends and persists a message in MongoDB Atlas.
  - `PUT /api/conversations/:id/read`: Toggles read/unread status.
  - `PUT /api/conversations/:id/verify-identity`: Authenticates and updates claim verification in the database.
  - `DELETE /api/conversations/:id`: Deletes a conversation from MongoDB Atlas.
- **Left Sidebar**:
  - Exact FoundAI sidebar matching dashboard layout and icons (with `Reward Escrow`, `Admin Mod`, and `Claims History` excluded).
- **Interactive UI**: Search conversations filter, unread indicators, item match cards, secure identity verification flow, and animated message entrance.

## Running the Module

```powershell
cd "D:\Webtech\messages"
node server.js
```
Open [http://localhost:5000](http://localhost:5000) in your browser.

Run automated backend tests:
```powershell
node test-api.js
```
