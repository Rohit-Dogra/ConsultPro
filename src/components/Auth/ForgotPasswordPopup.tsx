import React, { useState } from 'react';
import { toast } from 'react-toastify';

interface ForgotPasswordPopupProps {
    isOpen: boolean;
    onClose: () => void;
}

const ForgotPasswordPopup: React.FC<ForgotPasswordPopupProps> = ({ isOpen, onClose }) => {
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<{ name: string, password: string } | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setResult(null);
        try {
            const API_BASE_URL = import.meta.env.VITE_API_URL;
            const response = await fetch(`${API_BASE_URL}/api/auth/forgot-password-generate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email: email.trim().toLowerCase() })
            });
            const result = await response.json();
            if (!response.ok) {
                throw new Error(result.message || 'Failed to process request');
            }
            setResult({ name: result.name, password: result.password });
            toast.success('A new password has been sent to your email.');
        } catch (error) {
            console.error('Forgot password error:', error);
            toast.error(error instanceof Error ? error.message : 'Failed to process request');
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100] p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full mx-auto shadow-2xl animate-scale-in relative">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold">Reset Password</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                        aria-label="Close"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>



                
                {result ? (
                    <div className="space-y-4">
                        <div className="bg-green-100 text-green-800 p-4 rounded">
                            <strong>Dear {result.name},</strong><br />
                            {/* Your new password is: <span className="font-mono bg-gray-200 px-2 py-1 rounded">{result.password}</span><br /> */}
                        Kindly check your email for your login credentials. You can use the password provided in the email to log in.
                         After logging in, you will see an option to change your password at dashboard — we recommend updating it for security purposes
                        </div>
                        <button onClick={onClose} className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700">Close</button>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="mb-4">
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Email Address
                            </label>
                            <input
                                type="email"
                                id="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Enter your email"
                                required
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? 'Sending...' : 'Send New Password'}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
};

export default ForgotPasswordPopup;