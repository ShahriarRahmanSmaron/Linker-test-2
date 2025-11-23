import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Layers, ArrowRight, Mail, Lock, User, Building2 } from 'lucide-react';
import { useAuth } from './AuthContext';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login } = useAuth();
  
  const [role, setRole] = useState<'buyer' | 'manufacturer'>('buyer');
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  
  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    const paramRole = searchParams.get('role');
    if (paramRole === 'manufacturer') {
      setRole('manufacturer');
    } else {
      setRole('buyer');
    }
  }, [searchParams]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulate network request
    setTimeout(() => {
      login(role, email);
      setIsLoading(false);
      if (role === 'buyer') {
        navigate('/search');
      } else {
        navigate('/manufacturer-dashboard');
      }
    }, 1500);
  };

  return (
    <div className="min-h-screen w-full relative flex items-center justify-center overflow-hidden bg-neutral-50 font-sans">
      
      {/* Animated Background Blobs 
          Using standard colors (blue-300, green-300, pink-300) and inline styles for animation delays 
          to ensure they are visible and staggered correctly.
      */}
      <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none">
         {/* Blob 1: Blue - Top Left */}
         <div 
            className="absolute -top-32 -left-32 w-96 h-96 bg-blue-300 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob"
         ></div>
         
         {/* Blob 2: Green - Top Right */}
         <div 
            className="absolute -top-32 -right-32 w-96 h-96 bg-green-300 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob" 
            style={{ animationDelay: '2000ms' }}
         ></div>
         
         {/* Blob 3: Pink - Bottom Left */}
         <div 
            className="absolute -bottom-40 left-20 w-96 h-96 bg-pink-300 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob" 
            style={{ animationDelay: '4000ms' }}
         ></div>
      </div>

      {/* Glassmorphic Card */}
      <div className="relative z-10 w-full max-w-md px-6">
         <div className="bg-white/60 backdrop-blur-xl border border-white/50 shadow-2xl rounded-3xl overflow-hidden p-8 md:p-10 ring-1 ring-white/60">
            
            {/* Header */}
            <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center bg-primary-50 p-2.5 rounded-xl mb-4 shadow-sm">
                    <Layers className="h-8 w-8 text-primary-600" />
                </div>
                <h1 className="text-3xl font-extrabold text-neutral-900 tracking-tight mb-2">
                    {isLogin ? 'Welcome Back' : 'Join LinkER'}
                </h1>
                <p className="text-neutral-500 font-medium">
                    {isLogin ? 'Sign in to continue sourcing smarter.' : 'Create an account to get started.'}
                </p>
            </div>

            {/* Role Toggle */}
            <div className="bg-neutral-100/80 p-1.5 rounded-xl flex mb-8 shadow-inner relative">
                 {/* Sliding Background */}
                 <div 
                    className={`absolute top-1.5 bottom-1.5 rounded-lg bg-white shadow-sm transition-all duration-300 ease-out ${role === 'buyer' ? 'left-1.5 w-[calc(50%-6px)]' : 'left-[calc(50%+3px)] w-[calc(50%-6px)]'}`}
                 ></div>
                 
                 <button 
                    type="button"
                    onClick={() => setRole('buyer')}
                    className={`relative z-10 w-1/2 text-sm font-bold py-2.5 rounded-lg transition-colors duration-300 flex items-center justify-center ${role === 'buyer' ? 'text-primary-700' : 'text-neutral-500 hover:text-neutral-700'}`}
                 >
                    <User size={16} className="mr-2" /> Buyer
                 </button>
                 <button 
                    type="button"
                    onClick={() => setRole('manufacturer')}
                    className={`relative z-10 w-1/2 text-sm font-bold py-2.5 rounded-lg transition-colors duration-300 flex items-center justify-center ${role === 'manufacturer' ? 'text-green-700' : 'text-neutral-500 hover:text-neutral-700'}`}
                 >
                    <Building2 size={16} className="mr-2" /> Manufacturer
                 </button>
            </div>

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-1.5">
                    <label className="text-xs font-bold text-neutral-500 uppercase ml-1">Email Address</label>
                    <div className="relative">
                        <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-neutral-400" size={18} />
                        <input 
                            type="email" 
                            required 
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full pl-11 pr-4 py-3.5 bg-white/80 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all text-neutral-900 placeholder-neutral-400"
                            placeholder={role === 'buyer' ? 'buyer@brand.com' : 'contact@mill.com'}
                        />
                    </div>
                </div>
                
                <div className="space-y-1.5">
                    <label className="text-xs font-bold text-neutral-500 uppercase ml-1">Password</label>
                    <div className="relative">
                        <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-neutral-400" size={18} />
                        <input 
                            type="password" 
                            required 
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full pl-11 pr-4 py-3.5 bg-white/80 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all text-neutral-900 placeholder-neutral-400"
                            placeholder="••••••••"
                        />
                    </div>
                </div>

                {/* Forgot Password Link */}
                {isLogin && (
                    <div className="flex justify-end">
                        <button type="button" className="text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors">
                            Forgot password?
                        </button>
                    </div>
                )}

                <button 
                    type="submit" 
                    disabled={isLoading}
                    className={`w-full py-4 rounded-xl font-bold text-white shadow-lg transition-all duration-200 transform active:scale-[0.98] flex items-center justify-center relative overflow-hidden
                        ${role === 'buyer' 
                            ? 'bg-primary-600 hover:bg-primary-700 shadow-primary-500/30' 
                            : 'bg-green-600 hover:bg-green-700 shadow-green-500/30'}
                    `}
                >
                    {isLoading ? (
                        <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                        <>
                           {isLogin ? 'Sign In' : 'Create Account'} <ArrowRight size={18} className="ml-2" />
                        </>
                    )}
                </button>
            </form>

            {/* Toggle Mode */}
            <div className="mt-8 text-center">
                <p className="text-neutral-500 font-medium">
                    {isLogin ? "Don't have an account? " : "Already have an account? "}
                    <button 
                        onClick={() => setIsLogin(!isLogin)}
                        className={`font-bold transition-colors ${role === 'buyer' ? 'text-primary-600 hover:text-primary-700' : 'text-green-600 hover:text-green-700'}`}
                    >
                        {isLogin ? 'Sign Up' : 'Log In'}
                    </button>
                </p>
            </div>

             {/* Back to Home */}
             <div className="mt-6 text-center">
                <button onClick={() => navigate('/')} className="text-xs font-bold text-neutral-400 hover:text-neutral-600 transition-colors uppercase tracking-wider">
                    Back to Home
                </button>
            </div>

         </div>
      </div>
    </div>
  );
};