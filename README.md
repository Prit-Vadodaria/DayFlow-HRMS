# 🌊 Dayflow HRMS

Dayflow is a premium, modern Human Resource Management System (HRMS) designed for small to medium-sized organizations. It provides a seamless experience for managing employees, tracking attendance, handling leave requests, and overseeing payroll.

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![React](https://img.shields.io/badge/React-19-blue.svg)
![Vite](https://img.shields.io/badge/Vite-latest-purple.svg)
![Firebase](https://img.shields.io/badge/Firebase-Firestore/Auth-orange.svg)
![Tailwind](https://img.shields.io/badge/Tailwind-CSS-38B2AC.svg)

---

## ✨ Key Features

### 👤 User Management
- **Admin Dashboard:** High-level overview of organization stats.
- **Employee Profiles:** Comprehensive digital profiles with skill tracking and salary details.
- **Role-Based Access:** Distinct permissions for Administrators and Employees.
- **System-Generated IDs:** Automatic generation of unique company-specific Login IDs.

### ⏰ Attendance & Time Tracking
- **Smart Clock-In/Out:** Real-time timer in the header with cloud persistence.
- **Status Indicators:** Live status (Present, Late, Absent, Leave) on the employee directory.
- **Attendance History:** Detailed logs for both admins and individual employees.

### 📅 Leave Management
- **Request System:** Easy-to-use form for various leave types (Vacation, Sick, Casual).
- **Approval Workflow:** Admins can approve or reject requests with real-time updates.

### 💰 Payroll
- **Salary Structure:** Automated breakdown of Basic, HRA, Medical, and Conveyance.
- **Admin Overview:** Monitor salary expenditures across the organization.

---

## 🛠️ Tech Stack

- **Frontend:** React.js (Vite)
- **Styling:** Tailwind CSS
- **Database:** Firebase Firestore
- **Authentication:** Firebase Auth
- **Icons:** Lucide React

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- NPM or Yarn
- A Firebase Project

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/dayflow-hrms.git
   cd dayflow-hrms
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Create a `.env` file in the root directory and add your Firebase credentials:
   ```env
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_id
   VITE_FIREBASE_APP_ID=your_app_id
   ```

4. **Run in Development Mode:**
   ```bash
   npm run dev
   ```

---

## 🏗️ Project Structure

```text
src/
├── components/     # Reusable UI components (Button, Input, Header, etc.)
├── config/         # Firebase initialization and settings
├── context/        # AuthContext for global user state
├── pages/          # Full page views (Dashboard, Login, Signup, etc.)
├── services/       # Firestore database operations (firestore.js)
├── utils/          # Migration and helper utilities
└── App.jsx         # Main routing and provider setup
```

---

## 🔒 Security & Roles

The system is protected by **Firebase Authentication** and **Firestore Security Rules**:

- **Admin:** Can create employees, approve leaves, view organization-wide attendance, and manage payroll.
- **Employee:** Can clock in/out, view their own history, submit leave requests, and update their profile.

For detailed security rule setup, refer to [FIREBASE_SETUP.md](./FIREBASE_SETUP.md).

---

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

