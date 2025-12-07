import React from 'react';
import { cn } from '@/lib/utils';

interface AuthLayoutProps {
    children: React.ReactNode;
    image?: string;
    title?: string;
    subtitle?: string;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({
    children,
    image = "/auth-bg.png",
    title,
    subtitle
}) => {
    return (
        <div className="min-h-screen w-full flex bg-neutral-50 overflow-hidden">
            {/* Left Column - Form */}
            <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 lg:px-24 py-12 relative z-10">
                <div className="w-full max-w-[480px] mx-auto">
                    {children}

                    <div className="mt-12 text-center text-xs text-neutral-400">
                        <p>&copy; {new Date().getFullYear()} LinkER. All rights reserved.</p>
                    </div>
                </div>
            </div>

            {/* Right Column - Image */}
            <div className="hidden lg:block lg:w-1/2 relative p-4 pl-0">
                <div className="w-full h-full rounded-[40px] overflow-hidden relative">
                    <div
                        className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-transform duration-700 hover:scale-105"
                        style={{ backgroundImage: `url(${image})` }}
                    />
                    {/* Optional Overlay if needed for contrast, but design looks clean */}
                    {/* <div className="absolute inset-0 bg-black/10" /> */}
                </div>
            </div>
        </div>
    );
};
