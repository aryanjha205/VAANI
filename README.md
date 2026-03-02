# VAANI - Voice of Connection 🎙️

VAANI is a production-ready, real-time chat application built with Flask and Socket.IO. It features a modern, responsive UI inspired by WhatsApp, secure authentication, and persistent chat history.

## 🚀 Features

- **Real-time Messaging**: Instant one-to-one private chat using WebSockets.
- **Secure Auth**: Signup and Login with hashed passwords (bcrypt).
- **Presence Indicators**: Real-time online/offline status.
- **File Sharing**: Share images and documents seamlessly.
- **Message History**: Persistent chat storage in MongoDB Atlas.
- **Premium UI**: Modern layout with smooth transitions and mobile responsiveness.

## 🛠️ Tech Stack

- **Backend**: Python (Flask)
- **Real-time**: Flask-SocketIO
- **Database**: MongoDB Atlas
- **Security**: Flask-Bcrypt, Flask-Login
- **Frontend**: HTML5, CSS3 (Custom Glassmorphism), JavaScript (Vanilla)

## 📦 Installation

1. **Clone the project**
   ```bash
   cd VAANI
   ```

2. **Create a Virtual Environment**
   ```bash
   python -m venv venv
   source venv/bin/scripts/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install Dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Environment Setup**
   - Create a `.env` file based on `.env.example`.
   - Get your **MongoDB Atlas** connection string from the [MongoDB Dashboard](https://cloud.mongodb.com/).
   - Add your `SECRET_KEY` and `MONGO_URI` to the `.env` file.

5. **Run the Application**
   ```bash
   python app.py
   ```

## 🌐 Deployment

To deploy on **Render** or **Railway**:
1. Add `gunicorn` to `requirements.txt`.
2. Use the command: `gunicorn --worker-class eventlet -w 1 app:app`.
3. Set environment variables in the hosting dashboard.

---
Built with ❤️ by Antigravity
