import React from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from './Header';

export const Layout = () => {
    return (
        <div className="min-h-screen bg-white">
            <Header />
            <main className="pt-14 px-4 pb-8 max-w-7xl mx-auto">
                <div className="py-6">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};
