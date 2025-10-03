
# 🍱 AnnaSetu
AnnaSetu-" A bridge between food donors and the hungry"

A real-time web platform that bridges the gap between **food donors** (restaurants, individuals) and **receivers** (NGOs, shelters, underprivileged individuals) to reduce food waste and fight hunger.

---

## 🚀 Key Features

- ✅ Secure user **authentication** and role-based access  
- 👥 Two user types: **Donor** and **Receiver**  
- 📝 Receivers can post **food requests** with quantity and location  
- 🎁 Donors can browse and **fulfill requests** instantly  
- 📊 Dashboards to **track donation status** and history    
- 🍽️ Simple, scalable architecture to support real-world use cases  

---

## 🛠️ Tech Stack

| Tech              | Description                          |
|-------------------|--------------------------------------|
| Node.js + Express | Backend server and API routes        |
| PostgreSQL        | Relational database for all records  |
| EJS               | Dynamic HTML rendering               |
| HTML/CSS/JS       | Frontend interface                   |
| bcrypt            | Secure password hashing              |
| express-session   | User session management              |

---

## 🗂️ Folder Structure

```
project-root/
├── screenshot            # screenshots of project
├── views/                # EJS templates
│   ├── donor.ejs
│   └── receiver.ejs
├── server.js             # Express server & route handlers
├── login.html            # Login page
├── registration.html     # Registration page
├── package.json          # Node dependencies
├── package-lock.json     # Node dependencies
└── README.md             # This file!
```

---

## ⚙️ Setup Instructions

### 1. Clone the Repository
```bash
git clone https://github.com/rajnikhil259/food_waste_management.git
cd food_waste_management
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Setup PostgreSQL Database

**Create Database:**
```sql
CREATE DATABASE raj;
```

**Create Tables:**
```sql
-- Users
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT NOT NULL,
  organization_name TEXT,
  location TEXT NOT NULL
);

-- Food Requests
CREATE TABLE food_requests (
  id SERIAL PRIMARY KEY,
  receiver_id INTEGER REFERENCES users(id),
  food_type TEXT NOT NULL,
  quantity TEXT NOT NULL,
  location TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending'
);

-- Donations
CREATE TABLE donations (
  id SERIAL PRIMARY KEY,
  donor_id INTEGER REFERENCES users(id),
  request_id INTEGER REFERENCES food_requests(id),
  message TEXT,
  status TEXT NOT NULL DEFAULT 'pending'
);
```

### 4. Start the Server
```bash
node server.js
```
The server will run on: [http://localhost:8000]

---

## 📸 Screenshots

- check screen shots inside screenshot folder provided

## 🚧 Future Enhancements

- 📬 Email notifications for donation updates  
- 📆 Track food expiration & priority  
- 🛠️ Admin panel for moderation  
- 📍 Google Maps integration to visualize donation routes   

---

## 👨‍💻 Author
- Developed by [NIKHIL RAJ] 
- 🎯 IIIT Manipur | B.Tech CSE
