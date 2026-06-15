import LagunaLake from '../images/laguna_lake.jpg';
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from "react-router-dom";

function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [otp, setOtp] = useState(Array(6).fill(''));
    const inputsRef = useRef([]);
    const [showOtp, setShowOtp] = useState(false);
    const [otpLoading, setOtpLoading] = useState(false);
    const navigate = useNavigate();

    const clearOtpInputs = () => {
        if (inputsRef.current) {
            inputsRef.current.forEach(input => {
                if (input) input.value = '';
            });
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        const body = {
            "email": email,
            "password": password,
        };
        try {
            const response = await fetch('process.env.REACT_APP_API_URL/auth/login/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });
            const data = await response.json();

            if (data.success) {
                setShowOtp(true);
                setOtp(Array(6).fill(''));
                clearOtpInputs();
            } else {
                setError("Login failed: invalid account");
                setEmail('');
                setPassword('');
            }
        } catch (error) {
            setError('Login failed: ' + (error.message || 'Unknown error'));
        } finally {
            setLoading(false);
        }
    };

    const otpSubmit = async (e) => {
        e.preventDefault();
        setOtpLoading(true);
        try {
            const response = await fetch('process.env.REACT_APP_API_URL/auth/otp/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    "username": email,
                    "otp": otp.join('')
                }),
            });
            const data = await response.json();

            if (data.success) {
                localStorage.setItem('token', data.access);
                localStorage.setItem('refresh', data.refresh);
                localStorage.setItem('user', JSON.stringify({
                    username: email,
                    role: data.role || "",
                    profilePic: data.profilePic || null
                }));

                navigate('/admin', {
                    state: { role: data.role, email: data.email }
                });
            } else {
                alert("Login failed: invalid OTP");
                clearOtpInputs();
                setOtp(Array(6).fill(''));
            }
        } catch (error) {
            console.error('Login failed:', error);
        } finally {
            setOtpLoading(false);
        }
    }

    const handleChange = (e, idx) => {
        const val = e.target.value.replace(/[^0-9]/g, '');
        const newOtp = [...otp];
        if (val.length === 1) {
            newOtp[idx] = val;
            setOtp(newOtp);
            if (idx < 5) {
                setTimeout(() => inputsRef.current[idx + 1]?.focus(), 0);
            }
        } else if (val.length > 1) {
            // Handle fast typing or autofill
            for (let i = 0; i < 6; i++) {
                newOtp[i] = val[i] || '';
            }
            setOtp(newOtp);
            setTimeout(() => inputsRef.current[Math.min(val.length, 5)]?.focus(), 0);
        } else {
            newOtp[idx] = '';
            setOtp(newOtp);
        }
    };

    const handleKeyDown = (e, idx) => {
        if (e.key === 'Backspace') {
            if (otp[idx]) {
                const newOtp = [...otp];
                newOtp[idx] = '';
                setOtp(newOtp);
            } else if (idx > 0) {
                setTimeout(() => inputsRef.current[idx - 1]?.focus(), 0);
                const newOtp = [...otp];
                newOtp[idx - 1] = '';
                setOtp(newOtp);
            }
            e.preventDefault();
        } else if (e.key === 'ArrowLeft' && idx > 0) {
            setTimeout(() => inputsRef.current[idx - 1]?.focus(), 0);
            e.preventDefault();
        } else if (e.key === 'ArrowRight' && idx < 5) {
            setTimeout(() => inputsRef.current[idx + 1]?.focus(), 0);
            e.preventDefault();
        }
    };

    const handleOtpPaste = (e) => {
        const pasted = e.clipboardData.getData('Text').replace(/\D/g, '').slice(0, 6);
        if (pasted.length > 0) {
            const newOtp = [...otp];
            for (let i = 0; i < 6; i++) {
                newOtp[i] = pasted[i] || '';
            }
            setOtp(newOtp);
            // Focus the last filled input
            const lastIdx = Math.min(pasted.length - 1, 5);
            setTimeout(() => {
                inputsRef.current[lastIdx]?.focus();
            }, 0);
            e.preventDefault();
        }
    };

    useEffect(() => {
        if (showOtp) {
            setTimeout(() => {
                inputsRef.current[0]?.focus();
            }, 100);
        }
    }, [showOtp]);

    // OTP Modal component
    const OtpModal = ({ open, onClose }) => {
        if (!open) return null;
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
                <div className="flex flex-col items-center px-8 py-10 bg-white rounded-2xl shadow-lg max-w-md mx-auto">
                    <h2 className="text-2xl font-bold mb-3 text-blue-900 font-poppins">Enter OTP</h2>
                    <p className="font-open-sans mb-5 text-gray-700 text-base text-center">
                        An OTP has been sent to your email.<br />
                        Please enter the 6-digit code below.
                    </p>
                    <form onSubmit={otpSubmit} className="flex flex-col items-center w-full">
                        <div className="flex gap-3 my-4 justify-center">
                            {otp.map((digit, idx) => (
                                <input
                                    key={idx}
                                    ref={el => (inputsRef.current[idx] = el)}
                                    type="text"
                                    inputMode="numeric"
                                    maxLength={1}
                                    value={digit}
                                    onChange={e => handleChange(e, idx)}
                                    onKeyDown={e => handleKeyDown(e, idx)}
                                    onPaste={handleOtpPaste}
                                    className="w-14 h-16 text-center border-2 border-blue-400 rounded-xl text-3xl font-bold focus:outline-blue-500 transition bg-blue-50 focus:bg-white shadow-sm"
                                    autoComplete="one-time-code"
                                />
                            ))}
                        </div>
                        <button
                            className="mt-6 bg-gradient-to-r from-blue-700 to-blue-500 text-white px-10 py-3 rounded-full font-poppins font-semibold text-lg hover:from-blue-800 hover:to-blue-600 transition duration-200 shadow"
                            type="submit"
                            disabled={otp.some(d => d.length !== 1) || otpLoading}
                        >
                            {otpLoading ? 'Submitting...' : 'Submit'}
                        </button>
                        <button
                            type="button"
                            className="mt-3 text-blue-700 underline text-sm font-medium"
                            onClick={onClose}
                        >
                            Cancel
                        </button>
                    </form>
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-black/30 backdrop-blur-md">
            <div
                className="flex flex-col md:flex-row w-full max-w-3xl overflow-hidden"
                style={{
                    minHeight: "480px",
                    background: "transparent",
                    border: "none",
                    boxShadow: "none"
                }}
            >
                {/* Image Section */}
                <div className="hidden md:flex w-1/2 items-center justify-center"
                    style={{ minHeight: "480px" }}>
                    <img
                        src={LagunaLake}
                        alt="Login"
                        className="w-full h-full object-cover"
                        style={{
                            borderRadius: "2.5rem 0 0 2.5rem",
                            filter: "brightness(1) saturate(1)"
                        }}
                    />
                </div>
                {/* Login Form */}
                <div className="w-full md:w-1/2 flex flex-col justify-center px-10 py-12"
                    style={{
                        borderRadius: "0 2.5rem 2.5rem 0",
                        background: "#fff"
                    }}
                >
                    <div className="flex flex-col items-center mb-8">
                        <h2 className="text-3xl font-extrabold text-slate-800 font-poppins tracking-tight mb-1">Sign in</h2>
                    </div>
                    {error && (
                        <div className="bg-red-50 border border-red-300 text-red-700 px-4 py-2 rounded-lg mb-4 text-center text-sm font-medium shadow">
                            {error}
                        </div>
                    )}
                    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                        <div>
                            <label className="block mb-1 text-slate-700 font-semibold text-sm">Email Address</label>
                            <input
                                type="text"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                disabled={loading}
                                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none font-poppins bg-slate-50 text-base transition"
                                autoComplete="username"
                                placeholder="Enter your email"
                                style={{fontWeight: 500}}
                            />
                        </div>
                        <div>
                            <label className="block mb-1 text-slate-700 font-semibold text-sm">Password</label>
                            <div className="relative flex items-center">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    disabled={loading}
                                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none font-poppins bg-slate-50 text-base transition"
                                    autoComplete="current-password"
                                    placeholder="Enter your password"
                                    style={{fontWeight: 500}}
                                />
                                <button
                                    type="button"
                                    className="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-1 text-blue-700 underline text-xs font-medium rounded transition"
                                    onClick={() => setShowPassword(!showPassword)}
                                    disabled={loading}
                                    tabIndex={0}
                                >
                                    {showPassword ? "Hide" : "Show"}
                                </button>
                            </div>
                        </div>
                        <button
                            type="submit"
                            disabled={loading || !email || !password}
                            className={`w-full py-3 rounded-2xl font-bold text-lg transition duration-200 shadow-sm ${
                                loading || !email || !password
                                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                    : 'bg-gradient-to-r from-blue-700 to-blue-500 text-white hover:from-blue-800 hover:to-blue-600'
                            }`}
                            style={{
                                fontWeight: 700,
                                fontSize: "1.15rem",
                                marginTop: "10px",
                                marginBottom: "4px",
                                letterSpacing: ".01em"
                            }}
                        >
                            {loading ? (
                                <span className="flex items-center justify-center">
                                    <svg className="animate-spin h-5 w-5 mr-2 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                                    </svg>
                                    Logging in...
                                </span>
                            ) : "LOGIN"}
                        </button>
                    </form>
                </div>
            </div>
            {/* OTP Modal */}
            <OtpModal open={showOtp} onClose={() => setShowOtp(false)} />
        </div>
    );
}

export default LoginPage;
