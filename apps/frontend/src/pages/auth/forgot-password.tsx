import React, { useState } from 'react';
import api from '../../utils/api';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
      const response = await api.post('/auth/forgot-password', { email });
      
      if (response.status === 200) {
        setSubmitted(true);
      } else {
        setError('Failed to send reset email.');
      }
    } catch (error: any) {
      console.error('Forgot password error:', error);
      setError(error.response?.data?.error || 'Network error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded shadow">
      <h2 className="text-2xl font-bold mb-4 text-center">Forgot Password</h2>
      {submitted ? (
        <p className="text-green-600 text-center">If your email exists, a reset link has been sent.</p>
      ) : (
        <form onSubmit={handleSubmit}>
          <label className="block mb-2">Email Address</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            className="w-full px-3 py-2 border rounded mb-4"
            placeholder="Enter your email"
          />
          {error && <p className="text-red-600 mb-2">{error}</p>}
          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>
      )}
    </div>
  );
}
