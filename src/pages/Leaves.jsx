import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { firestoreDB } from '../services/firestore';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Plus, CheckCircle, XCircle, Clock, Search, Upload, Calendar } from 'lucide-react';
import { clsx } from 'clsx';

export const Leaves = () => {
    const { user } = useAuth();
    const isAdmin = user?.role === 'admin';

    // State
    const [leaves, setLeaves] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [filterStatus, setFilterStatus] = useState('All');

    // Form State
    const [newLeave, setNewLeave] = useState({
        type: 'Paid Time Off',
        startDate: '',
        endDate: '',
        reason: '',
    });

    // Load Data
    useEffect(() => {
        loadLeaves();
    }, [user, showModal]); // Reload when modal closes (submission) or user changes

    const loadLeaves = async () => {
        try {
            const allLeaves = await firestoreDB.getLeaves();
            if (isAdmin) {
                setLeaves(allLeaves.sort((a, b) => {
                    const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.appliedOn || 0);
                    const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.appliedOn || 0);
                    return dateB - dateA;
                }));
            } else {
                setLeaves(allLeaves.filter(l => l.userId === user.id).sort((a, b) => {
                    const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.appliedOn || 0);
                    const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.appliedOn || 0);
                    return dateB - dateA;
                }));
            }
        } catch (error) {
            console.error('Error loading leaves:', error);
        }
    };

    // Actions
    const handleStatusUpdate = async (leaveId, newStatus) => {
        try {
            await firestoreDB.updateLeave(leaveId, { status: newStatus });
            await loadLeaves();
        } catch (error) {
            console.error('Error updating leave status:', error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            // Simple duration calc
            const start = new Date(newLeave.startDate);
            const end = new Date(newLeave.endDate);
            const diffTime = Math.abs(end - start);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

            const submission = {
                userId: user.id,
                userName: user.name, // Denormalize name for easier admin view
                type: newLeave.type,
                startDate: newLeave.startDate,
                endDate: newLeave.endDate,
                days: diffDays,
                reason: newLeave.reason,
                status: 'Pending',
                appliedOn: new Date().toISOString(),
            };

            await firestoreDB.addLeave(submission);
            setShowModal(false);
            setNewLeave({ type: 'Paid Time Off', startDate: '', endDate: '', reason: '' });
            await loadLeaves();
        } catch (error) {
            console.error('Error submitting leave:', error);
        }
    };

    // Stats Calculation (Mock for demo)
    const paidLeavesUsed = leaves.filter(l => l.userId === user.id && l.type === 'Paid Time Off' && l.status === 'Approved')
        .reduce((acc, curr) => acc + (curr.days || 1), 0);
    const sickLeavesUsed = leaves.filter(l => l.userId === user.id && l.type === 'Sick Leave' && l.status === 'Approved')
        .reduce((acc, curr) => acc + (curr.days || 1), 0);

    const paidQuota = 24 - paidLeavesUsed;
    const sickQuota = 7 - sickLeavesUsed;

    return (
        <div className="space-y-6">
            {/* Header / Tabs */}
            <div className="border-b border-slate-200">
                <div className="flex gap-8">
                    <button className="px-4 py-2 border-b-2 border-indigo-600 text-indigo-700 font-medium text-sm">Time Off</button>
                    {!isAdmin && <button className="px-4 py-2 hover:bg-slate-50 text-slate-500 font-medium text-sm">Allocation</button>}
                </div>
            </div>

            {/* Controls Row */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-2 rounded-lg border border-slate-200">
                <div className="flex items-center gap-4 w-full md:w-auto">
                    {!isAdmin && (
                        <Button onClick={() => setShowModal(true)}>
                            New Request
                        </Button>
                    )}
                    {isAdmin && <span className="text-sm font-semibold text-slate-700 px-2">Manage Requests</span>}
                </div>

                {/* Search / Filter */}
                <div className="relative w-full md:w-64">
                    <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search..."
                        className="w-full pl-9 pr-4 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                </div>
            </div>

            {/* Quota Stats (Employee Only) */}
            {!isAdmin && (
                <div className="grid grid-cols-2 gap-px bg-slate-200 border border-slate-200 rounded-lg overflow-hidden">
                    <div className="bg-white p-4">
                        <p className="text-sm font-medium text-indigo-600 mb-1">Paid Time Off</p>
                        <p className="text-2xl font-bold text-slate-900">{paidQuota} <span className="text-sm font-normal text-slate-500">Days Available</span></p>
                    </div>
                    <div className="bg-white p-4">
                        <p className="text-sm font-medium text-blue-600 mb-1">Sick Time Off</p>
                        <p className="text-2xl font-bold text-slate-900">{sickQuota} <span className="text-sm font-normal text-slate-500">Days Available</span></p>
                    </div>
                </div>
            )}

            {/* Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
                        <tr>
                            <th className="px-6 py-3">Employee</th>
                            <th className="px-6 py-3">Start Date</th>
                            <th className="px-6 py-3">End Date</th>
                            <th className="px-6 py-3">Type</th>
                            <th className="px-6 py-3">Days</th>
                            <th className="px-6 py-3">Status</th>
                            {isAdmin && <th className="px-6 py-3 text-right">Actions</th>}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {leaves.map((leave) => (
                            <tr key={leave.id} className="hover:bg-slate-50 group">
                                <td className="px-6 py-4 font-medium text-slate-900">{leave.userName}</td>
                                <td className="px-6 py-4 text-slate-600">{leave.startDate}</td>
                                <td className="px-6 py-4 text-slate-600">{leave.endDate}</td>
                                <td className="px-6 py-4">
                                    <span className={clsx(
                                        "truncate",
                                        leave.type.includes('Paid') ? "text-indigo-600" :
                                            leave.type.includes('Sick') ? "text-blue-600" : "text-slate-600"
                                    )}>{leave.type}</span>
                                </td>
                                <td className="px-6 py-4 text-slate-600 font-mono">{leave.days}</td>
                                <td className="px-6 py-4">
                                    <StatusBadge status={leave.status} />
                                </td>
                                {isAdmin && (
                                    <td className="px-6 py-4 text-right">
                                        {leave.status === 'Pending' && (
                                            <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => handleStatusUpdate(leave.id, 'Approved')}
                                                    className="p-1 bg-green-100 text-green-700 rounded hover:bg-green-200" title="Approve">
                                                    <CheckCircle className="w-5 h-5" />
                                                </button>
                                                <button
                                                    onClick={() => handleStatusUpdate(leave.id, 'Rejected')}
                                                    className="p-1 bg-red-100 text-red-700 rounded hover:bg-red-200" title="Reject">
                                                    <XCircle className="w-5 h-5" />
                                                </button>
                                            </div>
                                        )}
                                    </td>
                                )}
                            </tr>
                        ))}
                        {leaves.length === 0 && (
                            <tr><td colSpan={isAdmin ? 7 : 6} className="text-center py-8 text-slate-500">No requests found.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* MODAL */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 animate-in zoom-in-95">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-lg font-bold">Time Off Request</h2>
                            <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600"><XCircle className="w-6 h-6" /></button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-slate-500 uppercase">Employee</label>
                                    <div className="p-2 bg-slate-100 rounded text-slate-700 text-sm font-medium">{user.name}</div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-slate-500 uppercase">Time Off Type</label>
                                    <select
                                        className="w-full p-2 border border-slate-300 rounded text-sm focus:ring-1 focus:ring-indigo-500"
                                        value={newLeave.type}
                                        onChange={e => setNewLeave({ ...newLeave, type: e.target.value })}
                                    >
                                        <option>Paid Time Off</option>
                                        <option>Sick Leave</option>
                                        <option>Unpaid Leave</option>
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-slate-500 uppercase">Validity Period</label>
                                <div className="grid grid-cols-2 gap-4">
                                    <input
                                        type="date"
                                        className="w-full p-2 border border-slate-300 rounded text-sm"
                                        value={newLeave.startDate}
                                        onChange={e => setNewLeave({ ...newLeave, startDate: e.target.value })}
                                        required
                                    />
                                    <input
                                        type="date"
                                        className="w-full p-2 border border-slate-300 rounded text-sm"
                                        value={newLeave.endDate}
                                        onChange={e => setNewLeave({ ...newLeave, endDate: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>

                            {/* Auto-calc days display */}
                            {newLeave.startDate && newLeave.endDate && (
                                <div className="flex items-center justify-between bg-indigo-50 p-2 rounded border border-indigo-100">
                                    <span className="text-xs font-semibold text-indigo-700 uppercase">Allocation Request</span>
                                    <span className="text-sm font-bold text-indigo-900">
                                        {Math.max(0, Math.ceil((new Date(newLeave.endDate) - new Date(newLeave.startDate)) / (1000 * 60 * 60 * 24)) + 1)} Days
                                    </span>
                                </div>
                            )}

                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-slate-500 uppercase">Attachment (Optional)</label>
                                <div className="border-2 border-dashed border-slate-300 rounded-lg p-4 flex flex-col items-center justify-center text-slate-500 hover:bg-slate-50 cursor-pointer">
                                    <Upload className="w-5 h-5 mb-1" />
                                    <span className="text-xs">Click to upload certificate</span>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 mt-6">
                                <Button type="button" variant="ghost" onClick={() => setShowModal(false)}>Discard</Button>
                                <Button type="submit">Submit</Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

const StatusBadge = ({ status }) => {
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
};
