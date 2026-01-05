import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { Lock } from 'lucide-react';

export const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const { login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const { role } = useAuth(); // We need to exposing role or getting user from auth context synchronously might be tricky if user state isn't ready. 
    // Easier: Update user state in handleSubmit
    const from = location.state?.from?.pathname || '/dashboard';

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            // Simulate network delay
            await new Promise(resolve => setTimeout(resolve, 800));

            const success = await login(email, password);
            if (success) {
                navigate(from, { replace: true });
            } else {
                setError('Invalid email or password');
            }
        } catch (err) {
            console.error('Login error:', err);
            setError(err.message || 'An error occurred. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
                <div className="flex flex-col items-center mb-8">
                    <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mb-4">
                        <Lock className="w-6 h-6 text-indigo-600" />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900">Welcome back</h1>
                    <p className="text-slate-500 mt-2">Please sign in to your account</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {error && (
                        <div className="p-3 text-sm text-red-600 bg-red-50 rounded-lg">
                            {error}
                        </div>
                    )}

                    <Input
                        label="Login ID / Email"
                        type="text"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="ID or Email"
                        required
                    />

                    <Input
                        label="Password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                    />

                    <Button
                        type="submit"
                        className="w-full"
                        disabled={isLoading}
                    >
                        {isLoading ? 'Signing in...' : 'Sign in'}
                    </Button>

                    <div className="text-center text-sm text-slate-500">
                        Don't have an account?{' '}
                        <Link to="/signup" className="text-indigo-600 hover:text-indigo-700 font-medium">
                            Sign up
                        </Link>
                        <br />
                        (Demo: admin@dayflow.com / admin)
                    </div>
                </form>
            </div>
        </div>
    );
};
