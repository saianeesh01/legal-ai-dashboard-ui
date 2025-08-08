import React, { useEffect, useRef, useState } from 'react';
import './Login.css';

interface LoginProps {
    onLogin: (username: string, password: string) => void;
    onShowAbout: () => void;
}

const Login: React.FC<LoginProps> = ({ onLogin, onShowAbout }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const loginBoxRef = useRef<HTMLDivElement>(null);
    const titleRef = useRef<HTMLHeadingElement>(null);
    const subtitleRef = useRef<HTMLParagraphElement>(null);
    const formRef = useRef<HTMLFormElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        // Add entrance animations using CSS classes
        if (loginBoxRef.current) {
            loginBoxRef.current.classList.add('animate-entrance');
        }
        if (titleRef.current) {
            titleRef.current.classList.add('animate-slide-in-left');
        }
        if (subtitleRef.current) {
            subtitleRef.current.classList.add('animate-slide-in-right');
        }

        // Add staggered animations to form elements
        const formInputs = document.querySelectorAll('.form-input');
        formInputs.forEach((input, index) => {
            setTimeout(() => {
                input.classList.add('animate-slide-in-up');
            }, 200 + (index * 100));
        });

        // Animate button
        setTimeout(() => {
            if (buttonRef.current) {
                buttonRef.current.classList.add('animate-scale-in');
            }
        }, 600);

    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!username || !password) {
            // Shake animation for validation
            if (formRef.current) {
                formRef.current.classList.add('shake');
                setTimeout(() => {
                    formRef.current?.classList.remove('shake');
                }, 500);
            }
            return;
        }

        setIsLoading(true);

        // Button click animation
        if (buttonRef.current) {
            buttonRef.current.classList.add('animate-click');
            setTimeout(() => {
                buttonRef.current?.classList.remove('animate-click');
            }, 200);
        }

        // Simulate login delay
        setTimeout(() => {
            onLogin(username, password);
            setIsLoading(false);
        }, 1000);
    };

    const handleAboutClick = () => {
        // Fade out animation before showing about page
        if (loginBoxRef.current) {
            loginBoxRef.current.classList.add('animate-fade-out');
            setTimeout(() => {
                onShowAbout();
            }, 500);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 flex items-center justify-center p-4">
            <div className="relative">
                {/* Animated background particles */}
                <div className="absolute inset-0 overflow-hidden">
                    {[...Array(20)].map((_, i) => (
                        <div
                            key={i}
                            className="particle"
                            style={{
                                left: `${Math.random() * 100}%`,
                                top: `${Math.random() * 100}%`,
                                animationDelay: `${Math.random() * 2}s`,
                                animationDuration: `${3 + Math.random() * 4}s`
                            }}
                        />
                    ))}
                </div>

                {/* Login Box */}
                <div
                    ref={loginBoxRef}
                    className="login-box relative bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-2xl border border-white/20 w-96"
                >
                    {/* Logo/Title */}
                    <div className="text-center mb-8">
                        <h1
                            ref={titleRef}
                            className="text-4xl font-bold text-white mb-2"
                        >
                            ⚖️ Legal AI
                        </h1>
                        <p
                            ref={subtitleRef}
                            className="text-blue-200 text-lg"
                        >
                            Smart Document Assistant
                        </p>
                    </div>

                    {/* Login Form */}
                    <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-4">
                            <div className="form-input">
                                <input
                                    type="text"
                                    placeholder="Username"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-300"
                                />
                            </div>

                            <div className="form-input">
                                <input
                                    type="password"
                                    placeholder="Password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-300"
                                />
                            </div>
                        </div>

                        <button
                            ref={buttonRef}
                            type="submit"
                            disabled={isLoading}
                            className="login-button w-full py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold rounded-lg transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? (
                                <span className="flex items-center justify-center">
                                    <div className="spinner rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                                    Logging in...
                                </span>
                            ) : (
                                'Login'
                            )}
                        </button>
                    </form>

                    {/* About Link */}
                    <div className="mt-6 text-center">
                        <button
                            onClick={handleAboutClick}
                            className="text-blue-300 hover:text-blue-200 text-sm transition-colors duration-300"
                        >
                            What is Legal AI? →
                        </button>
                    </div>

                    {/* Features Preview */}
                    <div className="mt-8 grid grid-cols-2 gap-4 text-center text-xs text-gray-300">
                        <div className="feature-card p-2 bg-white/5 rounded-lg">
                            📄 Upload Documents
                        </div>
                        <div className="feature-card p-2 bg-white/5 rounded-lg">
                            🧠 AI Analysis
                        </div>
                        <div className="feature-card p-2 bg-white/5 rounded-lg">
                            🔍 Smart Search
                        </div>
                        <div className="feature-card p-2 bg-white/5 rounded-lg">
                            🛡️ Secure & Local
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login; 