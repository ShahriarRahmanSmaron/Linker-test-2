import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, ArrowRight, ShieldCheck, Mail } from 'lucide-react';
import { useAuth } from '../AuthContext';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// Floating Label Input Component for Admin (Dark Theme)
interface FloatingInputProps {
    id: string;
    type: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    label: string;
    required?: boolean;
    icon?: React.ReactNode;
}

const FloatingInput: React.FC<FloatingInputProps> = ({
    id,
    type,
    value,
    onChange,
    label,
    required = false,
    icon
}) => {
    const [isFocused, setIsFocused] = useState(false);
    const isActive = isFocused || value.length > 0;

    return (
        <div className="relative group">
            {/* Icon */}
            {icon && (
                <div className={cn(
                    "absolute left-4 top-1/2 -translate-y-1/2 transition-all duration-300 z-10",
                    isActive ? "text-red-400" : "text-neutral-500"
                )}>
                    {icon}
                </div>
            )}
            
            {/* Input */}
            <input
                id={id}
                type={type}
                value={value}
                onChange={onChange}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                required={required}
                className={cn(
                    "peer w-full bg-neutral-900/50 border text-white rounded-xl transition-all duration-300 h-16",
                    "focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500",
                    "placeholder-transparent",
                    icon ? "pl-11 pr-4 pt-6 pb-2" : "px-4 pt-6 pb-2",
                    isActive ? "border-red-500/50" : "border-neutral-700"
                )}
                placeholder={label}
            />
            
            {/* Floating Label */}
            <label
                htmlFor={id}
                className={cn(
                    "absolute transition-all duration-300 ease-out pointer-events-none",
                    "origin-left",
                    icon ? "left-11" : "left-4",
                    isActive
                        ? "top-2.5 text-[11px] font-bold uppercase tracking-wider text-red-400"
                        : "top-1/2 -translate-y-1/2 text-sm text-neutral-500"
                )}
            >
                {label}
            </label>
            
            {/* Glow effect on focus */}
            <div className={cn(
                "absolute inset-0 rounded-xl transition-all duration-300 pointer-events-none",
                isFocused ? "shadow-[0_0_20px_rgba(239,68,68,0.15)]" : ""
            )} />
        </div>
    );
};

export const AdminLoginPage: React.FC = () => {
    const navigate = useNavigate();
    const { loginAdmin } = useAuth();
    const [isLoading, setIsLoading] = useState(false);

    // Form State
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            const user = await loginAdmin(email, password);
            if (user) {
                if (user.role === 'admin') {
                    navigate('/admin');
                } else {
                    setError('Access denied. Admin credentials required.');
                    toast.error('This account does not have admin privileges.');
                }
            }
        } catch (err: any) {
            setError(err.message || 'Login failed. Please check your credentials.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full relative flex items-center justify-center overflow-hidden bg-neutral-900 font-sans">

            {/* Dark Background with Red Accents */}
            <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none">
                <div
                    className="absolute -top-32 -left-32 w-96 h-96 bg-red-900/20 rounded-full mix-blend-screen filter blur-3xl opacity-50 animate-blob"
                ></div>
                <div
                    className="absolute -bottom-40 -right-20 w-96 h-96 bg-red-800/20 rounded-full mix-blend-screen filter blur-3xl opacity-50 animate-blob"
                    style={{ animationDelay: '4000ms' }}
                ></div>
            </div>

            {/* Login Card */}
            <div className="relative z-10 w-full max-w-md px-6">
                <div className="bg-neutral-800/50 backdrop-blur-xl border border-white/10 shadow-2xl rounded-3xl overflow-hidden p-8 md:p-10">

                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center bg-red-500/10 p-3 rounded-xl mb-4 shadow-sm ring-1 ring-red-500/20">
                            <ShieldCheck className="h-8 w-8 text-red-500" />
                        </div>
                        <h1 className="text-2xl font-bold text-white tracking-tight mb-2">
                            Admin Portal
                        </h1>
                        <p className="text-neutral-400 text-sm">
                            Restricted access. Authorized personnel only.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Email Field with Floating Label */}
                        <FloatingInput
                            id="admin-email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            label="Admin Email"
                            required
                            icon={<Mail size={18} />}
                        />

                        {/* Password Field with Floating Label */}
                        <FloatingInput
                            id="admin-password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            label="Password"
                            required
                            icon={<Lock size={18} />}
                        />

                        {error && (
                            <div className="text-red-400 text-sm text-center font-medium bg-red-500/10 py-2 rounded-lg border border-red-500/20">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-4 rounded-xl font-bold text-white shadow-lg transition-all duration-200 transform active:scale-[0.98] flex items-center justify-center relative overflow-hidden bg-red-600 hover:bg-red-700 shadow-red-500/30"
                        >
                            {isLoading ? (
                                <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                                <>
                                    Access Dashboard <ArrowRight size={18} className="ml-2" />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-8 text-center">
                        <button onClick={() => navigate('/')} className="text-xs font-bold text-neutral-500 hover:text-neutral-300 transition-colors uppercase tracking-wider">
                            Return to Main Site
                        </button>
                    </div>

                </div>
            </div>
        </div>
    );
};

