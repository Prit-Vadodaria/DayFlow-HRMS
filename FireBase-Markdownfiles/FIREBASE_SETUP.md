# Firebase Setup Guide for Dayflow HRMS

This guide will help you set up Firebase for the Dayflow HRMS application.

## Prerequisites

- A Google account
- Node.js and npm installed
- The Dayflow HRMS project

## Step 1: Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **"Add project"** or **"Create a project"**
3. Enter project name: `dayflow-hrms` (or your preferred name)
4. (Optional) Enable Google Analytics
5. Click **"Create project"**

## Step 2: Register Your Web App

1. In your Firebase project dashboard, click the **Web icon** (`</>`) to add a web app
2. Register app with nickname: `Dayflow Web`
3. Check **"Also set up Firebase Hosting"** (optional)
4. Click **"Register app"**
5. Copy the Firebase configuration object (you'll need this in Step 4)

## Step 3: Enable Firebase Services

### Enable Authentication

1. In the Firebase Console, go to **Build** > **Authentication**
2. Click **"Get started"**
3. Go to the **"Sign-in method"** tab
4. Enable **"Email/Password"** provider
5. Click **"Save"**

### Enable Firestore Database

1. In the Firebase Console, go to **Build** > **Firestore Database**
2. Click **"Create database"**
3. Select **"Start in test mode"** (for development)
   - **Important:** Change to production mode with proper security rules before deploying!
4. Choose a Cloud Firestore location (select closest to your users)
5. Click **"Enable"**

### (Optional) Enable Storage

1. In the Firebase Console, go to **Build** > **Storage**
2. Click **"Get started"**
3. Start in **test mode**
4. Click **"Done"**

## Step 4: Configure Your Application

1. Open the `.env` file in your project root
2. Fill in your Firebase configuration values from Step 2:

```env
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

**Where to find these values:**
- Go to Firebase Console > Project Settings (gear icon) > General
- Scroll down to "Your apps" section
- Click on your web app
- Copy the config values from the `firebaseConfig` object

## Step 5: Set Up Firestore Security Rules

1. In Firebase Console, go to **Firestore Database** > **Rules**
2. Replace the default rules with the following:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Helper function to check if user is authenticated
    function isAuthenticated() {
      return request.auth != null;
    }
    
    // Helper function to check if user is admin
    function isAdmin() {
      return isAuthenticated() && 
             get(/databases/$(database)/documents/users/$(request.auth.token.email)).data.role == 'admin';
    }
    
    // Users collection
    match /users/{userId} {
      // Authenticated users can read profiles (needed for teammate lists and ID lookup)
      allow read: if isAuthenticated();
      // Users can update their own profile
      allow update: if isAuthenticated() && request.auth.token.email == resource.data.email;
      // Allow initial creation if the email matches the auth token
      allow create: if isAuthenticated() && request.resource.data.email == request.auth.token.email;
      // Admins can create/delete any users
      allow create, delete: if isAdmin();
    }
    
    // Attendance collection
    match /attendance/{attendanceId} {
      // Users can read their own attendance
      allow read: if isAuthenticated() && request.auth.uid == resource.data.userId;
      // Admins can read all attendance
      allow read: if isAdmin();
      // Users can create their own attendance
      allow create: if isAuthenticated();
      // Admins can update/delete attendance
      allow update, delete: if isAdmin();
    }
    
    // Leaves collection
    match /leaves/{leaveId} {
      // Users can read their own leaves
      allow read: if isAuthenticated() && request.auth.uid == resource.data.userId;
      // Admins can read all leaves
      allow read: if isAdmin();
      // Users can create their own leave requests
      allow create: if isAuthenticated();
      // Admins can update leave status
      allow update: if isAdmin();
      // Users can update their pending leaves
      allow update: if isAuthenticated() && 
                      request.auth.uid == resource.data.userId && 
                      resource.data.status == 'pending';
    }
    
    // Payroll collection
    match /payroll/{payrollId} {
      // Users can read their own payroll
      allow read: if isAuthenticated() && request.auth.uid == resource.data.userId;
      // Admins can read/write all payroll
      allow read, write: if isAdmin();
    }
  }
}
```

3. Click **"Publish"**

## Step 6: Initialize Admin User

After setting up Firebase, you need to create the initial admin user:

1. **Temporarily modify Firestore rules** to allow user creation:
   - Go to Firestore Database > Rules
   - Temporarily add this rule at the top of the `users` match block:
   ```javascript
   allow create: if true; // TEMPORARY - REMOVE AFTER ADMIN CREATION
   ```

2. **Run the application:**
   ```bash
   npm run dev
   ```

3. **Create admin account:**
   - Go to the signup page
   - Register with email: `admin@dayflow.com`
   - Set a secure password
   - Fill in other required fields

4. **Update the admin role in Firestore:**
   - Go to Firebase Console > Firestore Database
   - Find the newly created user document
   - Edit the document and change `role` field from `employee` to `admin`

5. **Restore security rules:**
   - Remove the temporary `allow create: if true;` rule
   - Publish the rules again

## Step 7: Test the Application

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Test the following:
   - Login with admin credentials
   - Create a new employee
   - Add attendance records
   - Submit leave requests
   - View dashboard

## Firestore Collections Structure

Your Firestore database will have the following collections:

### `users`
```javascript
{
  id: "OIADMI20260001",
  name: "Admin User",
  email: "admin@dayflow.com",
  role: "admin", // or "employee"
  department: "HR",
  jobTitle: "HR Manager",
  salary: 50000,
  phone: "",
  address: "",
  loginId: "OIADMI20260001",
  companyName: "Dayflow",
  joinedDate: "2026-01-05",
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

### `attendance`
```javascript
{
  id: "auto-generated",
  userId: "OIADMI20260001",
  userName: "Admin User",
  date: "2026-01-05",
  checkIn: "09:00",
  checkOut: "17:00",
  status: "present", // present, absent, late
  createdAt: Timestamp
}
```

### `leaves`
```javascript
{
  id: "auto-generated",
  userId: "OIADMI20260001",
  userName: "Admin User",
  leaveType: "sick", // sick, casual, vacation
  startDate: "2026-01-10",
  endDate: "2026-01-12",
  reason: "Medical appointment",
  status: "pending", // pending, approved, rejected
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

## Important Security Notes

1. **Never commit `.env` file** - It's already in `.gitignore`
2. **Use production security rules** before deploying
3. **Enable App Check** for production (prevents unauthorized access)
4. **Set up billing alerts** in Google Cloud Console
5. **Review Firebase usage** regularly in the Firebase Console

## Troubleshooting

### Error: "Firebase: Error (auth/configuration-not-found)"
- Make sure you've filled in all values in the `.env` file
- Restart the development server after updating `.env`

### Error: "Missing or insufficient permissions"
- Check your Firestore security rules
- Make sure the user is authenticated
- Verify the user has the correct role

### Error: "Firebase: Error (auth/email-already-in-use)"
- The email is already registered
- Use a different email or reset the password

## Additional Resources

- [Firebase Documentation](https://firebase.google.com/docs)
- [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/get-started)
- [Firebase Authentication](https://firebase.google.com/docs/auth)

## Migration from LocalStorage

The old `src/services/db.js` file has been replaced with:
- `src/config/firebase.js` - Firebase initialization
- `src/services/firestore.js` - Firestore database operations
- Updated `src/context/AuthContext.jsx` - Firebase Authentication integration

All localStorage data will need to be migrated manually if you have existing data.
