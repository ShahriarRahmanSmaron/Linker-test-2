import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, Mail, Building2, ArrowLeft, LogOut } from 'lucide-react';
import { useAuth } from './AuthContext';

export const ApprovalPending: React.FC = () => {
    const navigate = useNavigate();
    const { user, logout } = useAuth();

    return (
        <div className="min-h-screen w-full relative flex items-center justify-center overflow-hidden bg-neutral-50 font-sans">
            {/* Animated Background */}
            <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none">
                <div
                    className="absolute -top-32 -left-32 w-96 h-96 bg-amber-200 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob"
                ></div>
                <div
                    className="absolute -top-32 -right-32 w-96 h-96 bg-orange-200 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob"
                    style={{ animationDelay: '2000ms' }}
                ></div>
                <div
                    className="absolute -bottom-40 left-20 w-96 h-96 bg-yellow-200 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob"
                    style={{ animationDelay: '4000ms' }}
                ></div>
            </div>

            {/* Content Card */}
            <div className="relative z-10 w-full max-w-lg px-6">
                <div className="bg-white/70 backdrop-blur-xl border border-white/50 shadow-2xl rounded-3xl overflow-hidden p-8 md:p-12 ring-1 ring-white/60">
                    
                    {/* Icon */}
                    <div className="flex justify-center mb-6">
                        <div className="relative">
                            <div className="bg-amber-100 p-4 rounded-2xl">
                                <Clock className="h-12 w-12 text-amber-600" />
                            </div>
                            <div className="absolute -top-1 -right-1 bg-amber-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                                Pending
                            </div>
                        </div>
                    </div>

                    {/* Title */}
                    <h1 className="text-2xl md:text-3xl font-extrabold text-neutral-900 text-center mb-3">
                        Account Under Review
                    </h1>

                    {/* Description */}
                    <p className="text-neutral-600 text-center mb-8 leading-relaxed">
                        Thank you for registering as a manufacturer on LinkER. 
                        Our team is reviewing your application and will get back to you shortly.
                    </p>

                    {/* User Info Card */}
                    {user && (
                        <div className="bg-neutral-50 rounded-xl p-4 mb-8 border border-neutral-200">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="bg-green-100 p-2 rounded-lg">
                                    <Building2 className="h-5 w-5 text-green-600" />
                                </div>
                                <div>
                                    <p className="text-xs text-neutral-500 font-medium uppercase">Company</p>
                                    <p className="text-neutral-900 font-semibold">{user.name || 'Not specified'}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="bg-blue-100 p-2 rounded-lg">
                                    <Mail className="h-5 w-5 text-blue-600" />
                                </div>
                                <div>
                                    <p className="text-xs text-neutral-500 font-medium uppercase">Email</p>
                                    <p className="text-neutral-900 font-semibold">{user.email}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* What's Next Section */}
                    <div className="mb-8">
                        <h2 className="text-sm font-bold text-neutral-700 uppercase mb-3">What happens next?</h2>
                        <ul className="space-y-2 text-sm text-neutral-600">
                            <li className="flex items-start gap-2">
                                <span className="bg-green-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">1</span>
                                <span>Our team reviews your application (usually within 24-48 hours)</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="bg-neutral-300 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">2</span>
                                <span>You'll receive an email notification once approved</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="bg-neutral-300 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">3</span>
                                <span>Access your manufacturer dashboard and start uploading fabrics</span>
                            </li>
                        </ul>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col sm:flex-row gap-3">
                        <button
                            onClick={() => navigate('/')}
                            className="flex-1 py-3 px-4 rounded-xl font-semibold text-neutral-700 bg-neutral-100 hover:bg-neutral-200 transition-colors flex items-center justify-center gap-2"
                        >
                            <ArrowLeft size={18} />
                            Back to Home
                        </button>
                        <button
                            onClick={logout}
                            className="flex-1 py-3 px-4 rounded-xl font-semibold text-white bg-neutral-800 hover:bg-neutral-900 transition-colors flex items-center justify-center gap-2"
                        >
                            <LogOut size={18} />
                            Sign Out
                        </button>
                    </div>

                    {/* Contact Support */}
                    <div className="mt-6 text-center">
                        <p className="text-xs text-neutral-500">
                            Questions? Contact us at{' '}
                            <a href="mailto:support@linker.app" className="text-primary-600 hover:underline font-medium">
                                support@linker.app
                            </a>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

