# 🤝 Swaply

**Empower Your Learning through Direct Skill Exchange.**

Swaply is a modern, real-time platform designed to facilitate peer-to-peer knowledge sharing. Whether you're an expert looking to learn something new or a beginner ready to share your unique talents, Swaply connects you with the right partners to grow together.

---

## 🚀 Key Features

### 🛠️ Core Skill Exchange
- **Discovery**: Browse and search for users based on the skills they offer and the skills they want to learn.
- **Smart Requests**: Send tailored requests to potential partners with proposed durations and schedules.
- **Match Management**: Effortlessly track active, pending, and completed skill swaps.

### 💬 Real-time Communication
- **Global Chat**: Engage with the entire community in a unified chat room.
- **Direct Messaging**: Private, high-speed one-on-one messaging (WhatsApp-style) for focused collaboration.
- **Typing Indicators & Online Status**: Stay connected with real-time feedback.

### 📊 Swap Tracking & Quality
- **Learning Sessions**: Log and track individual sessions within a match to stay organized.
- **Ratings & Feedback**: Build trust within the community through transparent peer reviews.
- **Admin Dashboard**: Comprehensive moderation tools and community broadcast capabilities.

---

## 💻 Tech Stack

### Frontend
- **Framework**: [React](https://reactjs.org/) (v19) with [Vite](https://vitejs.dev/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **State & Routing**: React Router
- **Icons**: [Lucide React](https://lucide.dev/)
- **Real-time**: [Socket.io-client](https://socket.io/)

### Backend
- **Runtime**: [Node.js](https://nodejs.org/) & [Express.js](https://expressjs.com/)
- **Database**: [MongoDB](https://www.mongodb.com/) with [Mongoose](https://mongoosejs.com/)
- **Real-time**: [Socket.io](https://socket.io/)
- **Authentication**: JWT & Bcrypt
- **File Management**: Multer & [Cloudinary](https://cloudinary.com/)
- **Communication**: Nodemailer for system notifications

---

## 📂 Project Structure

```bash
Swaply/
├── client/                # React (Vite) Frontend
│   ├── src/
│   │   ├── components/    # UI Components (Navbar, Cards, etc.)
│   │   ├── pages/         # Page Views (Home, Chat, Profile, etc.)
│   │   ├── context/       # Auth & Global State
│   │   └── utils/         # API Helpers
├── server/                # Express Backend
│   ├── controllers/       # Business Logic
│   ├── models/            # Mongoose Schemas
│   ├── routes/            # API Endpoints
│   ├── middleware/        # Auth & Validation
│   └── utils/             # Helper Functions
```

---

## ⚙️ Getting Started

### Prerequisites
- Node.js (v18+)
- MongoDB (Local or Atlas)
- Cloudinary Account (for image uploads)

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/shivenrshukla/Swaply.git
   cd Swaply
   ```

2. **Setup Server**:
   ```bash
   cd server
   npm install
   # Create a .env file based on the provided configuration
   npm run dev
   ```

3. **Setup Client**:
   ```bash
   cd ../client
   npm install
   # Create a .env file (VITE_API_URL)
   npm run dev
   ```

## 👥 Authors

- **Shiven Shukla** - [shiven.shukla23@spit.ac.in](mailto:shiven.shukla23@spit.ac.in)

---

## 📄 License
This project is licensed under the ISC License.
