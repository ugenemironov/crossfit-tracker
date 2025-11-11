import React, { useState } from 'react';
import { updateProfile } from '../services/api';

function Profile({ user, onUpdate }) {
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: user.name,
    unit_system: user.unit_system,
    timezone: user.timezone || 'UTC'
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await updateProfile(formData);
      const updatedUser = { ...user, ...formData };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      onUpdate(updatedUser);
      setEditing(false);
      setLoading(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile');
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div className="page-header">
        <h1>⚙️ Profile</h1>
        <p>Manage your account settings</p>
      </div>

      <div className="card" style={{ maxWidth: '600px', margin: '0 auto' }}>
        {!editing ? (
          <>
            <div style={{ marginBottom: '20px' }}>
              <h3>Personal Information</h3>
              <div style={{ marginTop: '15px' }}>
                <p><strong>Name:</strong> {user.name}</p>
                <p><strong>Email:</strong> {user.email || 'N/A'}</p>
                <p><strong>Phone:</strong> {user.phone || 'N/A'}</p>
                <p><strong>Units:</strong> {user.unit_system.toUpperCase()}</p>
                <p><strong>Timezone:</strong> {user.timezone}</p>
              </div>
            </div>
            <button onClick={() => setEditing(true)} className="btn">
              Edit Profile
            </button>
          </>
        ) : (
          <form onSubmit={handleSubmit}>
            <h3 style={{ marginBottom: '20px' }}>Edit Profile</h3>
            
            <div className="form-group">
              <label>Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label>Units *</label>
              <div style={{ display: 'flex', gap: '15px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    type="radio"
                    value="kg"
                    checked={formData.unit_system === 'kg'}
                    onChange={(e) => setFormData({ ...formData, unit_system: e.target.value })}
                  />
                  Kilograms (kg)
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    type="radio"
                    value="lb"
                    checked={formData.unit_system === 'lb'}
                    onChange={(e) => setFormData({ ...formData, unit_system: e.target.value })}
                  />
                  Pounds (lb)
                </label>
              </div>
            </div>

            <div className="form-group">
              <label>Timezone</label>
              <select
                value={formData.timezone}
                onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
              >
                <option value="UTC">UTC</option>
                <option value="America/New_York">Eastern Time</option>
                <option value="America/Chicago">Central Time</option>
                <option value="America/Denver">Mountain Time</option>
                <option value="America/Los_Angeles">Pacific Time</option>
                <option value="Europe/London">London</option>
                <option value="Europe/Paris">Paris</option>
                <option value="Asia/Tokyo">Tokyo</option>
              </select>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button type="submit" className="btn" disabled={loading}>
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
              <button 
                type="button" 
                className="btn btn-secondary"
                onClick={() => setEditing(false)}
                disabled={loading}
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default Profile;
