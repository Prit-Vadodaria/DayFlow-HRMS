# 🔥 Firebase Quick Reference

## Environment Setup

```bash
# 1. Install dependencies (already done)
npm install firebase

# 2. Configure .env file
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id

# 3. Start dev server
npm run dev
```

---

## Import Statements

```javascript
// Firebase Auth
import { useAuth } from '../context/AuthContext';

// Firestore Database
import { firestoreDB } from '../services/firestore';

// Firebase Config (rarely needed)
import { auth, db } from '../config/firebase';
```

---

## Authentication Usage

```javascript
// In your component
const { user, login, logout, register } = useAuth();

// Login
await login('user@example.com', 'password');

// Register
await register({
  name: 'John Doe',
  email: 'john@example.com',
  password: 'securePassword123',
  department: 'Engineering',
  jobTitle: 'Developer'
});

// Logout
await logout();

// Check if user is admin
if (user?.role === 'admin') {
  // Admin only features
}
```

---

## Firestore Operations

### Users

```javascript
// Get all users
const users = await firestoreDB.getUsers();

// Get user by ID
const user = await firestoreDB.getUserById('OIADMI20260001');

// Get user by email
const user = await firestoreDB.getUserByEmail('admin@dayflow.com');

// Create user
const newUser = await firestoreDB.createUser({
  name: 'Jane Doe',
  email: 'jane@example.com',
  role: 'employee',
  department: 'HR',
  jobTitle: 'HR Specialist',
  salary: 45000,
  phone: '123-456-7890',
  address: '123 Main St'
}, 'Dayflow');

// Update user
await firestoreDB.updateUser('userId', {
  salary: 50000,
  jobTitle: 'Senior HR Specialist'
});

// Delete user
await firestoreDB.deleteUser('userId');
```

### Attendance

```javascript
// Get all attendance (admin)
const allAttendance = await firestoreDB.getAttendance();

// Get user's attendance
const myAttendance = await firestoreDB.getAttendance(user.id);

// Add attendance
await firestoreDB.addAttendance({
  userId: user.id,
  userName: user.name,
  date: '2026-01-05',
  checkIn: '09:00',
  checkOut: '17:00',
  status: 'present'
});

// Update attendance
await firestoreDB.updateAttendance('attendanceId', {
  checkOut: '18:00',
  status: 'late'
});
```

### Leaves

```javascript
// Get all leaves (admin)
const allLeaves = await firestoreDB.getLeaves();

// Get user's leaves
const myLeaves = await firestoreDB.getLeaves(user.id);

// Add leave request
await firestoreDB.addLeave({
  userId: user.id,
  userName: user.name,
  leaveType: 'sick',
  startDate: '2026-01-10',
  endDate: '2026-01-12',
  reason: 'Medical appointment',
  status: 'pending'
});

// Update leave (approve/reject)
await firestoreDB.updateLeave('leaveId', {
  status: 'approved'
});
```

---

## Common Patterns

### Loading State

```javascript
const [loading, setLoading] = useState(true);
const [data, setData] = useState([]);

useEffect(() => {
  const fetchData = async () => {
    try {
      setLoading(true);
      const result = await firestoreDB.getUsers();
      setData(result);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };
  
  fetchData();
}, []);

if (loading) return <div>Loading...</div>;
```

### Error Handling

```javascript
try {
  await firestoreDB.createUser(userData);
  alert('User created successfully!');
} catch (error) {
  if (error.code === 'permission-denied') {
    alert('You do not have permission to perform this action');
  } else if (error.code === 'already-exists') {
    alert('User already exists');
  } else {
    alert('An error occurred: ' + error.message);
  }
}
```

### Protected Routes

```javascript
// Already implemented in App.jsx
const ProtectedRoute = () => {
  const { user } = useAuth();
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return <Layout />;
};
```

### Admin-Only Features

```javascript
const { user } = useAuth();

return (
  <div>
    {user?.role === 'admin' && (
      <button onClick={handleAdminAction}>
        Admin Only Action
      </button>
    )}
  </div>
);
```

---

## Migration Commands

```javascript
// In browser console after app loads

// 1. Backup existing data
backupLocalStorage();

// 2. Migrate to Firebase
await migrateToFirebase();

// 3. Clear old data (after verification)
clearLocalStorageData();
```

---

## Firestore Security Rules Template

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function isAdmin() {
      return isAuthenticated() && 
             get(/databases/$(database)/documents/users/$(request.auth.token.email)).data.role == 'admin';
    }
    
    match /users/{userId} {
      allow read: if isAuthenticated();
      allow update: if isAuthenticated() && request.auth.token.email == resource.data.email;
      allow create, delete: if isAdmin();
    }
    
    match /attendance/{attendanceId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated();
      allow update, delete: if isAdmin();
    }
    
    match /leaves/{leaveId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated();
      allow update: if isAdmin() || 
                      (isAuthenticated() && 
                       request.auth.uid == resource.data.userId && 
                       resource.data.status == 'pending');
    }
  }
}
```

---

## Common Firebase Errors

| Error Code | Meaning | Solution |
|------------|---------|----------|
| `auth/email-already-in-use` | Email is registered | Use different email or reset password |
| `auth/invalid-email` | Invalid email format | Check email format |
| `auth/weak-password` | Password too weak | Use stronger password (6+ chars) |
| `auth/user-not-found` | User doesn't exist | Check email or register |
| `auth/wrong-password` | Incorrect password | Check password or reset |
| `permission-denied` | No access rights | Check Firestore rules and user role |
| `not-found` | Document not found | Verify document ID |
| `unavailable` | Network error | Check internet connection |

---

## Useful Firebase Console Links

- **Authentication:** `https://console.firebase.google.com/project/YOUR_PROJECT/authentication`
- **Firestore:** `https://console.firebase.google.com/project/YOUR_PROJECT/firestore`
- **Storage:** `https://console.firebase.google.com/project/YOUR_PROJECT/storage`
- **Rules:** `https://console.firebase.google.com/project/YOUR_PROJECT/firestore/rules`
- **Usage:** `https://console.firebase.google.com/project/YOUR_PROJECT/usage`

---

## Testing Checklist

- [ ] Firebase config in `.env` is correct
- [ ] Can register new user
- [ ] Can login with email/password
- [ ] Can logout
- [ ] Can create employee (admin)
- [ ] Can view employees list
- [ ] Can mark attendance
- [ ] Can submit leave request
- [ ] Can approve/reject leaves (admin)
- [ ] Data persists after page reload
- [ ] Security rules are working

---

## Production Deployment Checklist

- [ ] Update Firestore rules to production mode
- [ ] Enable Firebase App Check
- [ ] Set up billing alerts
- [ ] Configure custom domain
- [ ] Enable Firebase Analytics
- [ ] Set up error monitoring
- [ ] Configure CORS policies
- [ ] Test all features in production
- [ ] Set up automated backups
- [ ] Document API keys securely

---

**Need Help?** Check `FIREBASE_SETUP.md` for detailed instructions!
