import React from 'react';
import { ArrowRight, Layout, Search } from 'lucide-react';
import { Reveal } from './Reveal';
import { useNavigate } from 'react-router-dom';
import Threads from './Threads';

export const HeroSection: React.FC = () => {
    const navigate = useNavigate();

    return (
        <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden bg-white dark:bg-gradient-to-br dark:from-neutral-900 dark:via-neutral-800 dark:to-neutral-900 transition-colors">
            {/* Threads Background - Blended with content */}
            <div className="absolute inset-0 z-0 opacity-40 dark:opacity-60">
                <Threads
                    color={[0.133, 0.773, 0.369]} // Sage green #22C55E (accent-500) normalized to 0-1
                    amplitude={0.8}
                    distance={0.05}
                    enableMouseInteraction={true}
                />
            </div>

            {/* Gradient overlay for better content readability - only in dark mode */}
            <div className="absolute inset-0 z-0 bg-gradient-to-b from-transparent via-transparent to-transparent dark:from-neutral-900/60 dark:via-transparent dark:to-neutral-900/60"></div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">

                    {/* Left Column: Text */}
                    <div className="text-center lg:text-left z-10">
                        <Reveal delay={100}>
                            <div className="inline-flex items-center px-3 py-1 rounded-full bg-primary-500/20 dark:bg-primary-500/20 text-primary-700 dark:text-white text-xs font-bold tracking-wide mb-6 border border-primary-400/40 dark:border-primary-400/40 shadow-sm uppercase backdrop-blur-sm">
                                <span className="flex h-2 w-2 rounded-full bg-primary-500 dark:bg-primary-300 mr-2 animate-pulse"></span>
                                Visual Sourcing Platform
                            </div>
                        </Reveal>

                        <Reveal delay={200}>
                            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-neutral-900 dark:text-white tracking-tight leading-[1.1] mb-6">
                                Discover. Visualize.<br />
                                Source Fabrics — <span className="text-primary-600 dark:text-primary-400">Smarter.</span>
                            </h1>
                        </Reveal>

                        <Reveal delay={300}>
                            <p className="text-lg md:text-xl text-neutral-600 dark:text-neutral-300 mb-8 max-w-2xl mx-auto lg:mx-0 leading-relaxed font-light">
                                The world's first visual sourcing platform that connects global fashion buyers with verified manufacturers. Explore thousands of fabrics with instant mockup previews and build moodboards in minutes.
                            </p>
                        </Reveal>

                        <Reveal delay={400}>
                            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start space-y-4 sm:space-y-0 sm:space-x-4">
                                <button onClick={() => navigate('/login?role=buyer')} className="w-full sm:w-auto px-8 py-4 bg-primary-500 text-white rounded-full font-bold shadow-lg shadow-primary-500/50 hover:bg-primary-400 hover:scale-105 hover:shadow-xl hover:shadow-primary-500/60 transition-all duration-200 flex items-center justify-center">
                                    Explore Fabrics
                                    <ArrowRight size={18} className="ml-2" />
                                </button>
                                <button onClick={() => navigate('/login?role=manufacturer')} className="w-full sm:w-auto px-8 py-4 bg-neutral-100 dark:bg-white/10 backdrop-blur-sm text-neutral-900 dark:text-white border border-neutral-300 dark:border-white/30 rounded-full font-semibold hover:border-neutral-400 dark:hover:border-white/50 hover:bg-neutral-200 dark:hover:bg-white/20 transition-all duration-200 shadow-sm">
                                    Join as Manufacturer
                                </button>
                            </div>
                        </Reveal>
                    </div>

                    {/* Right Column: Abstract UI Mockup */}
                    <div className="relative z-0 mt-10 lg:mt-0 perspective-1000">
                        <Reveal delay={500}>
                            {/* Decorative background blobs - light/dark theme */}
                            <div className="absolute -top-10 -right-10 w-80 h-80 bg-accent-500/10 dark:bg-accent-500/20 rounded-full mix-blend-screen filter blur-3xl opacity-30 animate-blob"></div>
                            <div className="absolute -bottom-10 -left-10 w-80 h-80 bg-primary-500/10 dark:bg-primary-500/20 rounded-full mix-blend-screen filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>

                            {/* The "App" Window - Glassmorphism with light/dark theme */}
                            <div className="relative bg-white/80 dark:bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl border border-neutral-200 dark:border-white/20 overflow-hidden transform rotate-y-12 rotate-x-6 hover:rotate-0 transition-transform duration-700 ease-out ring-1 ring-neutral-200 dark:ring-white/20">

                                {/* Fake Window Header */}
                                <div className="h-10 bg-neutral-100 dark:bg-white/20 border-b border-neutral-200 dark:border-white/20 flex items-center px-4 space-x-2">
                                    <div className="w-3 h-3 rounded-full bg-red-400"></div>
                                    <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                                    <div className="w-3 h-3 rounded-full bg-green-400"></div>
                                    <div className="ml-4 flex-1 bg-white dark:bg-white/20 h-6 rounded-md border border-neutral-200 dark:border-white/20 flex items-center px-2 text-xs text-neutral-600 dark:text-neutral-300 font-light shadow-inner">
                                        <Search size={12} className="mr-2 opacity-60" /> fab-ai.co/search
                                    </div>
                                </div>

                                {/* Fake App Body */}
                                <div className="flex h-[400px]">
                                    {/* Fake Sidebar */}
                                    <div className="w-16 md:w-48 bg-neutral-50 dark:bg-white/10 border-r border-neutral-200 dark:border-white/20 p-4 hidden md:block backdrop-blur-md">
                                        <div className="h-8 w-24 bg-neutral-200 dark:bg-white/30 rounded mb-6 shadow-sm"></div>
                                        <div className="space-y-3">
                                            <div className="h-4 w-full bg-neutral-200 dark:bg-white/20 rounded-sm"></div>
                                            <div className="h-4 w-3/4 bg-neutral-200 dark:bg-white/20 rounded-sm"></div>
                                            <div className="h-4 w-5/6 bg-neutral-200 dark:bg-white/20 rounded-sm"></div>
                                        </div>
                                        <div className="mt-8 space-y-3">
                                            <div className="h-4 w-1/2 bg-neutral-200 dark:bg-white/20 rounded-sm"></div>
                                            <div className="h-32 w-full bg-neutral-200 dark:bg-white/20 border border-neutral-300 dark:border-white/20 rounded-lg shadow-sm"></div>
                                        </div>
                                    </div>

                                    {/* Fake Grid */}
                                    <div className="flex-1 p-6 bg-white dark:bg-white/5 grid grid-cols-2 gap-4 overflow-hidden">
                                        {[1, 2, 3, 4].map(i => (
                                            <div key={i} className="bg-white dark:bg-white/30 border border-neutral-200 dark:border-white/20 rounded-lg shadow-sm flex flex-col overflow-hidden hover:scale-[1.02] transition-transform duration-300">
                                                <div className={`h-24 w-full ${i % 2 === 0 ? 'bg-primary-500/20 dark:bg-primary-500/30' : 'bg-accent-500/20 dark:bg-accent-500/30'}`}></div>
                                                <div className="p-2 space-y-2">
                                                    <div className="h-3 w-3/4 bg-neutral-200 dark:bg-white/20 rounded"></div>
                                                    <div className="h-3 w-1/2 bg-neutral-200 dark:bg-white/20 rounded"></div>
                                                    <div className="flex space-x-2 mt-2">
                                                        <div className="h-6 w-6 bg-neutral-200 dark:bg-white/20 rounded-full shadow-sm"></div>
                                                        <div className="h-6 w-16 bg-neutral-200 dark:bg-white/20 rounded-full shadow-sm"></div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Floating Badge */}
                                <div className="absolute bottom-6 right-6 bg-primary-500 dark:bg-primary-500/80 backdrop-blur-md text-white px-4 py-2 rounded-lg shadow-xl flex items-center text-sm font-bold animate-bounce-slow border border-primary-400 dark:border-primary-400/30">
                                    <Layout size={16} className="mr-2" />
                                    Moodboard Active
                                </div>
                            </div>
                        </Reveal>
                    </div>

                </div>
            </div>
        </section>
    );
};