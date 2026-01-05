import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    LayoutDashboard,
    Users,
    Calendar,
    Clock,
    FileText,
    Settings,
    LogOut,
    UserCircle
} from 'lucide-react';
import clsx from 'clsx';

export const Sidebar = () => {
    const { user, logout } = useAuth();

    const navItems = [
        { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', roles: ['admin', 'employee'] },
        { to: '/employees', icon: Users, label: 'Employees', roles: ['admin'] },
        { to: '/attendance', icon: Clock, label: 'Attendance', roles: ['admin', 'employee'] },
        { to: '/leaves', icon: Calendar, label: 'Leave Requests', roles: ['admin', 'employee'] },
        { to: '/payroll', icon: FileText, label: 'Payroll', roles: ['admin', 'employee'] },
        { to: '/profile', icon: UserCircle, label: 'My Profile', roles: ['admin', 'employee'] },
    ];

    const filteredItems = navItems.filter(item => item.roles.includes(user?.role));

    return (
        <div className="h-screen w-64 bg-slate-900 text-white flex flex-col fixed left-0 top-0 z-10 transition-transform">
            <div className="p-6 border-b border-slate-800">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center">
                        <span className="font-bold text-xl">D</span>
                    </div>
                    <span className="font-bold text-lg tracking-tight">Dayflow</span>
                </div>
            </div>

            <nav className="flex-1 px-4 py-6 space-y-1">
                {filteredItems.map((item) => (
                    <NavLink
                        key={item.to}
                        to={item.to}
                        className={({ isActive }) => clsx(
                            "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                            isActive
                                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-900/20"
                                : "text-slate-400 hover:text-white hover:bg-slate-800"
                        )}
                    >
                        <item.icon className="w-5 h-5 opacity-90" />
                        {item.label}
                    </NavLink>
                ))}
            </nav>

            <div className="p-4 border-t border-slate-800">
                <div className="flex items-center gap-3 px-3 py-3 mb-2 rounded-lg bg-slate-800/50">
                    <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-sm font-bold text-slate-300">
                        {user?.name?.charAt(0) || 'U'}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{user?.name}</p>
                        <p className="text-xs text-slate-500 truncate capitalize">{user?.role}</p>
                    </div>
                </div>
                <button
                    onClick={logout}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors"
                >
                    <LogOut className="w-4 h-4" />
                    Sign out
                </button>
            </div>
        </div>
    );
};
