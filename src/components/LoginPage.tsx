import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { SignIn, SignUp, useAuth as useClerkAuth } from '@clerk/clerk-react';
import { User, Building2, ArrowLeft } from 'lucide-react';
import { useAuth } from './AuthContext';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export const LoginPage: React.FC = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { syncClerkUser, user, isLoading } = useAuth();
    const { isSignedIn, isLoaded: clerkLoaded } = useClerkAuth();

    const [role, setRole] = useState<'buyer' | 'manufacturer'>('buyer');
    const [isSignUp, setIsSignUp] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);

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

    // After Clerk sign-in, sync with backend
    useEffect(() => {
        const handleClerkSignIn = async () => {
            if (clerkLoaded && isSignedIn && !user && !isSyncing) {
                setIsSyncing(true);
                try {
                    const syncedUser = await syncClerkUser(role, '');
                    if (syncedUser) {
                        toast.success("Welcome back!");
                        // Navigate based on role and approval status
                        if (syncedUser.role === 'manufacturer') {
                            if (syncedUser.approval_status === 'approved') {
                                navigate('/manufacturer-dashboard');
                            } else {
                                navigate('/approval-pending');
                            }
                        } else if (syncedUser.role === 'buyer' || syncedUser.role === 'general_user') {
                            navigate('/buyer-dashboard');
                        }
                    }
                } catch (error) {
                    console.error('Sync failed:', error);
                    toast.error("Failed to sync account.");
                } finally {
                    setIsSyncing(false);
                }
            }
        };

        handleClerkSignIn();
    }, [clerkLoaded, isSignedIn, user, syncClerkUser, role, navigate]);

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

    if (isLoading || !clerkLoaded || isSyncing) {
        return (
            <div className="min-h-screen w-full flex items-center justify-center bg-neutral-50">
                <div className="flex flex-col items-center gap-4">
                    <div className="h-6 w-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
            </div>
        );
    }

    // Custom Light Theme for Clerk
    const clerkAppearance = {
        layout: {
            socialButtonsPlacement: 'top',
            socialButtonsVariant: 'iconButton',
            showOptionalFields: false,
        },
        variables: {
            borderRadius: '0.5rem',
            colorPrimary: '#334155', // Slate 700 - Matching the sage/blue theme
            colorBackground: '#ffffff',
            colorInputBackground: '#F8FAFC', // Slate 50
            colorInputText: '#0F172A', // Slate 900
            colorText: '#0F172A', // Slate 900
            colorTextSecondary: '#64748B', // Slate 500
            fontFamily: 'inherit',
        },
        elements: {
            // Main Card
            card: "shadow-none bg-transparent w-full",
            rootBox: "w-full",
            headerTitle: "hidden", // Hide default Clerk header to use our custom one
            headerSubtitle: "hidden",

            // Social Buttons
            socialButtonsIconButton: "bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-full h-12 w-full mx-1",
            socialButtonsProviderIcon: "opacity-90",

            // Inputs
            formFieldLabel: "text-slate-700 text-sm font-medium ml-1 mb-1.5",
            formFieldInput: "bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 rounded-lg focus:border-slate-500 focus:ring-slate-500/20 transition-all h-11",

            // Primary Button
            formButtonPrimary: "bg-slate-700 hover:bg-slate-800 text-white normal-case font-medium rounded-full h-12 shadow-lg shadow-slate-700/20",

            // Footer
            footerActionLink: "text-slate-700 hover:text-slate-900 font-medium",
            footer: "hidden", // Hide default footer to make it cleaner

            // Dividers
            dividerLine: "bg-slate-200",
            dividerText: "text-slate-400 uppercase text-xs tracking-wider",
        }
    };

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
                            onClick={() => setIsSignUp(!isSignUp)} 
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

                {/* Clerk Component */}
                <div className="w-full">
                    {isSignUp ? (
                        <SignUp 
                            appearance={clerkAppearance as any}
                            redirectUrl={role === 'manufacturer' ? '/approval-pending' : '/buyer-dashboard'}
                            signInUrl={`/login?mode=login&role=${role}`}
                        />
                    ) : (
                        <SignIn 
                            appearance={clerkAppearance as any}
                            redirectUrl={role === 'manufacturer' ? '/manufacturer-dashboard' : '/buyer-dashboard'}
                            signUpUrl={`/login?mode=signup&role=${role}`}
                        />
                    )}
                </div>

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
