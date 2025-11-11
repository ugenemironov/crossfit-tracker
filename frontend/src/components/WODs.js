import React, { useState, useEffect } from 'react';
import { getWODs, createWOD } from '../services/api';
import { Link } from 'react-router-dom';

function WODs() {
  const [wods, setWods] = useState([]);
  const [filteredWods, setFilteredWods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [formatFilter, setFormatFilter] = useState('all');
  
  const [newWod, setNewWod] = useState({
    name: '',
    format: 'For Time',
    description: '',
    prescribed_loads: '',
    tags: ''
  });

  useEffect(() => {
    loadWods();
  }, []);

  useEffect(() => {
    filterWods();
  }, [wods, searchQuery, formatFilter]);

  const loadWods = async () => {
    try {
      const response = await getWODs();
      setWods(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error loading WODs:', error);
      setLoading(false);
    }
  };

  const filterWods = () => {
    let filtered = wods;

    if (searchQuery) {
      filtered = filtered.filter(w => 
        w.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        w.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (formatFilter !== 'all') {
      filtered = filtered.filter(w => w.format === formatFilter);
    }

    setFilteredWods(filtered);
  };

  const handleAddWod = async (e) => {
    e.preventDefault();
    try {
      await createWOD({
        ...newWod,
        tags: `FORMAT:${newWod.format}`
      });
      setNewWod({ name: '', format: 'For Time', description: '', prescribed_loads: '', tags: '' });
      setShowAddForm(false);
      loadWods();
    } catch (error) {
      console.error('Error creating WOD:', error);
      alert('Failed to create WOD');
    }
  };

  const formats = ['all', 'For Time', 'AMRAP', 'EMOM', 'Max Reps', 'Max Load'];

  if (loading) {
    return <div className="container">Loading...</div>;
  }

  return (
    <div className="container">
      <div className="page-header">
        <h1>🔥 WODs</h1>
        <p>Track your workout results</p>
      </div>

      {/* Search and Filter */}
      <div style={{ marginBottom: '20px', display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
        <input
          type="text"
          placeholder="Search WODs..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ 
            flex: 1, 
            minWidth: '250px',
            padding: '12px',
            border: '2px solid #ddd',
            borderRadius: '8px',
            fontSize: '16px'
          }}
        />
        <select
          value={formatFilter}
          onChange={(e) => setFormatFilter(e.target.value)}
          style={{ 
            padding: '12px',
            border: '2px solid #ddd',
            borderRadius: '8px',
            fontSize: '16px',
            minWidth: '150px'
          }}
        >
          {formats.map(format => (
            <option key={format} value={format}>
              {format === 'all' ? 'All Formats' : format}
            </option>
          ))}
        </select>
        <button 
          onClick={() => setShowAddForm(!showAddForm)}
          className="btn"
        >
          {showAddForm ? 'Cancel' : '+ Add Custom WOD'}
        </button>
      </div>

      {/* Add WOD Form */}
      {showAddForm && (
        <div className="card" style={{ marginBottom: '20px' }}>
          <h3>Add Custom WOD</h3>
          <form onSubmit={handleAddWod}>
            <div className="form-group">
              <label>WOD Name *</label>
              <input
                type="text"
                value={newWod.name}
                onChange={(e) => setNewWod({ ...newWod, name: e.target.value })}
                placeholder="e.g., My Custom WOD"
                required
              />
            </div>
            <div className="form-group">
              <label>Format *</label>
              <select
                value={newWod.format}
                onChange={(e) => setNewWod({ ...newWod, format: e.target.value })}
                required
              >
                <option value="For Time">For Time</option>
                <option value="AMRAP">AMRAP</option>
                <option value="EMOM">EMOM</option>
                <option value="Max Reps">Max Reps</option>
                <option value="Max Load">Max Load</option>
              </select>
            </div>
            <div className="form-group">
              <label>Description *</label>
              <textarea
                value={newWod.description}
                onChange={(e) => setNewWod({ ...newWod, description: e.target.value })}
                placeholder="21-15-9 reps of... or 5 Rounds of..."
                required
                rows="4"
              />
            </div>
            <div className="form-group">
              <label>Prescribed Loads (optional)</label>
              <input
                type="text"
                value={newWod.prescribed_loads}
                onChange={(e) => setNewWod({ ...newWod, prescribed_loads: e.target.value })}
                placeholder="e.g., 95/65 lb"
              />
            </div>
            <button type="submit" className="btn">Create WOD</button>
          </form>
        </div>
      )}

      {/* WODs Grid */}
      <div className="grid">
        {filteredWods.map(wod => (
          <Link 
            key={wod.id} 
            to={`/wods/${wod.id}`}
            style={{ textDecoration: 'none', color: 'inherit' }}
          >
            <div className="card">
              <h3>{wod.name}</h3>
              <span className="badge">{wod.format}</span>
              {wod.is_custom === 1 && (
                <span className="badge" style={{ marginLeft: '8px', background: '#fff3cd', color: '#856404' }}>
                  Custom
                </span>
              )}
              <p style={{ marginTop: '12px', fontSize: '14px', color: '#666', lineHeight: '1.6' }}>
                {wod.description.length > 80 ? wod.description.substring(0, 80) + '...' : wod.description}
              </p>
              {wod.prescribed_loads && (
                <p style={{ marginTop: '8px', fontSize: '12px', color: '#999' }}>
                  Rx: {wod.prescribed_loads}
                </p>
              )}
            </div>
          </Link>
        ))}
      </div>

      {filteredWods.length === 0 && (
        <div className="empty-state">
          <h3>No WODs found</h3>
          <p>Try adjusting your filters or add a custom WOD</p>
        </div>
      )}
    </div>
  );
}

export default WODs;
