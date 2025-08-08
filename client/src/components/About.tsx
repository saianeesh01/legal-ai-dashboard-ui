import React, { useEffect, useRef } from 'react';

interface AboutProps {
    onBackToLogin: () => void;
    onGetStarted: () => void;
}

const About: React.FC<AboutProps> = ({ onBackToLogin, onGetStarted }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const titleRef = useRef<HTMLHeadingElement>(null);
    const subtitleRef = useRef<HTMLParagraphElement>(null);
    const featuresRef = useRef<HTMLDivElement>(null);
    const ctaRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Add entrance animations using CSS classes
        if (containerRef.current) {
            containerRef.current.classList.add('animate-fade-in');
        }
        if (titleRef.current) {
            titleRef.current.classList.add('animate-slide-in-left');
        }
        if (subtitleRef.current) {
            subtitleRef.current.classList.add('animate-slide-in-right');
        }

        // Animate features with stagger
        const featureCards = document.querySelectorAll('.feature-card');
        featureCards.forEach((card, index) => {
            setTimeout(() => {
                card.classList.add('animate-slide-in-up');
            }, 200 + (index * 150));
        });

        // Animate CTA section
        setTimeout(() => {
            if (ctaRef.current) {
                ctaRef.current.classList.add('animate-scale-in');
            }
        }, 800);

    }, []);

    const handleGetStarted = () => {
        // Fade out animation before transitioning
        if (containerRef.current) {
            containerRef.current.classList.add('animate-fade-out');
            setTimeout(() => {
                onGetStarted();
            }, 500);
        }
    };

    const handleBackToLogin = () => {
        if (containerRef.current) {
            containerRef.current.classList.add('animate-fade-out');
            setTimeout(() => {
                onBackToLogin();
            }, 500);
        }
    };

    const features = [
        {
            icon: '📄',
            title: 'Document Upload',
            description: 'Upload PDFs, Word docs, and legal files securely'
        },
        {
            icon: '🧠',
            title: 'AI Analysis',
            description: 'Get intelligent summaries and key insights from your documents'
        },
        {
            icon: '🔍',
            title: 'Smart Search',
            description: 'Find specific information across all your legal documents'
        },
        {
            icon: '⚖️',
            title: 'Legal Classification',
            description: 'Automatically categorize documents by type and purpose'
        },
        {
            icon: '📅',
            title: 'Date Extraction',
            description: 'Identify critical dates and deadlines automatically'
        },
        {
            icon: '💰',
            title: 'Financial Terms',
            description: 'Extract monetary amounts and financial obligations'
        },
        {
            icon: '🛡️',
            title: 'Secure & Local',
            description: 'Your data stays on your machine, no cloud storage'
        },
        {
            icon: '🚀',
            title: 'Fast Processing',
            description: 'Optimized for speed with local AI models'
        }
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 p-4">
            <div
                ref={containerRef}
                className="max-w-6xl mx-auto py-8"
            >
                {/* Header */}
                <div className="text-center mb-12">
                    <h1
                        ref={titleRef}
                        className="text-5xl font-bold text-white mb-4"
                    >
                        ⚖️ Legal AI Assistant
                    </h1>
                    <p
                        ref={subtitleRef}
                        className="text-xl text-blue-200 max-w-2xl mx-auto leading-relaxed"
                    >
                        Transform your legal document workflow with AI-powered analysis,
                        intelligent search, and automated insights. Built for legal professionals
                        who need speed, accuracy, and security.
                    </p>
                </div>

                {/* Features Grid */}
                <div
                    ref={featuresRef}
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12"
                >
                    {features.map((feature, index) => (
                        <div
                            key={index}
                            className="feature-card bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-300 transform hover:scale-105"
                        >
                            <div className="text-4xl mb-4">{feature.icon}</div>
                            <h3 className="text-lg font-semibold text-white mb-2">
                                {feature.title}
                            </h3>
                            <p className="text-gray-300 text-sm leading-relaxed">
                                {feature.description}
                            </p>
                        </div>
                    ))}
                </div>

                {/* How It Works */}
                <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-8 mb-12 border border-white/20">
                    <h2 className="text-3xl font-bold text-white mb-6 text-center">
                        How It Works
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="text-center">
                            <div className="text-6xl mb-4">📤</div>
                            <h3 className="text-xl font-semibold text-white mb-2">1. Upload</h3>
                            <p className="text-gray-300">
                                Drag and drop your legal documents or browse to select files
                            </p>
                        </div>
                        <div className="text-center">
                            <div className="text-6xl mb-4">🤖</div>
                            <h3 className="text-xl font-semibold text-white mb-2">2. Analyze</h3>
                            <p className="text-gray-300">
                                AI processes your documents and extracts key information
                            </p>
                        </div>
                        <div className="text-center">
                            <div className="text-6xl mb-4">📊</div>
                            <h3 className="text-xl font-semibold text-white mb-2">3. Results</h3>
                            <p className="text-gray-300">
                                Get summaries, insights, and searchable content instantly
                            </p>
                        </div>
                    </div>
                </div>

                {/* CTA Section */}
                <div
                    ref={ctaRef}
                    className="text-center"
                >
                    <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl p-8 mb-6">
                        <h2 className="text-3xl font-bold text-white mb-4">
                            Ready to Get Started?
                        </h2>
                        <p className="text-blue-100 text-lg mb-6">
                            Join thousands of legal professionals who trust Legal AI for their document workflow
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <button
                                onClick={handleGetStarted}
                                className="px-8 py-3 bg-white text-blue-600 font-semibold rounded-lg hover:bg-gray-100 transition-all duration-300 transform hover:scale-105"
                            >
                                Get Started Now
                            </button>
                            <button
                                onClick={handleBackToLogin}
                                className="px-8 py-3 border-2 border-white text-white font-semibold rounded-lg hover:bg-white hover:text-blue-600 transition-all duration-300"
                            >
                                Back to Login
                            </button>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="text-center text-gray-400 text-sm">
                    <p>Built with ❤️ for the legal community</p>
                    <p className="mt-2">Secure • Fast • Local • Private</p>
                </div>
            </div>
        </div>
    );
};

export default About; 