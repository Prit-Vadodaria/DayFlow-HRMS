import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { firestoreDB } from '../services/firestore';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { User, Mail, Phone, MapPin, Briefcase, Calendar, Upload, FileText, Shield, DollarSign } from 'lucide-react';
import { clsx } from 'clsx';

export const Profile = () => {
    const { user: currentUser } = useAuth();
    const { id } = useParams();
    const navigate = useNavigate();

    // Determine which user profile to show
    // If ID is present, we look up that user. If not, we show current user.
    const [profileUser, setProfileUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('resume');
    const [isEditing, setIsEditing] = useState(false);

    // Form State
    const [formData, setFormData] = useState({});

    // Salary Calculation State
    const [salaryConfig, setSalaryConfig] = useState({
        monthlyWage: 0,
        basicPercent: 50,
        hraPercent: 50, // of Basic
        standardAllowance: 4167,
        pfRate: 12,
        profTax: 200,
    });

    const isAdmin = currentUser?.role === 'admin';
    const isOwnProfile = !id || id === currentUser?.id;
    // Admin can edit anyone, Users can only edit themselves (limited)
    const canEdit = isAdmin || isOwnProfile;

    useEffect(() => {
        const fetchProfile = async () => {
            setLoading(true);
            try {
                let foundUser = currentUser;

                if (id) {
                    const users = await firestoreDB.getUsers();
                    foundUser = users.find(u => u.loginId === id || u.id === id);
                }

                if (foundUser) {
                    setProfileUser(foundUser);
                    // Initialize form data with existing user data or defaults
                    setFormData({
                        ...foundUser,
                        // Resume Defaults
                        about: foundUser.about || '',
                        skills: foundUser.skills || [],
                        // Private Info Defaults
                        dob: foundUser.dob || '',
                        nationality: foundUser.nationality || '',
                        address: foundUser.address || '',
                        bankName: foundUser.bankName || '',
                        accountNumber: foundUser.accountNumber || '',
                        ifsc: foundUser.ifsc || '',
                        pan: foundUser.pan || '',
                        // Salary Defaults (Meta fields if saved previously)
                        monthlyWage: foundUser.monthlyWage || 50000,
                    });
                    // Init Salary Config if saved
                    if (foundUser.monthlyWage) {
                        setSalaryConfig(prev => ({ ...prev, monthlyWage: foundUser.monthlyWage }));
                    }
                }
            } catch (error) {
                console.error('Error fetching profile:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, [id, currentUser]);

    // --- SALARY CALCULATIONS ---
    const calculateSalary = (wage) => {
        const basic = wage * (salaryConfig.basicPercent / 100);
        const hra = basic * (salaryConfig.hraPercent / 100); // 50% of Basic
        const performanceBonus = basic * 0.0833;
        const lta = basic * 0.0833;
        const standard = salaryConfig.standardAllowance;

        // Fixed Allowance is the balancing figure
        // Wage = Basic + HRA + Standard + Bonus + LTA + Fixed
        // Fixed = Wage - (Sum of others)
        let fixed = wage - (basic + hra + standard + performanceBonus + lta);
        if (fixed < 0) fixed = 0; // Integrity check

        const pf = basic * (salaryConfig.pfRate / 100);

        return {
            basic,
            hra,
            standard,
            performanceBonus,
            lta,
            fixed,
            pf,
            gross: wage,
            net: wage - pf - salaryConfig.profTax // Simplified Net
        };
    };

    const salaryComponents = calculateSalary(formData.monthlyWage || 50000);

    const handleSave = async () => {
        try {
            const updatedUser = {
                ...profileUser,
                ...formData,
                salaryDetails: salaryComponents // Persist the calculated details potentially
            };
            await firestoreDB.updateUser(updatedUser.id, updatedUser);
            setProfileUser(updatedUser);
            setIsEditing(false);
        } catch (error) {
            console.error('Error updating profile:', error);
        }
    };

    const handleInputChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    if (loading || !profileUser) return <div className="p-8">Loading...</div>;

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden min-h-[80vh]">
            {/* --- Header Section --- */}
            <div className="p-8 border-b border-slate-200">
                <div className="flex flex-col md:flex-row gap-8 items-start">
                    {/* Avatar */}
                    <div className="relative group">
                        <div className="w-32 h-32 rounded-full bg-indigo-100 flex items-center justify-center text-4xl font-bold text-indigo-600 border-4 border-white shadow-lg">
                            {profileUser.name?.charAt(0)}
                        </div>
                        {isEditing && (
                            <button className="absolute bottom-0 right-0 bg-white p-2 rounded-full shadow-md border border-slate-200 hover:bg-slate-50">
                                <Upload className="w-4 h-4 text-slate-600" />
                            </button>
                        )}
                    </div>

                    {/* Basic Info Inputs */}
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                        <div className="space-y-4">
                            {isEditing ? (
                                <Input label="Full Name" value={formData.name} onChange={e => handleInputChange('name', e.target.value)} disabled={!isAdmin} />
                            ) : (
                                <div><h1 className="text-3xl font-bold text-slate-900">{profileUser.name}</h1></div>
                            )}

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs text-slate-500 uppercase font-semibold">Job Position</label>
                                    <p className="font-medium">{profileUser.jobTitle || '-'}</p>
                                </div>
                                <div>
                                    <label className="text-xs text-slate-500 uppercase font-semibold">Department</label>
                                    <p className="font-medium">{profileUser.department || '-'}</p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4 bg-slate-50 p-4 rounded-lg border border-slate-100 text-sm">
                            <div className="flex justify-between">
                                <span className="text-slate-500">Email:</span>
                                <span className="font-medium">{profileUser.email}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-slate-500">Phone:</span>
                                {isEditing ? (
                                    <input className="border rounded px-2 py-1 w-40" value={formData.phone} onChange={e => handleInputChange('phone', e.target.value)} />
                                ) : (
                                    <span className="font-medium">{profileUser.phone || '-'}</span>
                                )}
                            </div>
                            <div className="flex justify-between bg-white px-2 py-1 rounded border border-indigo-100">
                                <span className="text-indigo-600">Login ID:</span>
                                <span className="font-mono font-bold text-indigo-800">{profileUser.loginId || profileUser.id}</span>
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col gap-2">
                        {!isEditing && canEdit && (
                            <Button onClick={() => setIsEditing(true)}>Edit Profile</Button>
                        )}
                        {isEditing && (
                            <>
                                <Button onClick={handleSave}>Save</Button>
                                <Button variant="ghost" onClick={() => setIsEditing(false)}>Cancel</Button>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* --- Tabs --- */}
            <div className="flex border-b border-slate-200 px-8">
                {['resume', 'private_info', ...(isAdmin ? ['salary_info'] : [])].map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={clsx(
                            "px-6 py-4 text-sm font-medium border-b-2 transition-colors capitalize",
                            activeTab === tab
                                ? "border-indigo-600 text-indigo-600"
                                : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
                        )}
                    >
                        {tab.replace('_', ' ')}
                    </button>
                ))}
            </div>

            {/* --- Tab Content --- */}
            <div className="p-8 bg-slate-50/50 min-h-[500px]">

                {/* RESUME TAB */}
                {activeTab === 'resume' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2 space-y-6">
                            <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
                                <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                                    <FileText className="w-4 h-4" /> About
                                </h3>
                                {isEditing ? (
                                    <textarea
                                        className="w-full h-32 border rounded-md p-2 text-sm"
                                        value={formData.about}
                                        onChange={e => handleInputChange('about', e.target.value)}
                                        placeholder="Brief bio..."
                                    />
                                ) : (
                                    <p className="text-slate-600 text-sm leading-relaxed">{profileUser.about || "No bio added yet."}</p>
                                )}
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
                                <h3 className="font-semibold text-slate-900 mb-4">Skills</h3>
                                <div className="flex flex-wrap gap-2">
                                    {(formData.skills || []).map(skill => (
                                        <span key={skill} className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-medium border border-indigo-100">
                                            {skill}
                                        </span>
                                    ))}
                                    {(!formData.skills || formData.skills.length === 0) && <span className="text-slate-400 text-xs italic">No skills listed</span>}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* PRIVATE INFO TAB */}
                {activeTab === 'private_info' && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
                            <h3 className="font-semibold text-slate-900 mb-6 flex items-center gap-2">
                                <User className="w-4 h-4" /> Personal Details
                            </h3>
                            <div className="space-y-4">
                                <Input label="Address" value={formData.address} onChange={e => handleInputChange('address', e.target.value)} disabled={!isEditing} />
                                <div className="grid grid-cols-2 gap-4">
                                    <Input label="Nationality" value={formData.nationality} onChange={e => handleInputChange('nationality', e.target.value)} disabled={!isEditing} />
                                    <Input label="Date of Birth" type="date" value={formData.dob} onChange={e => handleInputChange('dob', e.target.value)} disabled={!isEditing} />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <Input label="Gender" value={formData.gender} onChange={e => handleInputChange('gender', e.target.value)} disabled={!isEditing} />
                                    <Input label="Marital Status" value={formData.maritalStatus} onChange={e => handleInputChange('maritalStatus', e.target.value)} disabled={!isEditing} />
                                </div>
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
                            <h3 className="font-semibold text-slate-900 mb-6 flex items-center gap-2">
                                <Shield className="w-4 h-4" /> Bank & Statutory Details
                            </h3>
                            <div className="space-y-4">
                                <Input label="Bank Account Number" value={formData.accountNumber} onChange={e => handleInputChange('accountNumber', e.target.value)} disabled={!isAdmin} />
                                <Input label="Bank Name" value={formData.bankName} onChange={e => handleInputChange('bankName', e.target.value)} disabled={!isAdmin} />
                                <div className="grid grid-cols-2 gap-4">
                                    <Input label="IFSC Code" value={formData.ifsc} onChange={e => handleInputChange('ifsc', e.target.value)} disabled={!isAdmin} />
                                    <Input label="PAN No" value={formData.pan} onChange={e => handleInputChange('pan', e.target.value)} disabled={!isAdmin} />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* SALARY INFO TAB (ADMIN ONLY) */}
                {activeTab === 'salary_info' && isAdmin && (
                    <div className="space-y-6">
                        <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                                    <DollarSign className="w-4 h-4" /> Salary Structure Configuration
                                </h3>
                                {isEditing && (
                                    <div className="bg-yellow-50 text-yellow-800 px-3 py-1 rounded text-xs border border-yellow-200">
                                        Editing Mode: Changes will auto-recalculate components
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-8 mb-8">
                                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Monthly Wage</label>
                                    <input
                                        type="number"
                                        className="w-full text-2xl font-bold bg-white border border-slate-300 rounded px-3 py-2 text-indigo-700"
                                        value={formData.monthlyWage}
                                        onChange={e => handleInputChange('monthlyWage', Number(e.target.value))}
                                        disabled={!isEditing}
                                    />
                                    <p className="text-xs text-slate-500 mt-1">Base for all calculations</p>
                                </div>
                                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Yearly Wage (Projected)</label>
                                    <div className="text-2xl font-bold text-slate-800">
                                        {(formData.monthlyWage * 12).toLocaleString()}
                                    </div>
                                    <p className="text-xs text-slate-500 mt-1">Annual CTC</p>
                                </div>
                            </div>

                            <div className="relative overflow-hidden rounded-lg border border-slate-200">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-slate-50 text-slate-500 font-medium">
                                        <tr>
                                            <th className="px-6 py-3">Salary Component</th>
                                            <th className="px-6 py-3 text-right">Calculation Logic</th>
                                            <th className="px-6 py-3 text-right">Monthly Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        <tr>
                                            <td className="px-6 py-3 font-medium text-slate-900">Basic Salary</td>
                                            <td className="px-6 py-3 text-right text-slate-500">50% of Wage</td>
                                            <td className="px-6 py-3 text-right font-mono">{salaryComponents.basic.toFixed(2)}</td>
                                        </tr>
                                        <tr>
                                            <td className="px-6 py-3 font-medium text-slate-900">House Rent Allowance (HRA)</td>
                                            <td className="px-6 py-3 text-right text-slate-500">50% of Basic</td>
                                            <td className="px-6 py-3 text-right font-mono">{salaryComponents.hra.toFixed(2)}</td>
                                        </tr>
                                        <tr>
                                            <td className="px-6 py-3 font-medium text-slate-900">Standard Allowance</td>
                                            <td className="px-6 py-3 text-right text-slate-500">Fixed</td>
                                            <td className="px-6 py-3 text-right font-mono">{salaryComponents.standard.toFixed(2)}</td>
                                        </tr>
                                        <tr>
                                            <td className="px-6 py-3 font-medium text-slate-900">Performance Bonus</td>
                                            <td className="px-6 py-3 text-right text-slate-500">8.33% of Basic</td>
                                            <td className="px-6 py-3 text-right font-mono">{salaryComponents.performanceBonus.toFixed(2)}</td>
                                        </tr>
                                        <tr>
                                            <td className="px-6 py-3 font-medium text-slate-900">Leave Travel Allowance</td>
                                            <td className="px-6 py-3 text-right text-slate-500">8.33% of Basic</td>
                                            <td className="px-6 py-3 text-right font-mono">{salaryComponents.lta.toFixed(2)}</td>
                                        </tr>
                                        <tr className="bg-indigo-50/30">
                                            <td className="px-6 py-3 font-medium text-indigo-900">Fixed Allowance</td>
                                            <td className="px-6 py-3 text-right text-indigo-700">Wage - Sum(Others)</td>
                                            <td className="px-6 py-3 text-right font-mono font-bold text-indigo-700">{salaryComponents.fixed.toFixed(2)}</td>
                                        </tr>
                                        <tr className="bg-slate-100 font-bold border-t-2 border-slate-200">
                                            <td className="px-6 py-4">Total Gross Salary</td>
                                            <td className="px-6 py-4 text-right"></td>
                                            <td className="px-6 py-4 text-right">{salaryComponents.gross.toFixed(2)}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>

                            <div className="mt-8 grid grid-cols-2 gap-8">
                                <div>
                                    <h4 className="font-semibold text-slate-900 mb-3 border-b pb-2">Deductions & Contributions</h4>
                                    <div className="flex justify-between text-sm py-2 border-b border-slate-100">
                                        <span>Provident Fund (Employee)</span>
                                        <span className="font-mono">{salaryComponents.pf.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm py-2 border-b border-slate-100">
                                        <span>Professional Tax</span>
                                        <span className="font-mono">{salaryConfig.profTax.toFixed(2)}</span>
                                    </div>
                                </div>
                                <div>
                                    <h4 className="font-semibold text-slate-900 mb-3 border-b pb-2">Net Pay</h4>
                                    <div className="bg-green-50 p-4 rounded-lg border border-green-100 flex justify-between items-center">
                                        <span className="text-green-800 font-medium">Net Take Home (Monthly)</span>
                                        <span className="text-2xl font-bold text-green-700">₹ {salaryComponents.net.toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
};
