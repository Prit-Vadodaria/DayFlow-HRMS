import React, { createContext, useContext, useState, useEffect } from 'react';
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    sendPasswordResetEmail
} from 'firebase/auth';
import { auth, getSecondaryAuth } from '../config/firebase';
import { deleteApp } from 'firebase/app';
import { firestoreDB } from '../services/firestore';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [firebaseUser, setFirebaseUser] = useState(null);

    useEffect(() => {
        // Listen to Firebase auth state changes
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                // User is signed in, fetch user data from Firestore
                try {
                    const userData = await firestoreDB.getUserByEmail(firebaseUser.email);
                    if (userData) {
                        setUser(userData);
                        setFirebaseUser(firebaseUser);
                    } else {
                        // User exists in Firebase Auth but not in Firestore
                        console.error('User data not found in Firestore');
                        setUser(null);
                        setFirebaseUser(null);
                    }
                } catch (error) {
                    console.error('Error fetching user data:', error);
                    setUser(null);
                    setFirebaseUser(null);
                }
            } else {
                // User is signed out
                setUser(null);
                setFirebaseUser(null);
            }
            setLoading(false);
        });

        // Cleanup subscription
        return () => unsubscribe();
    }, []);

    // Login with email or Login ID and password
    const login = async (identifier, password) => {
        try {
            let email = identifier;

            // If identifier is not an email, try to find user by loginId
            if (!identifier.includes('@')) {
                const userById = await firestoreDB.getUserByLoginId(identifier);
                if (userById && userById.email) {
                    email = userById.email;
                } else {
                    throw new Error('Invalid Login ID');
                }
            }

            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const userData = await firestoreDB.getUserByEmail(email);

            if (userData) {
                setUser(userData);
                setFirebaseUser(userCredential.user);
                return true;
            }
            return false;
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    };

    // Logout
    const logout = async () => {
        try {
            await signOut(auth);
            setUser(null);
            setFirebaseUser(null);
        } catch (error) {
            console.error('Logout error:', error);
            throw error;
        }
    };

    // Register new user (for public signup - signs user in automatically)
    const register = async (userData) => {
        try {
            // Check if email already exists in Firestore
            const existingUser = await firestoreDB.getUserByEmail(userData.email);
            if (existingUser) {
                throw new Error('Email already exists');
            }

            // Create Firebase Auth user
            const userCredential = await createUserWithEmailAndPassword(
                auth,
                userData.email,
                userData.password
            );

            // Create user document in Firestore (without password)
            const { password, ...userDataWithoutPassword } = userData;
            const newUser = await firestoreDB.createUser(
                {
                    ...userDataWithoutPassword,
                    role: userData.role || 'employee',
                },
                userData.companyName // Pass companyName as second argument
            );

            setUser(newUser);
            setFirebaseUser(userCredential.user);
            return newUser;
        } catch (error) {
            console.error('Registration error:', error);
            throw error;
        }
    };

    // Admin-only: Create user without switching session
    const adminCreateUser = async (userData) => {
        const secondaryAuth = getSecondaryAuth();
        try {
            // 1. Create in Firebase Auth using secondary instance
            const userCredential = await createUserWithEmailAndPassword(
                secondaryAuth,
                userData.email,
                userData.password
            );

            // 2. Create in Firestore
            const { password, ...userDataWithoutPassword } = userData;
            const newUser = await firestoreDB.createUser(
                {
                    ...userDataWithoutPassword,
                    role: userData.role || 'employee',
                },
                userData.companyName
            );

            // 3. Sign out of secondary instance and delete the app
            await signOut(secondaryAuth);
            await deleteApp(secondaryAuth.app);

            return newUser;
        } catch (error) {
            // Cleanup on error
            if (secondaryAuth.app) {
                await deleteApp(secondaryAuth.app);
            }
            console.error('Admin user creation error:', error);
            throw error;
        }
    };

    // Update user profile
    const updateUserProfile = async (userId, updates) => {
        try {
            await firestoreDB.updateUser(userId, updates);
            // Refresh user data
            const updatedUser = await firestoreDB.getUserById(userId);
            setUser(updatedUser);
            return updatedUser;
        } catch (error) {
            console.error('Update profile error:', error);
            throw error;
        }
    };

    // Reset password
    const resetPassword = async (email) => {
        try {
            await sendPasswordResetEmail(auth, email);
        } catch (error) {
            console.error('Password reset error:', error);
            throw error;
        }
    };

    const value = {
        user,
        firebaseUser,
        login,
        logout,
        register,
        adminCreateUser,
        updateUserProfile,
        resetPassword,
        loading
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
