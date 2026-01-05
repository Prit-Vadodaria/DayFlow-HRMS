/**
 * Migration Utility: LocalStorage to Firebase
 * 
 * This utility helps migrate existing data from localStorage to Firebase Firestore.
 * Run this ONCE after setting up Firebase to transfer your existing data.
 * 
 * HOW TO USE:
 * 1. Make sure Firebase is configured in .env
 * 2. Open browser console on your app
 * 3. Import and run: migrateToFirebase()
 * 4. Check console for migration results
 */

import { firestoreDB } from './firestore';
import { auth } from '../config/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';

// Old localStorage keys
const OLD_DB_KEYS = {
    USERS: 'dayflow_users',
    ATTENDANCE: 'dayflow_attendance',
    LEAVES: 'dayflow_leaves',
    CURRENT_USER: 'dayflow_current_user',
};

/**
 * Get data from localStorage
 */
const getLocalStorageData = (key) => {
    try {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : null;
    } catch (error) {
        console.error(`Error reading ${key} from localStorage:`, error);
        return null;
    }
};

/**
 * Migrate users from localStorage to Firebase
 */
const migrateUsers = async () => {
    console.log('🔄 Starting user migration...');
    const users = getLocalStorageData(OLD_DB_KEYS.USERS);

    if (!users || users.length === 0) {
        console.log('ℹ️ No users found in localStorage');
        return { success: 0, failed: 0 };
    }

    let successCount = 0;
    let failedCount = 0;

    for (const user of users) {
        try {
            // Check if user already exists in Firestore
            const existingUser = await firestoreDB.getUserByEmail(user.email);

            if (existingUser) {
                console.log(`⏭️ User ${user.email} already exists in Firestore, skipping...`);
                continue;
            }

            // Create Firebase Auth user (use a default password or prompt)
            // NOTE: Users will need to reset their password after migration
            const defaultPassword = 'TempPassword123!'; // Change this or prompt user

            try {
                await createUserWithEmailAndPassword(auth, user.email, defaultPassword);
            } catch (authError) {
                if (authError.code === 'auth/email-already-in-use') {
                    console.log(`⏭️ Auth user ${user.email} already exists, continuing with Firestore...`);
                } else {
                    throw authError;
                }
            }

            // Create user in Firestore (without password)
            const { password, ...userWithoutPassword } = user;
            await firestoreDB.createUser(userWithoutPassword, user.companyName || 'Dayflow');

            console.log(`✅ Migrated user: ${user.email}`);
            successCount++;
        } catch (error) {
            console.error(`❌ Failed to migrate user ${user.email}:`, error);
            failedCount++;
        }
    }

    console.log(`\n📊 User Migration Complete: ${successCount} successful, ${failedCount} failed`);
    return { success: successCount, failed: failedCount };
};

/**
 * Migrate attendance records from localStorage to Firebase
 */
const migrateAttendance = async () => {
    console.log('\n🔄 Starting attendance migration...');
    const attendance = getLocalStorageData(OLD_DB_KEYS.ATTENDANCE);

    if (!attendance || attendance.length === 0) {
        console.log('ℹ️ No attendance records found in localStorage');
        return { success: 0, failed: 0 };
    }

    let successCount = 0;
    let failedCount = 0;

    for (const record of attendance) {
        try {
            await firestoreDB.addAttendance(record);
            console.log(`✅ Migrated attendance record for ${record.userName} on ${record.date}`);
            successCount++;
        } catch (error) {
            console.error(`❌ Failed to migrate attendance record:`, error);
            failedCount++;
        }
    }

    console.log(`\n📊 Attendance Migration Complete: ${successCount} successful, ${failedCount} failed`);
    return { success: successCount, failed: failedCount };
};

/**
 * Migrate leave requests from localStorage to Firebase
 */
const migrateLeaves = async () => {
    console.log('\n🔄 Starting leave requests migration...');
    const leaves = getLocalStorageData(OLD_DB_KEYS.LEAVES);

    if (!leaves || leaves.length === 0) {
        console.log('ℹ️ No leave requests found in localStorage');
        return { success: 0, failed: 0 };
    }

    let successCount = 0;
    let failedCount = 0;

    for (const leave of leaves) {
        try {
            await firestoreDB.addLeave(leave);
            console.log(`✅ Migrated leave request for ${leave.userName}`);
            successCount++;
        } catch (error) {
            console.error(`❌ Failed to migrate leave request:`, error);
            failedCount++;
        }
    }

    console.log(`\n📊 Leave Requests Migration Complete: ${successCount} successful, ${failedCount} failed`);
    return { success: successCount, failed: failedCount };
};

/**
 * Main migration function
 * Call this to migrate all data from localStorage to Firebase
 */
export const migrateToFirebase = async () => {
    console.log('🚀 Starting migration from localStorage to Firebase...\n');
    console.log('⚠️ IMPORTANT: Make sure you have:');
    console.log('   1. Configured Firebase in .env file');
    console.log('   2. Set up Firestore security rules');
    console.log('   3. Backed up your localStorage data\n');

    try {
        // Migrate in order: users first, then related data
        const userResults = await migrateUsers();
        const attendanceResults = await migrateAttendance();
        const leaveResults = await migrateLeaves();

        console.log('\n✨ Migration Summary:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`Users:      ${userResults.success} ✅  ${userResults.failed} ❌`);
        console.log(`Attendance: ${attendanceResults.success} ✅  ${attendanceResults.failed} ❌`);
        console.log(`Leaves:     ${leaveResults.success} ✅  ${leaveResults.failed} ❌`);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

        const totalSuccess = userResults.success + attendanceResults.success + leaveResults.success;
        const totalFailed = userResults.failed + attendanceResults.failed + leaveResults.failed;

        console.log(`\nTotal: ${totalSuccess} successful, ${totalFailed} failed`);

        if (totalFailed === 0) {
            console.log('\n🎉 Migration completed successfully!');
            console.log('⚠️ IMPORTANT: All users have been assigned the default password: "TempPassword123!"');
            console.log('   Please ask users to reset their passwords immediately.');
            console.log('\n💡 You can now safely clear localStorage data or keep it as backup.');
        } else {
            console.log('\n⚠️ Migration completed with some errors. Please review the logs above.');
        }

        return {
            success: totalSuccess,
            failed: totalFailed,
            details: { userResults, attendanceResults, leaveResults }
        };
    } catch (error) {
        console.error('💥 Migration failed:', error);
        throw error;
    }
};

/**
 * Backup localStorage data to a JSON file
 * Download this before running migration
 */
export const backupLocalStorage = () => {
    const backup = {
        timestamp: new Date().toISOString(),
        users: getLocalStorageData(OLD_DB_KEYS.USERS),
        attendance: getLocalStorageData(OLD_DB_KEYS.ATTENDANCE),
        leaves: getLocalStorageData(OLD_DB_KEYS.LEAVES),
    };

    const dataStr = JSON.stringify(backup, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `dayflow-backup-${Date.now()}.json`;
    link.click();

    console.log('✅ Backup downloaded successfully!');
};

/**
 * Clear localStorage data (use after successful migration)
 */
export const clearLocalStorageData = () => {
    const confirmed = window.confirm(
        '⚠️ WARNING: This will delete all localStorage data!\n\n' +
        'Make sure you have:\n' +
        '1. Successfully migrated to Firebase\n' +
        '2. Downloaded a backup\n' +
        '3. Verified the data in Firebase Console\n\n' +
        'Continue?'
    );

    if (confirmed) {
        localStorage.removeItem(OLD_DB_KEYS.USERS);
        localStorage.removeItem(OLD_DB_KEYS.ATTENDANCE);
        localStorage.removeItem(OLD_DB_KEYS.LEAVES);
        localStorage.removeItem(OLD_DB_KEYS.CURRENT_USER);
        console.log('✅ localStorage data cleared!');
    } else {
        console.log('❌ Clear operation cancelled');
    }
};

// Export for use in browser console
if (typeof window !== 'undefined') {
    window.migrateToFirebase = migrateToFirebase;
    window.backupLocalStorage = backupLocalStorage;
    window.clearLocalStorageData = clearLocalStorageData;
}
