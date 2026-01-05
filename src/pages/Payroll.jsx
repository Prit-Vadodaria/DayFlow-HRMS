import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { firestoreDB } from '../services/firestore';
import { Download, DollarSign, Calendar, Users, Search, Calculator } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const Payroll = () => {
    const { user } = useAuth();
    const isAdmin = user?.role === 'admin';
    const navigate = useNavigate();

    // Shared State
    const [searchTerm, setSearchTerm] = useState('');

    // --- SALARY HELPER (Duplicated logic for display urgency) ---
    // In a real app, this would be a shared utility or hook
    const calculateSalary = (wage = 0) => {
        const basic = wage * 0.50;
        const hra = basic * 0.50;
        const performanceBonus = basic * 0.0833;
        const lta = basic * 0.0833;
        const standard = 4167; // Fixed
        const pf = basic * 0.12;
        const profTax = 200;

        // Fixed Allowance calc
        let fixed = wage - (basic + hra + standard + performanceBonus + lta);
        if (fixed < 0) fixed = 0;

        const net = wage - pf - profTax;
        return { basic, hra, standard, performanceBonus, lta, fixed, pf, profTax, net };
    };

    // --- VIEWS ---

    const AdminView = () => {
        const [employees, setEmployees] = useState([]);

        useEffect(() => {
            const fetchEmployees = async () => {
                try {
                    const allUsers = await firestoreDB.getUsers();
                    // Filter users in my company
                    const myUsers = allUsers.filter(u => u.companyName === user.companyName);
                    setEmployees(myUsers);
                } catch (error) {
                    console.error('Error fetching employees for payroll:', error);
                }
            };
            fetchEmployees();
        }, []);

        const filteredEmployees = employees.filter(emp =>
            emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            emp.email.toLowerCase().includes(searchTerm.toLowerCase())
        );

        return (
            <div className="space-y-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Payroll Overview</h1>
                        <p className="text-slate-500">Manage salaries and ensure accuracy.</p>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-slate-200">
                    <div className="p-4 border-b border-slate-100 flex gap-4 bg-slate-50">
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search employees..."
                                className="w-full pl-9 pr-4 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-50 text-slate-500 font-medium">
                                <tr>
                                    <th className="px-6 py-3">Employee</th>
                                    <th className="px-6 py-3">Designation</th>
                                    <th className="px-6 py-3">Base Wage (Monthly)</th>
                                    <th className="px-6 py-3">Net Payable</th>
                                    <th className="px-6 py-3 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredEmployees.map(emp => {
                                    const salary = calculateSalary(emp.monthlyWage || 0);
                                    return (
                                        <tr key={emp.id} className="hover:bg-slate-50">
                                            <td className="px-6 py-4 font-medium text-slate-900">{emp.name}</td>
                                            <td className="px-6 py-4 text-slate-600">{emp.jobTitle || '-'}</td>
                                            <td className="px-6 py-4 font-mono text-slate-700">₹ {(emp.monthlyWage || 0).toLocaleString()}</td>
                                            <td className="px-6 py-4 font-mono font-bold text-green-700">₹ {salary.net.toLocaleString()}</td>
                                            <td className="px-6 py-4 text-right">
                                                <button
                                                    onClick={() => navigate(`/profile/${emp.loginId || emp.id}`)}
                                                    className="text-indigo-600 hover:text-indigo-800 font-medium text-xs border border-indigo-200 px-3 py-1 rounded bg-indigo-50"
                                                >
                                                    View Details
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                                {filteredEmployees.length === 0 && (
                                    <tr><td colSpan="5" className="px-6 py-8 text-center text-slate-500">No employees found.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        );
    };

    const EmployeeView = () => {
        const salary = calculateSalary(user.monthlyWage || 0);

        // Mock Payslips
        const payslips = [
            { month: 'June 2025', days: 30, net: salary.net, status: 'Released' },
            { month: 'May 2025', days: 31, net: salary.net, status: 'Released' },
            { month: 'April 2025', days: 30, net: salary.net, status: 'Released' },
        ];

        return (
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">My Payroll</h1>
                    <p className="text-slate-500">View your compensation details and history.</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Structure Card */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="p-4 border-b border-slate-100 bg-slate-50">
                            <h2 className="font-bold text-slate-900 flex items-center gap-2">
                                <DollarSign className="w-5 h-5 text-indigo-600" />
                                Salary Structure
                            </h2>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-500">Basic Salary</span>
                                <span className="font-mono">{salary.basic.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-500">HRA</span>
                                <span className="font-mono">{salary.hra.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-500">Allowances</span>
                                <span className="font-mono">{(salary.standard + salary.performanceBonus + salary.lta + salary.fixed).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-sm text-red-600">
                                <span>Deductions (PF/Tax)</span>
                                <span className="font-mono">- {(salary.pf + salary.profTax).toFixed(2)}</span>
                            </div>
                            <div className="pt-4 border-t border-slate-100 flex justify-between font-bold text-lg">
                                <span className="text-slate-900">Net Salary</span>
                                <span className="text-green-700">₹ {salary.net.toLocaleString()}</span>
                            </div>
                        </div>
                    </div>

                    {/* History */}
                    <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="p-4 border-b border-slate-100 bg-slate-50">
                            <h2 className="font-bold text-slate-900 flex items-center gap-2">
                                <Calendar className="w-5 h-5 text-indigo-600" />
                                Payslip History
                            </h2>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-slate-50 text-slate-500">
                                    <tr>
                                        <th className="px-6 py-3">Period</th>
                                        <th className="px-6 py-3">Working Days</th>
                                        <th className="px-6 py-3">Net Pay</th>
                                        <th className="px-6 py-3">Status</th>
                                        <th className="px-6 py-3 text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {payslips.map((slip, i) => (
                                        <tr key={i} className="hover:bg-slate-50">
                                            <td className="px-6 py-4 font-medium text-slate-900">{slip.month}</td>
                                            <td className="px-6 py-4 text-slate-600">{slip.days}</td>
                                            <td className="px-6 py-4 text-slate-600 font-mono">₹ {slip.net.toLocaleString()}</td>
                                            <td className="px-6 py-4">
                                                <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                                                    {slip.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button className="text-indigo-600 hover:text-indigo-800 flex items-center gap-1 ml-auto">
                                                    <Download className="w-4 h-4" />
                                                    PDF
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return isAdmin ? <AdminView /> : <EmployeeView />;
};
