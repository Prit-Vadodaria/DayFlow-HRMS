import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { firestoreDB } from '../services/firestore';
import { useNavigate } from 'react-router-dom';
import {
    User, Calendar, FileText, LogOut, Search,
    CheckCircle, XCircle, Clock, ChevronRight, Users,
    BarChart3, ArrowLeft
} from 'lucide-react';
import { clsx } from 'clsx';

export const Dashboard = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const isAdmin = user?.role === 'admin';

    // ----------------------------------------------------------------------
    // ADMIN DASHBOARD
    // ----------------------------------------------------------------------
    if (isAdmin) {
        return <AdminDashboard onLogout={logout} user={user} />;
    }

    // ----------------------------------------------------------------------
    // EMPLOYEE DASHBOARD (Original View)
    // ----------------------------------------------------------------------
    const cards = [
        { label: 'My Profile', icon: User, action: () => navigate('/profile'), color: 'bg-indigo-100 text-indigo-600' },
        { label: 'Attendance', icon: Calendar, action: () => navigate('/attendance'), color: 'bg-green-100 text-green-600' },
        { label: 'Leave Requests', icon: FileText, action: () => navigate('/leaves'), color: 'bg-yellow-100 text-yellow-600' },
        { label: 'Log Out', icon: LogOut, action: logout, color: 'bg-red-100 text-red-600' },
    ];

    return (
        <div className="max-w-4xl mx-auto">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-slate-900">Welcome, {user?.name}</h1>
                <p className="text-slate-500">What would you like to do today?</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {cards.map((card) => (
                    <div
                        key={card.label}
                        onClick={card.action}
                        className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all cursor-pointer flex items-center gap-4 group"
                    >
                        <div className={`w-16 h-16 rounded-full flex items-center justify-center text-xl ${card.color} group-hover:scale-110 transition-transform`}>
                            <card.icon className="w-8 h-8" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-slate-900">{card.label}</h3>
                            <p className="text-sm text-slate-500">Click to view</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

// =================================================================================
// ADMIN DASHBOARD COMPONENT
// =================================================================================
const AdminDashboard = ({ onLogout, user }) => {
    const [employees, setEmployees] = useState([]);
    const [attendance, setAttendance] = useState([]);
    const [leaves, setLeaves] = useState([]);
    const [selectedEmpId, setSelectedEmpId] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    // Load Data
    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const allUsers = await firestoreDB.getUsers();
            const filteredUsers = allUsers.filter(u => u.companyName === user?.companyName);
            setEmployees(filteredUsers);

            const attendanceData = await firestoreDB.getAttendance();
            setAttendance(attendanceData);

            const leavesData = await firestoreDB.getLeaves();
            setLeaves(leavesData.sort((a, b) => {
                const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.appliedOn || 0);
                const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.appliedOn || 0);
                return dateB - dateA;
            }));
        } catch (error) {
            console.error('Error loading data:', error);
        }
    };

    // Derived States
    const filteredEmployees = employees.filter(e =>
        e.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.jobTitle?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const selectedEmployee = employees.find(e => e.id === selectedEmpId);

    // Employee Specific Data
    const empAttendance = attendance
        .filter(r => r.userId === selectedEmpId)
        .sort((a, b) => new Date(b.date) - new Date(a.date));

    const empLeaves = leaves
        .filter(l => l.userId === selectedEmpId)
        .sort((a, b) => new Date(b.appliedOn) - new Date(a.appliedOn));

    // Dashboard Stats (Global)
    const totalEmployees = employees.length;
    const todayStr = new Date().toISOString().split('T')[0];
    const presentToday = attendance.filter(r => r.date === todayStr && (r.status === 'Present' || r.status === 'Late')).length;
    const pendingLeaves = leaves.filter(l => l.status === 'Pending').length;

    // Actions
    const handleLeaveAction = async (leaveId, status) => {
        try {
            await firestoreDB.updateLeave(leaveId, { status });
            await loadData(); // Reload to refresh UI
        } catch (error) {
            console.error('Error updating leave:', error);
            alert('Failed to update leave request');
        }
    };

    return (
        <div className="flex h-[calc(100vh-100px)] -m-8">
            {/* LEFT SIDEBAR: Employee List */}
            <div className="w-80 bg-white border-r border-slate-200 flex flex-col h-full">
                <div className="p-4 border-b border-slate-100">
                    <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <Users className="w-5 h-5 text-indigo-600" /> Employees
                    </h2>
                    <div className="relative">
                        <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search..."
                            className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto">
                    {filteredEmployees.map(emp => (
                        <div
                            key={emp.id}
                            onClick={() => setSelectedEmpId(emp.id)}
                            className={clsx(
                                "p-4 border-b border-slate-50 cursor-pointer transition-colors hover:bg-slate-50 flex items-center gap-3",
                                selectedEmpId === emp.id ? "bg-indigo-50 hover:bg-indigo-50 border-l-4 border-l-indigo-600" : "border-l-4 border-l-transparent"
                            )}
                        >
                            <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-bold shrink-0">
                                {emp.name.charAt(0)}
                            </div>
                            <div className="overflow-hidden">
                                <h3 className={clsx("font-medium truncate", selectedEmpId === emp.id ? "text-indigo-900" : "text-slate-900")}>
                                    {emp.name}
                                </h3>
                                <p className="text-xs text-slate-500 truncate">{emp.jobTitle || 'Employee'}</p>
                            </div>
                            {selectedEmpId === emp.id && <ChevronRight className="w-4 h-4 text-indigo-400 ml-auto" />}
                        </div>
                    ))}
                    {filteredEmployees.length === 0 && (
                        <div className="p-8 text-center text-slate-400 text-sm">No employees found</div>
                    )}
                </div>
            </div>

            {/* MAIN CONTENT AREA */}
            <div className="flex-1 bg-slate-50 p-8 overflow-y-auto h-full">

                {/* Header (Depends on Selection) */}
                <div className="mb-8">
                    {selectedEmpId ? (
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => setSelectedEmpId(null)}
                                className="p-2 hover:bg-white rounded-full transition-colors text-slate-500"
                            >
                                <ArrowLeft className="w-5 h-5" />
                            </button>
                            <div>
                                <h1 className="text-2xl font-bold text-slate-900">{selectedEmployee?.name}</h1>
                                <p className="text-slate-500">{selectedEmployee?.jobTitle} • {selectedEmployee?.department}</p>
                            </div>
                        </div>
                    ) : (
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900">Dashboard Overview</h1>
                            <p className="text-slate-500">Summary of HR activities</p>
                        </div>
                    )}
                </div>

                {/* Content */}
                {selectedEmpId ? (
                    // ---------------- EMPLOYEE SPECIFIC VIEW ----------------
                    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                        {/* Attendance Section */}
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200">
                            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                                <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                                    <Clock className="w-4 h-4 text-slate-500" /> Attendance History
                                </h3>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-slate-50 text-slate-500 font-medium">
                                        <tr>
                                            <th className="px-6 py-3">Date</th>
                                            <th className="px-6 py-3">In</th>
                                            <th className="px-6 py-3">Out</th>
                                            <th className="px-6 py-3">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {empAttendance.map(r => (
                                            <tr key={r.id}>
                                                <td className="px-6 py-3">{new Date(r.date).toLocaleDateString()}</td>
                                                <td className="px-6 py-3 font-mono">{r.checkIn}</td>
                                                <td className="px-6 py-3 font-mono">{r.checkOut || '-'}</td>
                                                <td className="px-6 py-3"><StatusBadge status={r.status} /></td>
                                            </tr>
                                        ))}
                                        {empAttendance.length === 0 && (
                                            <tr><td colSpan="4" className="px-6 py-8 text-center text-slate-400">No attendance records found.</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Leaves Section */}
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200">
                            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                                <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                                    <FileText className="w-4 h-4 text-slate-500" /> Leave Requests
                                </h3>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-slate-50 text-slate-500 font-medium">
                                        <tr>
                                            <th className="px-6 py-3">Type</th>
                                            <th className="px-6 py-3">Dates</th>
                                            <th className="px-6 py-3">Days</th>
                                            <th className="px-6 py-3">Status</th>
                                            <th className="px-6 py-3 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {empLeaves.map(l => (
                                            <tr key={l.id}>
                                                <td className="px-6 py-3 font-medium">{l.type}</td>
                                                <td className="px-6 py-3 text-slate-500">
                                                    {l.startDate} <span className="text-xs">to</span> {l.endDate}
                                                </td>
                                                <td className="px-6 py-3 text-slate-500">{l.days}</td>
                                                <td className="px-6 py-3"><LeaveStatusBadge status={l.status} /></td>
                                                <td className="px-6 py-3 text-right">
                                                    {l.status === 'Pending' && (
                                                        <div className="flex justify-end gap-2">
                                                            <button
                                                                onClick={() => handleLeaveAction(l.id, 'Approved')}
                                                                className="text-green-600 hover:bg-green-50 p-1 rounded" title="Approve">
                                                                <CheckCircle className="w-5 h-5" />
                                                            </button>
                                                            <button
                                                                onClick={() => handleLeaveAction(l.id, 'Rejected')}
                                                                className="text-red-600 hover:bg-red-50 p-1 rounded" title="Reject">
                                                                <XCircle className="w-5 h-5" />
                                                            </button>
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                        {empLeaves.length === 0 && (
                                            <tr><td colSpan="5" className="px-6 py-8 text-center text-slate-400">No leave requests found.</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                ) : (
                    // ---------------- GLOBAL OVERVIEW ----------------
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {/* Summary Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <StatCard title="Total Employees" value={totalEmployees} icon={Users} color="bg-blue-50 text-blue-600" />
                            <StatCard title="Present Today" value={presentToday} icon={CheckCircle} color="bg-green-50 text-green-600" />
                            <StatCard title="Pending Leaves" value={pendingLeaves} icon={Clock} color="bg-orange-50 text-orange-600" />
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {/* Pending Approvals */}
                            <div className="bg-white rounded-xl shadow-sm border border-slate-200 lg:col-span-2">
                                <div className="p-4 border-b border-slate-100 flex justify-between items-center">
                                    <h3 className="font-bold text-slate-800">Pending Leave Approvals</h3>
                                    <button onClick={() => navigate('/leaves')} className="text-xs text-indigo-600 font-medium hover:underline">View All</button>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-slate-50 text-slate-500 font-medium">
                                            <tr>
                                                <th className="px-6 py-3">Employee</th>
                                                <th className="px-6 py-3">Type</th>
                                                <th className="px-6 py-3">Days</th>
                                                <th className="px-6 py-3 text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {leaves.filter(l => l.status === 'Pending').slice(0, 5).map(l => (
                                                <tr key={l.id} className="hover:bg-slate-50">
                                                    <td className="px-6 py-3 font-medium text-indigo-900">{l.userName}</td>
                                                    <td className="px-6 py-3">{l.type}</td>
                                                    <td className="px-6 py-3 font-mono">{l.days}</td>
                                                    <td className="px-6 py-3 text-right">
                                                        <div className="flex justify-end gap-2">
                                                            <button onClick={() => handleLeaveAction(l.id, 'Approved')} className="p-1 hover:bg-green-50 text-green-600 rounded">
                                                                <CheckCircle className="w-4 h-4" />
                                                            </button>
                                                            <button onClick={() => handleLeaveAction(l.id, 'Rejected')} className="p-1 hover:bg-red-50 text-red-600 rounded">
                                                                <XCircle className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                            {leaves.filter(l => l.status === 'Pending').length === 0 && (
                                                <tr><td colSpan="4" className="px-6 py-6 text-center text-slate-400">All caught up! No pending requests.</td></tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Recent Attendance (Simplified) */}
                            <div className="bg-white rounded-xl shadow-sm border border-slate-200 lg:col-span-2">
                                <div className="p-4 border-b border-slate-100 flex justify-between items-center">
                                    <h3 className="font-bold text-slate-800">Today's Attendance</h3>
                                    <button onClick={() => navigate('/attendance')} className="text-xs text-indigo-600 font-medium hover:underline">View Full Report</button>
                                </div>
                                <div className="p-4 flex flex-wrap gap-4">
                                    {/* Just show avatars of present status */}
                                    {employees.slice(0, 10).map(emp => {
                                        const status = attendance.find(r => r.userId === emp.id && r.date === todayStr)?.status || 'Absent';
                                        return (
                                            <div key={emp.id} className="flex flex-col items-center gap-1 w-16 text-center" title={status}>
                                                <div className={clsx(
                                                    "w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm border-2",
                                                    status === 'Present' ? "bg-green-100 text-green-700 border-green-200" :
                                                        status === 'Late' ? "bg-yellow-100 text-yellow-700 border-yellow-200" :
                                                            "bg-slate-100 text-slate-400 border-transparent grayscale opacity-50"
                                                )}>
                                                    {emp.name.charAt(0)}
                                                </div>
                                                <span className="text-[10px] text-slate-500 truncate w-full">{emp.name.split(' ')[0]}</span>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

// --- Helpers ---
const StatCard = ({ title, value, icon: Icon, color }) => (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${color}`}>
            <Icon className="w-6 h-6" />
        </div>
        <div>
            <p className="text-slate-500 text-sm font-medium">{title}</p>
            <h3 className="text-2xl font-bold text-slate-900">{value}</h3>
        </div>
    </div>
);

const StatusBadge = ({ status }) => (
    <span className={clsx("px-2 py-0.5 rounded text-xs font-medium",
        status === 'Present' ? "bg-green-100 text-green-700" :
            status === 'Late' ? "bg-yellow-100 text-yellow-700" :
                "bg-red-100 text-red-700"
    )}>
        {status}
    </span>
);

const LeaveStatusBadge = ({ status }) => {
    const isApproved = status === 'Approved';
    const isRejected = status === 'Rejected';
    return (
        <span className={clsx(
            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border",
            isApproved ? "bg-green-100 text-green-700 border-green-200" :
                isRejected ? "bg-red-100 text-red-700 border-red-200" :
                    "bg-orange-100 text-orange-700 border-orange-200"
        )}>
            {status}
        </span>
    );
}

