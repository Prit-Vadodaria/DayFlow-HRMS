import {
    collection,
    doc,
    getDoc,
    getDocs,
    setDoc,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    addDoc,
    serverTimestamp,
    Timestamp
} from 'firebase/firestore';
import { db } from '../config/firebase';

// Collection names
export const COLLECTIONS = {
    USERS: 'users',
    ATTENDANCE: 'attendance',
    LEAVES: 'leaves',
    PAYROLL: 'payroll'
};

// Helper for ID Generation (same as before)
const generateLoginId = (companyName, userName, count) => {
    const companyCode = companyName.replace(/\s/g, '').substring(0, 2).toUpperCase();
    const nameParts = userName.split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : firstName;
    const userCode = (firstName.substring(0, 2) + lastName.substring(0, 2)).toUpperCase();
    const year = new Date().getFullYear();
    const serial = String(count + 1).padStart(4, '0');
    return `${companyCode}${userCode}${year}${serial}`;
};

// ==================== USER OPERATIONS ====================

export const firestoreDB = {
    // Get all users
    getUsers: async () => {
        try {
            const usersRef = collection(db, COLLECTIONS.USERS);
            const snapshot = await getDocs(usersRef);
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (error) {
            console.error('Error getting users:', error);
            throw error;
        }
    },

    // Get user by ID
    getUserById: async (userId) => {
        try {
            const userRef = doc(db, COLLECTIONS.USERS, userId);
            const userSnap = await getDoc(userRef);
            if (userSnap.exists()) {
                return { id: userSnap.id, ...userSnap.data() };
            }
            return null;
        } catch (error) {
            console.error('Error getting user:', error);
            throw error;
        }
    },

    // Get user by email
    getUserByEmail: async (email) => {
        try {
            const usersRef = collection(db, COLLECTIONS.USERS);
            const q = query(usersRef, where('email', '==', email));
            const snapshot = await getDocs(q);
            if (!snapshot.empty) {
                const doc = snapshot.docs[0];
                return { id: doc.id, ...doc.data() };
            }
            return null;
        } catch (error) {
            console.error('Error getting user by email:', error);
            throw error;
        }
    },

    // Get user by loginId
    getUserByLoginId: async (loginId) => {
        try {
            const usersRef = collection(db, COLLECTIONS.USERS);
            const q = query(usersRef, where('loginId', '==', loginId));
            const snapshot = await getDocs(q);
            if (!snapshot.empty) {
                const doc = snapshot.docs[0];
                return { id: doc.id, ...doc.data() };
            }
            return null;
        } catch (error) {
            console.error('Error getting user by login ID:', error);
            throw error;
        }
    },

    // Create new user
    createUser: async (userData, companyName = 'Dayflow', manualCount = null) => {
        try {
            let count = manualCount;

            if (count === null) {
                try {
                    const users = await firestoreDB.getUsers();
                    const currentYear = new Date().getFullYear();
                    count = users.filter(u =>
                        u.companyName === companyName &&
                        u.joinedDate?.startsWith(String(currentYear))
                    ).length;
                } catch (error) {
                    console.warn('Could not fetch user count, using random serial:', error.message);
                    // Fallback to a random 4-digit number to avoid collision if we can't read the collection
                    count = Math.floor(Math.random() * 9000) + 1000;
                }
            }

            const loginId = generateLoginId(companyName, userData.name, count);

            const newUser = {
                ...userData,
                loginId: loginId,
                companyName: companyName,
                joinedDate: new Date().toISOString().split('T')[0],
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            };

            const userRef = doc(db, COLLECTIONS.USERS, loginId);
            await setDoc(userRef, newUser);

            return { id: loginId, ...newUser };
        } catch (error) {
            console.error('Error creating user:', error);
            throw error;
        }
    },

    // Update user
    updateUser: async (userId, userData) => {
        try {
            const userRef = doc(db, COLLECTIONS.USERS, userId);
            await updateDoc(userRef, {
                ...userData,
                updatedAt: serverTimestamp()
            });
            return { id: userId, ...userData };
        } catch (error) {
            console.error('Error updating user:', error);
            throw error;
        }
    },

    // Delete user
    deleteUser: async (userId) => {
        try {
            const userRef = doc(db, COLLECTIONS.USERS, userId);
            await deleteDoc(userRef);
        } catch (error) {
            console.error('Error deleting user:', error);
            throw error;
        }
    },

    // ==================== ATTENDANCE OPERATIONS ====================

    // Get all attendance records
    getAttendance: async (userId = null) => {
        try {
            const attendanceRef = collection(db, COLLECTIONS.ATTENDANCE);
            let q = attendanceRef;

            if (userId) {
                q = query(attendanceRef, where('userId', '==', userId), orderBy('date', 'desc'));
            } else {
                q = query(attendanceRef, orderBy('date', 'desc'));
            }

            const snapshot = await getDocs(q);
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (error) {
            console.error('Error getting attendance:', error);
            throw error;
        }
    },

    // Add attendance record
    addAttendance: async (attendanceData) => {
        try {
            const attendanceRef = collection(db, COLLECTIONS.ATTENDANCE);
            const docRef = await addDoc(attendanceRef, {
                ...attendanceData,
                createdAt: serverTimestamp()
            });
            return { id: docRef.id, ...attendanceData };
        } catch (error) {
            console.error('Error adding attendance:', error);
            throw error;
        }
    },

    // Update attendance record
    updateAttendance: async (attendanceId, attendanceData) => {
        try {
            const attendanceRef = doc(db, COLLECTIONS.ATTENDANCE, attendanceId);
            await updateDoc(attendanceRef, {
                ...attendanceData,
                updatedAt: serverTimestamp()
            });
        } catch (error) {
            console.error('Error updating attendance:', error);
            throw error;
        }
    },

    // ==================== LEAVE OPERATIONS ====================

    // Get all leave requests
    getLeaves: async (userId = null) => {
        try {
            const leavesRef = collection(db, COLLECTIONS.LEAVES);
            let q = leavesRef;

            if (userId) {
                q = query(leavesRef, where('userId', '==', userId), orderBy('createdAt', 'desc'));
            } else {
                q = query(leavesRef, orderBy('createdAt', 'desc'));
            }

            const snapshot = await getDocs(q);
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (error) {
            console.error('Error getting leaves:', error);
            throw error;
        }
    },

    // Add leave request
    addLeave: async (leaveData) => {
        try {
            const leavesRef = collection(db, COLLECTIONS.LEAVES);
            const docRef = await addDoc(leavesRef, {
                ...leaveData,
                createdAt: serverTimestamp()
            });
            return { id: docRef.id, ...leaveData };
        } catch (error) {
            console.error('Error adding leave:', error);
            throw error;
        }
    },

    // Update leave request
    updateLeave: async (leaveId, leaveData) => {
        try {
            const leaveRef = doc(db, COLLECTIONS.LEAVES, leaveId);
            await updateDoc(leaveRef, {
                ...leaveData,
                updatedAt: serverTimestamp()
            });
        } catch (error) {
            console.error('Error updating leave:', error);
            throw error;
        }
    },

    // ==================== INITIALIZATION ====================

    // Initialize with admin user (run once)
    initializeAdmin: async () => {
        try {
            const adminEmail = 'admin@dayflow.com';
            const existingAdmin = await firestoreDB.getUserByEmail(adminEmail);

            if (!existingAdmin) {
                const adminData = {
                    name: 'Admin User',
                    email: adminEmail,
                    role: 'admin',
                    department: 'HR',
                    jobTitle: 'HR Manager',
                    salary: 50000,
                    phone: '',
                    address: ''
                };

                await firestoreDB.createUser(adminData, 'Dayflow');
                console.log('Admin user initialized');
            }
        } catch (error) {
            console.error('Error initializing admin:', error);
        }
    }
};
