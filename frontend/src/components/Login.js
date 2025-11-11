import React, { useState } from 'react';
import { requestOTP, verifyOTP } from '../services/api';
import './Login.css';

function Login({ onLogin }) {
  const [step, setStep] = useState('email'); // 'email' или 'otp'
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [devCode, setDevCode] = useState('');

  const handleRequestOTP = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await requestOTP(email);
      setDevCode(response.data.dev_code || '');
      setStep('otp');
      setLoading(false);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to send code');
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await verifyOTP(email, code);
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      onLogin(response.data.user);
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid code');
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h1>🏋️ CrossFit Tracker</h1>
        <p className="subtitle">Track your PRs and WOD results</p>

        {error && <div className="error-message">{error}</div>}

        {step === 'email' ? (
          <form onSubmit={handleRequestOTP}>
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                disabled={loading}
              />
            </div>
            <button type="submit" disabled={loading}>
              {loading ? 'Sending...' : 'Send Code'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOTP}>
            <div className="form-group">
              <label>Verification Code</label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="123456"
                maxLength="6"
                required
                disabled={loading}
              />
              {devCode && (
                <p className="dev-code">Dev code: <strong>{devCode}</strong></p>
              )}
            </div>
            <button type="submit" disabled={loading}>
              {loading ? 'Verifying...' : 'Verify'}
            </button>
            <button 
              type="button" 
              className="secondary"
              onClick={() => setStep('email')}
              disabled={loading}
            >
              Back
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default Login;