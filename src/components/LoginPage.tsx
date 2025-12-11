import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { User, Building2, ArrowLeft, Mail, Lock } from 'lucide-react';
import { useAuth } from './AuthContext';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export const LoginPage: React.FC = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { signUp, signIn, user, isLoading } = useAuth();

    const [role, setRole] = useState<'buyer' | 'manufacturer'>('buyer');
    const [isSignUp, setIsSignUp] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [companyName, setCompanyName] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Get role from URL params
    useEffect(() => {
        const paramRole = searchParams.get('role');
        if (paramRole === 'manufacturer') {
            setRole('manufacturer');
        } else {
            setRole('buyer');
        }

        const mode = searchParams.get('mode');
        if (mode === 'signup') {
            setIsSignUp(true);
        }
    }, [searchParams]);

    // Already logged in - redirect
    useEffect(() => {
        if (user && !isLoading) {
            if (user.role === 'admin') {
                navigate('/admin');
            } else if (user.role === 'manufacturer') {
                if (user.approval_status === 'approved') {
                    navigate('/manufacturer-dashboard');
                } else {
                    navigate('/approval-pending');
                }
            } else {
                navigate('/buyer-dashboard');
            }
        }
    }, [user, isLoading, navigate]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            if (isSignUp) {
                await signUp(email, password, role, companyName);
                // Note: If user is auto-confirmed, they'll be signed in automatically
                // Otherwise, they'll need to verify email first
            } else {
                await signIn(email, password);
                // Navigation will happen automatically via useEffect when user state updates
            }
        } catch (error: any) {
            console.error('Auth error:', error);
            // Error toast is handled in AuthContext
            // Additional error handling can be added here if needed
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen w-full flex items-center justify-center bg-neutral-50">
                <div className="flex flex-col items-center gap-4">
                    <div className="h-6 w-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
            </div>
        );
    }

    return (
        <div 
            className="min-h-screen w-full flex items-center justify-center p-4 relative overflow-hidden"
            style={{ background: 'linear-gradient(135deg, #C1E1C1 0%, #A7C7E7 100%)' }}
        >
            {/* Minimalistic Card */}
            <div className="bg-white rounded-[2rem] shadow-xl p-6 md:p-12 w-full max-w-[480px] relative z-10">
                
                {/* Header */}
                <div className="text-center mb-6 md:mb-8">
                    <h1 className="text-xl md:text-2xl font-bold tracking-tight mb-2 text-slate-900">
                        {isSignUp ? 'Create an account' : 'Welcome back'}
                    </h1>
                    <p className="text-slate-500 text-sm">
                        {isSignUp
                            ? 'Already have an account? '
                            : 'New to Linker? '}
                        <button 
                            onClick={() => {
                                setIsSignUp(!isSignUp);
                                setEmail('');
                                setPassword('');
                                setCompanyName('');
                            }}
                            className="text-slate-900 font-semibold hover:underline transition-all"
                        >
                            {isSignUp ? 'Log in' : 'Sign up'}
                        </button>
                    </p>
                </div>

                {/* Role Switcher */}
                <div className="flex gap-3 md:gap-4 mb-6 md:mb-8 p-1">
                    <button
                        type="button"
                        onClick={() => setRole('buyer')}
                        className={cn(
                            "flex-1 flex items-center justify-center py-2.5 md:py-3 px-3 md:px-4 rounded-xl text-sm font-medium transition-all duration-200 border",
                            role === 'buyer'
                                ? "border-[#749F82] text-white shadow-md"
                                : "bg-white border-transparent text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                        )}
                        style={{ backgroundColor: role === 'buyer' ? '#749F82' : undefined }}
                    >
                        <User size={16} className="mr-2 md:mr-2" />
                        Buyer
                    </button>
                    <button
                        type="button"
                        onClick={() => setRole('manufacturer')}
                        className={cn(
                            "flex-1 flex items-center justify-center py-2.5 md:py-3 px-3 md:px-4 rounded-xl text-sm font-medium transition-all duration-200 border",
                            role === 'manufacturer'
                                ? "border-[#3B82F6] text-white shadow-md"
                                : "bg-white border-transparent text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                        )}
                        style={{ backgroundColor: role === 'manufacturer' ? '#3B82F6' : undefined }}
                    >
                        <Building2 size={16} className="mr-2 md:mr-2" />
                        Manufacturer
                    </button>
                </div>

                {/* Warning for Manufacturers */}
                {isSignUp && role === 'manufacturer' && (
                    <div className="mb-6 p-4 bg-warning-50 border border-warning-100 rounded-2xl text-sm text-warning-700 flex items-start gap-3">
                        <Building2 size={16} className="mt-0.5 shrink-0 text-warning-500" />
                        <div>
                            <p className="font-semibold text-warning-700">Approval Required</p>
                            <p className="opacity-80 mt-0.5">Manufacturer accounts require admin verification.</p>
                        </div>
                    </div>
                )}

                {/* Custom Form */}
                <form onSubmit={handleSubmit} className="w-full space-y-4">
                    {/* Email Field */}
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1.5 ml-1">
                            Email
                        </label>
                        <div className="relative">
                            <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 rounded-lg focus:border-slate-500 focus:ring-2 focus:ring-slate-500/20 transition-all h-11"
                                placeholder="you@example.com"
                            />
                        </div>
                    </div>

                    {/* Password Field */}
                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1.5 ml-1">
                            Password
                        </label>
                        <div className="relative">
                            <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                minLength={6}
                                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 rounded-lg focus:border-slate-500 focus:ring-2 focus:ring-slate-500/20 transition-all h-11"
                                placeholder="••••••••"
                            />
                        </div>
                    </div>

                    {/* Company Name (for signup) */}
                    {isSignUp && (
                        <div>
                            <label htmlFor="companyName" className="block text-sm font-medium text-slate-700 mb-1.5 ml-1">
                                Company Name {role === 'manufacturer' && '(Optional)'}
                            </label>
                            <input
                                id="companyName"
                                type="text"
                                value={companyName}
                                onChange={(e) => setCompanyName(e.target.value)}
                                required={role === 'buyer'}
                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 rounded-lg focus:border-slate-500 focus:ring-2 focus:ring-slate-500/20 transition-all h-11"
                                placeholder="Your Company"
                            />
                        </div>
                    )}

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full bg-slate-700 hover:bg-slate-800 text-white font-medium rounded-full h-12 shadow-lg shadow-slate-700/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSubmitting ? (
                            <span className="flex items-center justify-center gap-2">
                                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                {isSignUp ? 'Creating account...' : 'Signing in...'}
                            </span>
                        ) : (
                            isSignUp ? 'Create account' : 'Sign in'
                        )}
                    </button>
                </form>

                {/* Back to Home */}
                <div className="mt-6 md:mt-8 pt-6 border-t border-slate-100 text-center">
                    <button
                        onClick={() => navigate('/')}
                        className="text-xs font-medium text-slate-400 hover:text-slate-600 transition-colors inline-flex items-center gap-1.5"
                    >
                        <ArrowLeft size={12} />
                        Back to Home
                    </button>
                </div>
            </div>
        </div>
    );
};
