import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getWODs, createWODResult } from '../services/api';

function AddWODResult({ user }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [wod, setWod] = useState(null);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    time_min: '',
    time_sec: '',
    rounds: '',
    extra_reps: '',
    loads_used: '',
    rx_scaled: 'Rx',
    note: '',
    media_link: ''
  });

  useEffect(() => {
    loadWod();
  }, [id]);

  const loadWod = async () => {
    try {
      const response = await getWODs();
      const foundWod = response.data.find(w => w.id === parseInt(id));
      setWod(foundWod);
    } catch (error) {
      console.error('Error loading WOD:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = {
        wod_id: parseInt(id),
        date: formData.date,
        format: wod.format,
        rx_scaled: formData.rx_scaled,
        loads_used: formData.loads_used,
        note: formData.note,
        media_link: formData.media_link
      };

      // Add format-specific fields
      if (wod.format === 'For Time') {
        const totalSeconds = (parseInt(formData.time_min) || 0) * 60 + (parseInt(formData.time_sec) || 0);
        data.time_sec = totalSeconds;
      } else if (wod.format === 'AMRAP') {
        data.rounds = parseInt(formData.rounds) || 0;
        data.extra_reps = parseInt(formData.extra_reps) || 0;
      }

      await createWODResult(data);
      navigate(`/wods/${id}`);
    } catch (error) {
      console.error('Error creating result:', error);
      alert('Failed to create result');
      setLoading(false);
    }
  };

  if (!wod) {
    return <div className="container">Loading...</div>;
  }

  return (
    <div className="container">
      <div className="page-header">
        <h1>Log Result - {wod.name}</h1>
        <p>{wod.format}</p>
      </div>

      <div className="card" style={{ marginBottom: '20px', background: '#f8f9fa' }}>
        <h3>Workout</h3>
        <p style={{ whiteSpace: 'pre-line', marginTop: '10px' }}>
          {wod.description}
        </p>
        {wod.prescribed_loads && (
          <p style={{ marginTop: '10px', color: '#666' }}>
            <strong>Rx:</strong> {wod.prescribed_loads}
          </p>
        )}
      </div>

      <div className="card" style={{ maxWidth: '600px', margin: '0 auto' }}>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Date *</label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              required
            />
          </div>

          {wod.format === 'For Time' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <div className="form-group">
                <label>Minutes</label>
                <input
                  type="number"
                  min="0"
                  value={formData.time_min}
                  onChange={(e) => setFormData({ ...formData, time_min: e.target.value })}
                  placeholder="10"
                />
              </div>
              <div className="form-group">
                <label>Seconds</label>
                <input
                  type="number"
                  min="0"
                  max="59"
                  value={formData.time_sec}
                  onChange={(e) => setFormData({ ...formData, time_sec: e.target.value })}
                  placeholder="30"
                />
              </div>
            </div>
          )}

          {wod.format === 'AMRAP' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <div className="form-group">
                <label>Rounds</label>
                <input
                  type="number"
                  min="0"
                  value={formData.rounds}
                  onChange={(e) => setFormData({ ...formData, rounds: e.target.value })}
                  placeholder="10"
                />
              </div>
              <div className="form-group">
                <label>Extra Reps</label>
                <input
                  type="number"
                  min="0"
                  value={formData.extra_reps}
                  onChange={(e) => setFormData({ ...formData, extra_reps: e.target.value })}
                  placeholder="5"
                />
              </div>
            </div>
          )}

          <div className="form-group">
            <label>Rx or Scaled *</label>
            <select
              value={formData.rx_scaled}
              onChange={(e) => setFormData({ ...formData, rx_scaled: e.target.value })}
              required
            >
              <option value="Rx">Rx (as prescribed)</option>
              <option value="Scaled">Scaled</option>
            </select>
          </div>

          <div className="form-group">
            <label>Loads Used (optional)</label>
            <input
              type="text"
              value={formData.loads_used}
              onChange={(e) => setFormData({ ...formData, loads_used: e.target.value })}
              placeholder="e.g., 95 lb, 20 kg"
            />
          </div>

          <div className="form-group">
            <label>Note (optional)</label>
            <textarea
              value={formData.note}
              onChange={(e) => setFormData({ ...formData, note: e.target.value })}
              placeholder="How did it feel?..."
            />
          </div>

          <div className="form-group">
            <label>Media Link (optional)</label>
            <input
              type="url"
              value={formData.media_link}
              onChange={(e) => setFormData({ ...formData, media_link: e.target.value })}
              placeholder="https://youtube.com/..."
            />
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button type="submit" className="btn" disabled={loading}>
              {loading ? 'Saving...' : 'Save Result'}
            </button>
            <button 
              type="button" 
              className="btn btn-secondary"
              onClick={() => navigate(`/wods/${id}`)}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddWODResult;
