import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getMovements, createPRRecord } from '../services/api';

function AddPR({ user }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [movement, setMovement] = useState(null);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    rep_scheme: '1RM',
    weight: '',
    reps: '',
    note: '',
    media_link: '',
    is_pr: false
  });

  useEffect(() => {
    loadMovement();
  }, [id]);

  const loadMovement = async () => {
    try {
      const response = await getMovements();
      const foundMovement = response.data.find(m => m.id === parseInt(id));
      setMovement(foundMovement);
    } catch (error) {
      console.error('Error loading movement:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await createPRRecord({
        movement_id: parseInt(id),
        date: formData.date,
        rep_scheme: formData.rep_scheme,
        weight: parseFloat(formData.weight),
        reps: formData.reps ? parseInt(formData.reps) : null,
        note: formData.note,
        media_link: formData.media_link,
        unit: user.unit_system,
        is_pr: formData.is_pr ? 1 : 0
      });

      navigate(`/movements/${id}`);
    } catch (error) {
      console.error('Error creating PR:', error);
      alert('Failed to create PR record');
      setLoading(false);
    }
  };

  if (!movement) {
    return <div className="container">Loading...</div>;
  }

  return (
    <div className="container">
      <div className="page-header">
        <h1>Add PR - {movement.name}</h1>
        <p>Record your personal record</p>
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

          <div className="form-group">
            <label>Rep Scheme *</label>
            <select
              value={formData.rep_scheme}
              onChange={(e) => setFormData({ ...formData, rep_scheme: e.target.value })}
              required
            >
              <option value="1RM">1 Rep Max (1RM)</option>
              <option value="2RM">2 Rep Max (2RM)</option>
              <option value="3RM">3 Rep Max (3RM)</option>
              <option value="5RM">5 Rep Max (5RM)</option>
              <option value="Max Reps">Max Reps</option>
            </select>
          </div>

          <div className="form-group">
            <label>Weight ({user.unit_system}) *</label>
            <input
              type="number"
              step="0.5"
              value={formData.weight}
              onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
              placeholder="100"
              required
            />
          </div>

          {formData.rep_scheme === 'Max Reps' && (
            <div className="form-group">
              <label>Reps</label>
              <input
                type="number"
                value={formData.reps}
                onChange={(e) => setFormData({ ...formData, reps: e.target.value })}
                placeholder="20"
              />
            </div>
          )}

          <div className="form-group">
            <label>
              <input
                type="checkbox"
                checked={formData.is_pr}
                onChange={(e) => setFormData({ ...formData, is_pr: e.target.checked })}
                style={{ width: 'auto', marginRight: '8px' }}
              />
              Mark as PR 🏆
            </label>
          </div>
          <div className="form-group">
            <label>Note (optional)</label>
            <textarea
              value={formData.note}
              onChange={(e) => setFormData({ ...formData, note: e.target.value })}
              placeholder="Felt strong today..."
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
              {loading ? 'Saving...' : 'Save PR'}
            </button>
            <button 
              type="button" 
              className="btn btn-secondary"
              onClick={() => navigate(`/movements/${id}`)}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddPR;