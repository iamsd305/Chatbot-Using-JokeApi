# Chatbot Jokebot

A simple chatbot web app that tells jokes 🎭

- **Backend:** C server that exposes a joke/chat API (and/or websocket)  
- **Frontend:** HTML / CSS / JavaScript (and Next.js structure) for the chat UI  

The frontend sends requests to the C backend API to fetch and display jokes in a chat-like interface.

---

## 🚀 Features

- Chat-style interface for user messages
- Returns jokes from a custom C backend API
- Completely custom, no external chatbot service
- Can be extended with more endpoints or models later

---

## 🧱 Project Structure

> Adjust the folder names here if yours differ, but this is the idea.

```text
.
├── backend/                # C server source code (API)
│   ├── server.c            # main HTTP/WebSocket server (example name)
│   ├── Makefile            # optional build script for the server
│   └── ...                 # other C files / headers
│
├── db/                     # local database (if any)
│   └── custom.db
│
├── prisma/                 # Prisma schema (if used)
│   └── schema.prisma
│
├── public/                 # Static frontend assets
│   ├── chatbot.html        # main UI page
│   ├── chatbot.css         # styles for the chatbot
│   ├── chatbot.js          # frontend logic (calls the API)
│   ├── logo.svg
│   └── robots.txt
│
├── src/                    # Next.js app (if you use it)
│   └── app/
│       ├── api/            # Next API routes (optional / unused for C backend)
│       ├── globals.css
│       ├── layout.tsx
│       └── page.tsx
│
├── .gitignore
├── package.json
├── next.config.ts
├── tailwind.config.ts      # if you are using Tailwind
└── README.md 
```
## 🛠️ Tech Stack

- Backend: C (custom HTTP / WebSocket server)
- Frontend: HTML, CSS, JavaScript (plus optional Next.js/React layout)
- Database (optional): SQLite / custom .db file
- Tools: Node.js, npm, Prisma, Tailwind CSS (if configured)

## 🌐 Deployment
**🟦 Backend (C server)**

- The backend is a custom C server that exposes the joke API.
- I deployed it on Render:
- Create a repository on GitHub
- Connect it to Render → New Web Service
- Use a Dockerfile or a build command to compile server.c
- Make sure the server listens on:
0.0.0.0
- Port from environment variable: PORT
- Example in code:
```text
int port = atoi(getenv("PORT"));
```

- Render will generate a URL like:
```text
https://your-backend-name.onrender.com
```

- Use this URL in your frontend.

**🟩 Frontend (Static Files: HTML, CSS, JS)**

- The frontend lives in the public/ folder.
- You can deploy it on Vercel:
- Import the GitHub repository
- Framework: Static Site
- Output directory: public
- Deploy
- You’ll get a URL like:
```
https://your-frontend-name.vercel.app
```
**🔗 Connecting Frontend → Backend**

- Inside public/chatbot.js, update the API URL:
```text 
const API_BASE = "https://your-backend-name.onrender.com";
fetch(`${API_BASE}/joke`)
  .then(res => res.json())
  .then(data => console.log(data));
```
- This makes your deployed frontend talk to your deployed C backend.

## 🚀 How to Run Locally
Follow these steps to start the application on your own machine.
- Step 1: Configure for Localhost
Since the code might be set up for the cloud, ensure your frontend is looking at your local server, not the online one.

1) Open frontend/chatbot.js.
2) Find the fetchFromBackend function.
3) Ensure the backendUrl is set to Localhost:

JavaScript
```text
// frontend/chatbot.js

// const backendUrl = "https://jester-backend.onrender.com";  <-- Comment this out
const backendUrl = "http://localhost:7777";                 // <-- Use this for local
```
- Step 2: Start the C Backend
This acts as the "brain" of the application. It must be running in a terminal window for the chat to work.

1) Open a terminal.
2) Navigate to the backend folder:
```text
cd backend
```
3) Compile the Server (linking curl and pthread libraries):
```text
gcc server.c -o server -lcurl -pthread
```
4) Run the Server:
```text
./server
```
You should see: Server is ready on port 7777

- Step 3: Start the Frontend
Open the frontend folder in VS Code.

1) Open index.html.
2) Right-click inside the file and select "Open with Live Server" (or simply drag index.html into your Chrome/Firefox browser).

**🎮 How to Use**

1) Type "Hello" or "Time" for instant local responses.
2) Type "Programmer", "Cat", or any topic to fetch a joke from the C Server.
3) Watch your Terminal window! You will see logs like:
```text
New Web connection accepted. Web Client asked for: programmer
```
**❓ Troubleshooting**

Q: The bot says "I'm having trouble connecting..."
```text
Ans: Is your terminal window with ./server still open? The C program must be running in the background.
```
Q: Compilation Error: fatal error: curl/curl.h: No such file
```text
Ans: You are missing the curl library. Run: sudo apt-get install libcurl4-openssl-dev
```
Q: Compilation Error: undefined reference to curl_...
```text
Ans: You forgot the linker flags. Make sure you add -lcurl and -pthread when compiling.
```
## 🧪 Future Improvements

- Add more joke categories or multiple endpoints
- Persist chat history in a database
- Add authentication or user accounts
- Replace jokes with a real AI model later if needed
