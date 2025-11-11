import React, { useState } from 'react';
import { updateProfile } from '../services/api';
import './Onboarding.css';

function Onboarding({ user, onComplete }) {
  const [name, setName] = useState('');
  const [unitSystem, setUnitSystem] = useState('kg');
  const [timezone, setTimezone] = useState('UTC');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await updateProfile({ name, unit_system: unitSystem, timezone });
      const updatedUser = { ...user, name, unit_system: unitSystem, timezone };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      onComplete(updatedUser);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update profile');
      setLoading(false);
    }
  };

  return (
    <div className="onboarding-container">
      <div className="onboarding-card">
        <h1>👋 Welcome!</h1>
        <p className="subtitle">Let's set up your profile</p>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Your Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="John Doe"
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label>Units *</label>
            <div className="radio-group">
              <label className="radio-label">
                <input
                  type="radio"
                  value="kg"
                  checked={unitSystem === 'kg'}
                  onChange={(e) => setUnitSystem(e.target.value)}
                  disabled={loading}
                />
                Kilograms (kg)
              </label>
              <label className="radio-label">
                <input
                  type="radio"
                  value="lb"
                  checked={unitSystem === 'lb'}
                  onChange={(e) => setUnitSystem(e.target.value)}
                  disabled={loading}
                />
                Pounds (lb)
              </label>
            </div>
          </div>

          <div className="form-group">
            <label>Timezone</label>
            <select
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              disabled={loading}
            >
              <option value="Europe/Moscow">Moscow</option>
              <option value="America/New_York">Eastern Time</option>
              <option value="America/Chicago">Central Time</option>
              <option value="America/Denver">Mountain Time</option>
              <option value="America/Los_Angeles">Pacific Time</option>
              <option value="Europe/London">London</option>
              <option value="Europe/Paris">Paris</option>
              <option value="Asia/Tokyo">Tokyo</option>
            </select>
          </div>

          <button type="submit" disabled={loading}>
            {loading ? 'Saving...' : 'Get Started'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Onboarding;