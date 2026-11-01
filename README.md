# 📇 ContactHub - Modern Contact Management Application

A fast, responsive, and intuitive full-stack Contact Management Application that allows you to easily create, view, search, filter, edit, and delete contacts.

---

## ✨ Features

- **Full Contact CRUD**:
  - **Create**: Add new contacts with first name, last name, phone, email, company, job title, category, favorite status, and notes.
  - **Read / View**: Browse contacts in responsive **Grid View** or clean **List View**. Click on any contact card to open the **Detail Drawer** with quick call/email buttons, copy-to-clipboard, and complete information.
  - **Update / Edit**: Full modal form to update any contact detail with validation.
  - **Delete**: Safe deletion with confirmation modal to prevent accidental data loss.
- **Search & Filter**:
  - **Real-time Live Search**: Instantly filters across first name, last name, email, phone, company, job title, and notes as you type.
  - **Category Pills**: Quickly filter by *All*, *Favorites*, *Work*, *Family*, *Friends*, or *Other*.
  - **Sorting**: Sort contacts alphabetically (A-Z, Z-A), or by recently added / oldest.
- **Data Persistence & Portability**:
  - Automatically saved to `data/contacts.json`.
  - **Export to CSV**: Download contacts into spreadsheet-compatible CSV format.
  - **Export to JSON**: Download a complete JSON backup of contacts.
  - **Import JSON**: One-click restore or bulk-import of contacts from any JSON file.
- **Modern UI / UX**:
  - Sleek dark theme styled with Tailwind CSS and Lucide icons.
  - Automatic colorful initials avatar badges.
  - Toast notifications confirming actions.
  - Keyboard shortcuts (`Esc` closes modals/drawers).

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Start the Server
```bash
npm start
```
Then open your browser and navigate to:
```
http://localhost:3000
```

### 3. Run Automated Tests
```bash
npm test
```

---

## 📡 REST API Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/contacts` | Retrieve all contacts (supports `?q=`, `?category=`, `?favorite=true`, `?sort=`) |
| `GET` | `/api/contacts/stats` | Retrieve total count, favorites count, and category breakdown |
| `GET` | `/api/contacts/:id` | Get details for a specific contact |
| `POST` | `/api/contacts` | Create a new contact entry |
| `PUT` | `/api/contacts/:id` | Update an existing contact |
| `PATCH` | `/api/contacts/:id/favorite` | Toggle favorite status |
| `DELETE` | `/api/contacts/:id` | Delete a contact |
| `GET` | `/api/contacts/export/csv` | Download contacts as CSV |
| `POST` | `/api/contacts/import` | Bulk import contacts from JSON array |

---

## 📂 Project Structure

```
├── data/
│   └── contacts.json       # Persistent JSON database (pre-seeded with samples)
├── public/
│   ├── css/
│   │   └── styles.css      # Custom styling, animations, and badges
│   ├── js/
│   │   └── app.js          # Frontend app logic, state management, & API client
│   └── index.html          # Main responsive SPA UI
├── test/
│   └── api.test.js         # Automated test suite using node:test
├── package.json            # Project dependencies and npm scripts
├── README.md               # Documentation
└── server.js               # Express server and REST API
```
