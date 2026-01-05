import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { Building2, Upload } from 'lucide-react';

export const Signup = () => {
    // Fields from the image: Company Name, Name, Email, Phone, Password, Confirm Password
    const [formData, setFormData] = useState({
        companyName: '',
        name: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: '',
    });
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [generatedId, setGeneratedId] = useState('');

    const { register } = useAuth(); // We might need to handle this manually since context register was simple
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        setIsLoading(true);

        try {
            await new Promise(resolve => setTimeout(resolve, 1000));

            const newUserLocal = {
                name: formData.name,
                email: formData.email,
                phone: formData.phone,
                password: formData.password,
                role: 'admin', // First user is Admin
                jobTitle: 'Administrator',
                department: 'Management',
            };

            // Register user with Firebase Auth and Firestore
            const createdUser = await register({
                ...newUserLocal,
                companyName: formData.companyName
            });

            setGeneratedId(createdUser.loginId || createdUser.id);
            setShowSuccess(true);
        } catch (err) {
            console.error(err);
            setError(err.message || 'Failed to create account');
        } finally {
            setIsLoading(false);
        }
    };

    if (showSuccess) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
                <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Building2 className="w-8 h-8 text-green-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">Registration Successful!</h2>
                    <p className="text-slate-600 mb-6">Your company has been registered.</p>

                    <div className="bg-indigo-50 p-4 rounded-lg mb-6 border border-indigo-100">
                        <p className="text-sm text-indigo-800 font-medium mb-1">Your Login ID</p>
                        <p className="text-2xl font-mono font-bold text-indigo-700 tracking-wider">{generatedId}</p>
                        <p className="text-xs text-indigo-600 mt-2">Please save this ID. You can login with this ID or your email.</p>
                    </div>

                    <Button onClick={() => navigate('/login')} className="w-full">
                        Proceed to Login
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
                <div className="flex flex-col items-center mb-6">
                    <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mb-4">
                        <Building2 className="w-6 h-6 text-indigo-600" />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900">Company Registration</h1>
                    <p className="text-slate-500 mt-1">Register your organization</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {error && (
                        <div className="p-3 text-sm text-red-600 bg-red-50 rounded-lg">
                            {error}
                        </div>
                    )}

                    <div className="flex items-center justify-center w-full mb-4">
                        <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-slate-300 border-dashed rounded-lg cursor-pointer bg-slate-50 hover:bg-slate-100">
                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                <Upload className="w-6 h-6 text-slate-400 mb-1" />
                                <p className="text-xs text-slate-500">Upload Company Logo</p>
                            </div>
                            <input type="file" className="hidden" />
                        </label>
                    </div>

                    <Input
                        label="Company Name"
                        name="companyName"
                        value={formData.companyName}
                        onChange={handleChange}
                        placeholder="Acme Corp"
                        required
                    />

                    <Input
                        label="Admin Name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="John Doe"
                        required
                    />

                    <Input
                        label="Email"
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="admin@company.com"
                        required
                    />

                    <Input
                        label="Phone"
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="+1 234 567 8900"
                    />

                    <Input
                        label="Password"
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="••••••••"
                        required
                    />

                    <Input
                        label="Confirm Password"
                        type="password"
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        placeholder="••••••••"
                        required
                    />

                    <Button
                        type="submit"
                        className="w-full mt-4"
                        disabled={isLoading}
                    >
                        {isLoading ? 'Registering...' : 'Sign Up'}
                    </Button>

                    <div className="text-center text-sm text-slate-500 mt-4">
                        Already have an account?{' '}
                        <Link to="/login" className="text-indigo-600 hover:text-indigo-700 font-medium">
                            Sign in
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    );
};
