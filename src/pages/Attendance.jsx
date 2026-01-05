import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { firestoreDB } from '../services/firestore';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, Filter, Download } from 'lucide-react';
import { clsx } from 'clsx';

export const Attendance = () => {
    const { user } = useAuth();
    const isAdmin = user?.role === 'admin';

    // Shared State
    const [attendanceData, setAttendanceData] = useState([]);
    const [viewMode, setViewMode] = useState('daily'); // 'daily' | 'weekly'
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

    useEffect(() => {
        loadAttendance();
    }, [user, selectedDate, viewMode]);

    const loadAttendance = async () => {
        try {
            const allData = await firestoreDB.getAttendance();
            setAttendanceData(allData);
        } catch (error) {
            console.error('Error loading attendance:', error);
        }
    };

    const handleDateChange = (days) => {
        const date = new Date(selectedDate);
        date.setDate(date.getDate() + days);
        setSelectedDate(date.toISOString().split('T')[0]);
    };

    // --- Sub-Components ---

    // ADMIN VIEW: See everyone
    const AdminView = () => {
        const [employees, setEmployees] = useState([]);

        useEffect(() => {
            const fetchEmployees = async () => {
                try {
                    const allUsers = await firestoreDB.getUsers();
                    setEmployees(allUsers.filter(u => u.companyName === user.companyName));
                } catch (error) {
                    console.error('Error fetching employees:', error);
                }
            };
            fetchEmployees();
        }, []);

        // --- Weekly Logic ---
        const getWeekDays = (baseDateStr) => {
            const date = new Date(baseDateStr);
            const day = date.getDay(); // 0 (Sun) to 6 (Sat)
            const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Adjust to get Monday

            const monday = new Date(date.setDate(diff));
            const week = [];
            for (let i = 0; i < 7; i++) {
                const d = new Date(monday);
                d.setDate(monday.getDate() + i);
                week.push(d.toISOString().split('T')[0]);
            }
            return week;
        };

        const weekDays = getWeekDays(selectedDate);

        // Merge employees with their attendance
        const getDailyRecords = () => employees.map(emp => {
            const record = attendanceData.find(r => r.userId === emp.id && r.date === selectedDate);
            // Default "Absent" if date is in past/today and no record? 
            // For now, simple lookup.
            return {
                ...emp,
                checkIn: record?.checkIn || '-',
                checkOut: record?.checkOut || '-',
                workingHours: record?.workingHours || '-',
                status: record?.status || 'Absent'
            };
        });

        const dailyRecords = getDailyRecords();

        return (
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <h1 className="text-2xl font-bold text-slate-900">Attendance Overview</h1>

                    <div className="flex items-center gap-4">
                        {/* View Toggle */}
                        <div className="bg-slate-100 p-1 rounded-lg flex text-sm font-medium">
                            <button
                                onClick={() => setViewMode('daily')}
                                className={clsx("px-3 py-1.5 rounded-md transition-all", viewMode === 'daily' ? "bg-white shadow-sm text-slate-900" : "text-slate-500 hover:text-slate-700")}
                            >
                                Daily
                            </button>
                            <button
                                onClick={() => setViewMode('weekly')}
                                className={clsx("px-3 py-1.5 rounded-md transition-all", viewMode === 'weekly' ? "bg-white shadow-sm text-slate-900" : "text-slate-500 hover:text-slate-700")}
                            >
                                Weekly
                            </button>
                        </div>

                        {/* Date Navigation */}
                        <div className="flex items-center bg-white border border-slate-200 rounded-lg p-1 shadow-sm">
                            <button onClick={() => handleDateChange(viewMode === 'weekly' ? -7 : -1)} className="p-2 hover:bg-slate-100 rounded-md text-slate-600">
                                <ChevronLeft className="w-5 h-5" />
                            </button>
                            <div className="px-4 py-1 flex items-center gap-2 font-medium text-slate-700 min-w-[160px] justify-center">
                                <CalendarIcon className="w-4 h-4 text-slate-400" />
                                {viewMode === 'daily'
                                    ? new Date(selectedDate).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })
                                    : `Week of ${new Date(weekDays[0]).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}`
                                }
                            </div>
                            <button onClick={() => handleDateChange(viewMode === 'weekly' ? 7 : 1)} className="p-2 hover:bg-slate-100 rounded-md text-slate-600">
                                <ChevronRight className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    {viewMode === 'daily' ? (
                        /* DAILY TABLE */
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
                                <tr>
                                    <th className="px-6 py-4">Employee</th>
                                    <th className="px-6 py-4">Check In</th>
                                    <th className="px-6 py-4">Check Out</th>
                                    <th className="px-6 py-4">Work Hours</th>
                                    <th className="px-6 py-4">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {dailyRecords.map(record => (
                                    <tr key={record.id} className="hover:bg-slate-50">
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-slate-900">{record.name}</div>
                                            <div className="text-xs text-slate-500">{record.jobTitle}</div>
                                        </td>
                                        <td className="px-6 py-4 font-mono text-slate-600">{record.checkIn}</td>
                                        <td className="px-6 py-4 font-mono text-slate-600">{record.checkOut}</td>
                                        <td className="px-6 py-4 font-mono text-slate-700">{record.workingHours}</td>
                                        <td className="px-6 py-4">
                                            <StatusBadge status={record.status} />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        /* WEEKLY TABLE */
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left border-collapse">
                                <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
                                    <tr>
                                        <th className="px-4 py-4 w-48 border-r border-slate-200 sticky left-0 bg-slate-50 z-10">Employee</th>
                                        {weekDays.map(day => (
                                            <th key={day} className="px-2 py-4 text-center min-w-[80px] border-r border-slate-100 last:border-0">
                                                <div className="text-xs uppercase">{new Date(day).toLocaleDateString('en-US', { weekday: 'short' })}</div>
                                                <div className="text-slate-900 font-bold">{new Date(day).getDate()}</div>
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {employees.map(emp => (
                                        <tr key={emp.id} className="hover:bg-slate-50">
                                            <td className="px-4 py-3 border-r border-slate-200 font-medium text-slate-900 sticky left-0 bg-white group-hover:bg-slate-50 z-10">
                                                {emp.name}
                                            </td>
                                            {weekDays.map(day => {
                                                const record = attendanceData.find(r => r.userId === emp.id && r.date === day);
                                                const status = record?.status || 'Absent';
                                                return (
                                                    <td key={day} className="px-2 py-3 text-center border-r border-slate-100 last:border-0">
                                                        <div className="flex justify-center">
                                                            <MiniStatusBadge status={status} />
                                                        </div>
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    // EMPLOYEE VIEW
    const EmployeeView = () => {
        // Filter my records
        const myRecords = attendanceData
            .filter(r => r.userId === user.id)
            .sort((a, b) => new Date(b.date) - new Date(a.date));

        const presentCount = myRecords.filter(r => r.status === 'Present').length;
        const leaveCount = myRecords.filter(r => r.status === 'Leave').length; // Or merge from Leaves DB

        return (
            <div className="space-y-8">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <h1 className="text-2xl font-bold text-slate-900">My Attendance</h1>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <StatCard label="Days Present" value={presentCount} subtext="This Year" color="bg-green-50 text-green-700" />
                    <StatCard label="Leaves Taken" value={leaveCount} subtext="Approved" color="bg-blue-50 text-blue-700" />
                    <StatCard label="Late Arrivals" value={myRecords.filter(r => r.status === 'Late').length} subtext="Needs Improvement" color="bg-orange-50 text-orange-700" />
                </div>

                {/* Table */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-4">Date</th>
                                <th className="px-6 py-4">Check In</th>
                                <th className="px-6 py-4">Check Out</th>
                                <th className="px-6 py-4">Work Hours</th>
                                <th className="px-6 py-4">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {myRecords.map(record => (
                                <tr key={record.id} className="hover:bg-slate-50">
                                    <td className="px-6 py-4 font-medium text-slate-900">
                                        {new Date(record.date).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                                    </td>
                                    <td className="px-6 py-4 font-mono text-slate-600">{record.checkIn}</td>
                                    <td className="px-6 py-4 font-mono text-slate-600">{record.checkOut || '-'}</td>
                                    <td className="px-6 py-4 font-mono text-slate-700">{record.workingHours || '-'}</td>
                                    <td className="px-6 py-4">
                                        <StatusBadge status={record.status} />
                                    </td>
                                </tr>
                            ))}
                            {myRecords.length === 0 && (
                                <tr>
                                    <td colSpan="5" className="px-6 py-8 text-center text-slate-500">
                                        No attendance history found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    };

    return isAdmin ? <AdminView /> : <EmployeeView />;
};

// Helper Components
const StatCard = ({ label, value, subtext, color }) => (
    <div className={`p-4 rounded-xl border border-slate-100 ${color}`}>
        <p className="text-sm font-medium opacity-80 mb-1">{label}</p>
        <p className="text-2xl font-bold mb-1">{value}</p>
        <p className="text-xs opacity-60">{subtext}</p>
    </div>
);

// Full Badge
const StatusBadge = ({ status }) => {
    const styles = {
        'Present': 'bg-green-100 text-green-700',
        'Absent': 'bg-red-100 text-red-700',
        'Half-day': 'bg-orange-100 text-orange-700',
        'Leave': 'bg-blue-100 text-blue-700',
        'Late': 'bg-yellow-100 text-yellow-700', // Optional extra
    };

    const finalStatus = status || 'Absent';

    return (
        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${styles[finalStatus] || 'bg-slate-100 text-slate-600'}`}>
            {finalStatus}
        </span>
    );
};

// Mini Dot for Weekly View
const MiniStatusBadge = ({ status }) => {
    const styles = {
        'Present': 'bg-green-500',
        'Absent': 'bg-red-500',
        'Half-day': 'bg-orange-500',
        'Leave': 'bg-blue-500',
    };

    // map uncommon statuses
    let colorClass = styles[status] || styles['Absent'];
    if (status === 'Late') colorClass = 'bg-yellow-500';

    return (
        <div className={`w-2.5 h-2.5 rounded-full ${colorClass}`} title={status}></div>
    );
};
