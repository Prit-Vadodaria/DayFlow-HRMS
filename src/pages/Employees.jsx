import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { firestoreDB } from '../services/firestore';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Mail, Phone, MapPin, User, Search, Plus, Building2, Plane } from 'lucide-react';
import { clsx } from 'clsx';

export const Employees = () => {
    const { user, adminCreateUser } = useAuth();
    const navigate = useNavigate();
    const [employees, setEmployees] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);
    const [todayAttendance, setTodayAttendance] = useState([]);
    // New Employee Form State
    const [newEmp, setNewEmp] = useState({
        name: '',
        email: '',
        phone: '',
        jobTitle: '',
        department: '',
    });
    const [generatedCreds, setGeneratedCreds] = useState(null);

    useEffect(() => {
        loadData();
    }, [user]);

    const loadData = async () => {
        try {
            const allUsers = await firestoreDB.getUsers();
            // Filter users belonging to the same company
            const myCompanyUsers = allUsers.filter(u => u.companyName === user?.companyName);
            setEmployees(myCompanyUsers);

            // Load today's attendance for status indicators
            const today = new Date().toISOString().split('T')[0];
            const allAttendance = await firestoreDB.getAttendance();
            const todaysRecords = allAttendance.filter(r => r.date === today);
            setTodayAttendance(todaysRecords);
        } catch (error) {
            console.error('Error loading data:', error);
        }
    };

    const handleCreateEmployee = async (e) => {
        e.preventDefault();

        try {
            // Generate temporary password
            const tempPassword = Math.random().toString(36).slice(-8);

            const newUser = {
                ...newEmp,
                companyName: user.companyName,
                password: tempPassword,
                role: 'employee',
                joinedDate: new Date().toISOString().split('T')[0],
            };

            // Use the adminCreateUser function to avoid session switching
            const created = await adminCreateUser(newUser);

            setGeneratedCreds({
                id: created.loginId || created.id,
                password: tempPassword
            });

            await loadData();
            setNewEmp({ name: '', email: '', phone: '', jobTitle: '', department: '' });
        } catch (error) {
            console.error('Error creating employee:', error);
            alert('Failed to create employee: ' + error.message);
        }
    };

    const closeAndReset = () => {
        setShowAddModal(false);
        setGeneratedCreds(null);
    };

    const filteredEmployees = employees.filter(emp =>
        emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.role.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getStatusColor = (empId) => {
        const record = todayAttendance.find(r => r.userId === empId);
        const status = record?.status || 'Absent';

        // Colors mapping according to requirement
        switch (status) {
            case 'Present': return 'bg-green-500 border-green-200';
            case 'Absent': return 'bg-red-500 border-red-200'; // Default
            case 'Half-day': return 'bg-orange-500 border-orange-200';
            case 'Leave': return 'bg-blue-500 border-blue-200';
            case 'Late': return 'bg-yellow-500 border-yellow-200';
            default: return 'bg-red-500 border-red-200';
        }
    };

    const getStatusTitle = (empId) => {
        const record = todayAttendance.find(r => r.userId === empId);
        return record?.status || 'Absent';
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Employees</h1>
                    <p className="text-slate-500">Manage your team members at <span className="font-semibold text-indigo-900">{user?.companyName}</span>.</p>
                </div>
                {user?.role === 'admin' && (
                    <Button onClick={() => setShowAddModal(true)}>
                        <Plus className="w-5 h-5 mr-2" />
                        Add Employee
                    </Button>
                )}
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200">
                <div className="p-4 border-b border-slate-100 bg-slate-50 flex gap-4">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search employees..."
                            className="w-full pl-9 pr-4 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 p-6">
                    {filteredEmployees.map((emp) => (
                        <div
                            key={emp.id}
                            className="bg-white rounded-lg border border-slate-200 p-4 hover:shadow-lg transition-all cursor-pointer relative group"
                            onClick={() => navigate(`/profile/${emp.loginId || emp.id}`)}
                        >
                            {/* Status Indicator */}
                            <div className="absolute top-4 right-4 z-10" title={getStatusTitle(emp.id)}>
                                {getStatusTitle(emp.id) === 'Leave' ? (
                                    <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 border border-blue-200">
                                        <Plane className="w-3 h-3" />
                                    </div>
                                ) : (
                                    <div className={clsx(
                                        "w-3 h-3 rounded-full border-2 shadow-sm transition-colors",
                                        getStatusColor(emp.id)
                                    )}></div>
                                )}
                            </div>

                            <div className="flex flex-col items-center text-center mt-2">
                                <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-bold text-2xl mb-3 shadow-inner">
                                    {emp.name.charAt(0)}
                                </div>
                                <h3 className="font-semibold text-slate-900 truncate w-full">{emp.name}</h3>
                                <p className="text-xs text-slate-500 uppercase tracking-wide mb-3">{emp.jobTitle || 'Employee'}</p>

                                <div className="w-full border-t border-slate-100 pt-3 flex justify-around text-slate-400">
                                    <Mail className="w-4 h-4 hover:text-indigo-600 transition-colors" />
                                    <Phone className="w-4 h-4 hover:text-indigo-600 transition-colors" />
                                    <MapPin className="w-4 h-4 hover:text-indigo-600 transition-colors" />
                                </div>
                            </div>
                        </div>
                    ))}

                    {filteredEmployees.length === 0 && (
                        <div className="col-span-full py-12 text-center text-slate-500">
                            No employees found.
                        </div>
                    )}
                </div>
            </div>

            {/* Add Employee Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 animate-in zoom-in-95">
                        {!generatedCreds ? (
                            <>
                                <h2 className="text-xl font-bold mb-4">Add New Employee</h2>
                                <form onSubmit={handleCreateEmployee} className="space-y-4">
                                    <Input
                                        label="Full Name"
                                        value={newEmp.name}
                                        onChange={e => setNewEmp({ ...newEmp, name: e.target.value })}
                                        required
                                    />
                                    <Input
                                        label="Email"
                                        type="email"
                                        value={newEmp.email}
                                        onChange={e => setNewEmp({ ...newEmp, email: e.target.value })}
                                        required
                                    />
                                    <div className="grid grid-cols-2 gap-4">
                                        <Input
                                            label="Job Title"
                                            value={newEmp.jobTitle}
                                            onChange={e => setNewEmp({ ...newEmp, jobTitle: e.target.value })}
                                        />
                                        <Input
                                            label="Department"
                                            value={newEmp.department}
                                            onChange={e => setNewEmp({ ...newEmp, department: e.target.value })}
                                        />
                                    </div>

                                    <div className="flex justify-end gap-3 pt-4">
                                        <Button type="button" variant="ghost" onClick={closeAndReset}>Cancel</Button>
                                        <Button type="submit">Create User</Button>
                                    </div>
                                </form>
                            </>
                        ) : (
                            <div className="text-center py-4">
                                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <User className="w-8 h-8 text-green-600" />
                                </div>
                                <h2 className="text-2xl font-bold text-slate-900 mb-2">User Created!</h2>
                                <p className="text-slate-600 mb-6">Please share these credentials with the employee.</p>

                                <div className="bg-slate-50 p-6 rounded-lg border border-slate-200 text-left space-y-4 mb-6">
                                    <div>
                                        <p className="text-xs text-slate-500 uppercase font-semibold">Login ID</p>
                                        <p className="text-xl font-mono font-bold text-slate-900">{generatedCreds.id}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500 uppercase font-semibold">Temporary Password</p>
                                        <p className="text-xl font-mono font-bold text-slate-900">{generatedCreds.password}</p>
                                    </div>
                                </div>

                                <Button onClick={closeAndReset} className="w-full">
                                    Done
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            )}

        </div>
    );
};
