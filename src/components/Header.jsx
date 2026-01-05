import React, { useState, useEffect, useRef } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { firestoreDB } from '../services/firestore';
import { Menu, User, Timer, LogOut, CheckCircle, XCircle, Plane, AlertCircle } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export const Header = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [isAttendanceOpen, setIsAttendanceOpen] = useState(false);
    const [isCheckedIn, setIsCheckedIn] = useState(false);
    const [elapsedTime, setElapsedTime] = useState(null);
    const profileRef = useRef(null);
    const attendanceRef = useRef(null);

    // Initial Status Check
    useEffect(() => {
        const checkStatus = async () => {
            const today = new Date().toISOString().split('T')[0];
            try {
                const allAttendance = await firestoreDB.getAttendance(); // Filter by API in real app
                // Filter for *this* user
                const myToday = allAttendance.find(r => r.userId === user.id && r.date === today);

                if (myToday && !myToday.checkOut) {
                    setIsCheckedIn(true);
                    // Calculate elapsed
                    const start = new Date(`${today}T${myToday.checkIn}`);
                    const diff = new Date() - start;
                    setElapsedTime(diff);
                } else {
                    setIsCheckedIn(false);
                    setElapsedTime(null);
                }
            } catch (error) {
                console.error('Error checking attendance status:', error);
            }
        };

        checkStatus();
    }, [user.id, isAttendanceOpen]); // Re-check when toggling menu

    // Timer Tick
    useEffect(() => {
        let interval;
        if (isCheckedIn) {
            interval = setInterval(() => {
                setElapsedTime(prev => prev + 1000);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [isCheckedIn]);

    const formatTime = (ms) => {
        if (!ms) return "00:00:00";
        const seconds = Math.floor((ms / 1000) % 60);
        const minutes = Math.floor((ms / (1000 * 60)) % 60);
        const hours = Math.floor((ms / (1000 * 60 * 60)));
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    };

    const handleCheckIn = async () => {
        const now = new Date();
        const today = now.toISOString().split('T')[0];
        const time = now.toTimeString().split(' ')[0];

        try {
            await firestoreDB.addAttendance({
                userId: user.id,
                userName: user.name,
                date: today,
                checkIn: time,
                status: 'Present'
            });
            setIsCheckedIn(true);
            setElapsedTime(0);
            setIsAttendanceOpen(false);
        } catch (error) {
            console.error('Error checking in:', error);
        }
    };

    const handleCheckOut = async () => {
        const now = new Date();
        const today = now.toISOString().split('T')[0];
        const time = now.toTimeString().split(' ')[0];

        try {
            // Find record to update
            const all = await firestoreDB.getAttendance();
            const record = all.find(r => r.userId === user.id && r.date === today && !r.checkOut);

            if (record) {
                // Calculate hours
                const start = new Date(`${today}T${record.checkIn}`);
                const hours = ((now - start) / (1000 * 60 * 60)).toFixed(2);

                await firestoreDB.updateAttendance(record.id, {
                    checkOut: time,
                    workingHours: hours
                });
            }
            setIsCheckedIn(false);
            setElapsedTime(null);
            setIsAttendanceOpen(false);
        } catch (error) {
            console.error('Error checking out:', error);
        }
    };

    const navItems = [
        { label: 'Employees', to: '/employees', roles: ['admin', 'employee'] },
        { label: 'Attendance', to: '/attendance', roles: ['admin', 'employee'] },
        { label: 'Time Off', to: '/leaves', roles: ['admin', 'employee'] },
        { label: 'Payroll', to: '/payroll', roles: ['admin', 'employee'] },
    ];

    const filteredNav = navItems.filter(item => item.roles.includes(user?.role));

    // Outside Click Handling
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (profileRef.current && !profileRef.current.contains(event.target)) {
                setIsProfileOpen(false);
            }
            if (attendanceRef.current && !attendanceRef.current.contains(event.target)) {
                setIsAttendanceOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <header className="bg-white border-b border-slate-200 h-14 flex items-center justify-between px-4 fixed top-0 w-full z-50">
            {/* Left: Logo & Nav */}
            <div className="flex items-center gap-8">
                <div className="flex items-center gap-2 font-bold text-xl text-indigo-600">
                    <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white text-lg">
                        D
                    </div>
                    {/* <span className="hidden md:block">Dayflow</span> */}
                </div>

                <nav className="hidden md:flex items-center gap-1">
                    <NavLink to="/dashboard" className={({ isActive }) => clsx("px-3 py-1.5 rounded-md text-sm font-medium transition-colors", isActive ? "bg-indigo-50 text-indigo-700" : "text-slate-600 hover:text-indigo-600 hover:bg-slate-50")}>
                        Home
                    </NavLink>
                    {filteredNav.map(item => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            className={({ isActive }) => clsx("px-3 py-1.5 rounded-md text-sm font-medium transition-colors", isActive ? "bg-indigo-50 text-indigo-700" : "text-slate-600 hover:text-indigo-600 hover:bg-slate-50")}
                        >
                            {item.label}
                        </NavLink>
                    ))}
                </nav>
            </div>

            {/* Right: User & Tools */}
            <div className="flex items-center gap-4">

                {/* Attendance Status Dot */}
                <div className="relative" ref={attendanceRef}>
                    <button
                        onClick={() => setIsAttendanceOpen(!isAttendanceOpen)}
                        className={clsx("w-3 h-3 rounded-full transition-colors focus:ring-2 ring-offset-2", isCheckedIn ? "bg-green-500 ring-green-200" : "bg-red-500 ring-red-200")}
                        title="Attendance Status"
                    />

                    {isAttendanceOpen && (
                        <div className="absolute right-0 top-full mt-3 w-48 bg-white rounded-lg shadow-xl border border-slate-100 p-3 animate-in fade-in slide-in-from-top-2">
                            {isCheckedIn ? (
                                <div className="text-center">
                                    <p className="text-xs text-slate-500 mb-1">Checked In Since</p>
                                    <p className="text-xl font-mono font-bold text-slate-900 mb-3">{formatTime(elapsedTime)}</p>
                                    <button onClick={handleCheckOut} className="w-full py-2 bg-red-50 text-red-600 rounded-md text-sm font-medium hover:bg-red-100 transition-colors border border-red-100">
                                        Check Out -&gt;
                                    </button>
                                </div>
                            ) : (
                                <div className="text-center">
                                    <p className="text-xs text-slate-500 mb-3">You are currently checked out.</p>
                                    <button onClick={handleCheckIn} className="w-full py-2 bg-green-50 text-green-600 rounded-md text-sm font-medium hover:bg-green-100 transition-colors border border-green-100">
                                        Check In -&gt;
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Profile Dropdown */}
                <div className="relative" ref={profileRef}>
                    <button
                        onClick={() => setIsProfileOpen(!isProfileOpen)}
                        className="flex items-center gap-2 hover:bg-slate-50 p-1.5 rounded-full transition-colors"
                    >
                        <div className="w-8 h-8 rounded-full bg-slate-200 overflow-hidden border border-slate-300">
                            {/* Placeholder Avatar */}
                            <div className="w-full h-full flex items-center justify-center bg-indigo-100 text-indigo-700 font-bold text-xs">
                                {user?.name?.charAt(0)}
                            </div>
                        </div>
                    </button>

                    {isProfileOpen && (
                        <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-100 py-2 animate-in fade-in slide-in-from-top-2">
                            <div className="px-4 py-2 border-b border-slate-50">
                                <p className="text-sm font-semibold text-slate-900 truncate">{user?.name}</p>
                                <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                            </div>
                            <button
                                onClick={() => { navigate('/profile'); setIsProfileOpen(false); }}
                                className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                            >
                                <User className="w-4 h-4" /> My Profile
                            </button>
                            <button
                                onClick={logout}
                                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                            >
                                <LogOut className="w-4 h-4" /> Log Out
                            </button>
                        </div>
                    )}
                </div>

            </div>
        </header>
    );
};
