import React, { useState, useEffect } from 'react';
import { getMovements, createMovement } from '../services/api';
import { Link } from 'react-router-dom';

function Movements() {
  const [movements, setMovements] = useState([]);
  const [filteredMovements, setFilteredMovements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  
  // Form state
  const [newMovement, setNewMovement] = useState({
    name: '',
    category: 'Other',
    notes: ''
  });

  useEffect(() => {
    loadMovements();
  }, []);

  useEffect(() => {
    filterMovements();
  }, [movements, searchQuery, categoryFilter]);

  const loadMovements = async () => {
    try {
      const response = await getMovements();
      setMovements(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error loading movements:', error);
      setLoading(false);
    }
  };

  const filterMovements = () => {
    let filtered = movements;

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(m => 
        m.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(m => m.category === categoryFilter);
    }

    setFilteredMovements(filtered);
  };

  const handleAddMovement = async (e) => {
    e.preventDefault();
    try {
      await createMovement(newMovement);
      setNewMovement({ name: '', category: 'Other', notes: '' });
      setShowAddForm(false);
      loadMovements();
    } catch (error) {
      console.error('Error creating movement:', error);
      alert('Failed to create movement');
    }
  };

  const categories = ['all', 'Powerlifting', 'Weightlifting', 'Barbell', 'Gymnastics', 'Other'];

  if (loading) {
    return <div className="container">Loading...</div>;
  }

  return (
    <div className="container">
      <div className="page-header">
        <h1>💪 Movements</h1>
        <p>Track your personal records across different movements</p>
      </div>

      {/* Search and Filter */}
      <div style={{ marginBottom: '20px', display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
        <input
          type="text"
          placeholder="Search movements..."
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
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          style={{ 
            padding: '12px',
            border: '2px solid #ddd',
            borderRadius: '8px',
            fontSize: '16px',
            minWidth: '150px'
          }}
        >
          {categories.map(cat => (
            <option key={cat} value={cat}>
              {cat === 'all' ? 'All Categories' : cat}
            </option>
          ))}
        </select>
        <button 
          onClick={() => setShowAddForm(!showAddForm)}
          className="btn"
        >
          {showAddForm ? 'Cancel' : '+ Add Custom Movement'}
        </button>
      </div>
      {/* Add Movement Form */}
      {showAddForm && (
        <div className="card" style={{ marginBottom: '20px' }}>
          <h3>Add Custom Movement</h3>
          <form onSubmit={handleAddMovement}>
            <div className="form-group">
              <label>Movement Name *</label>
              <input
                type="text"
                value={newMovement.name}
                onChange={(e) => setNewMovement({ ...newMovement, name: e.target.value })}
                placeholder="e.g., Deficit Deadlift"
                required
              />
            </div>
            <div className="form-group">
              <label>Category</label>
              <select
                value={newMovement.category}
                onChange={(e) => setNewMovement({ ...newMovement, category: e.target.value })}
              >
                <option value="Powerlifting">Powerlifting</option>
                <option value="Weightlifting">Weightlifting</option>
                <option value="Barbell">Barbell</option>
                <option value="Gymnastics">Gymnastics</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div className="form-group">
              <label>Notes (optional)</label>
              <textarea
                value={newMovement.notes}
                onChange={(e) => setNewMovement({ ...newMovement, notes: e.target.value })}
                placeholder="Any additional notes..."
              />
            </div>
            <button type="submit" className="btn">Create Movement</button>
          </form>
        </div>
      )}

      {/* Movements Grid */}
      <div className="grid">
        {filteredMovements.map(movement => (
          <Link 
            key={movement.id} 
            to={`/movements/${movement.id}`}
            style={{ textDecoration: 'none', color: 'inherit' }}
          >
            <div className="card">
              <h3>{movement.name}</h3>
              <span className="badge">{movement.category}</span>
              {movement.is_custom === 1 && (
                <span className="badge" style={{ marginLeft: '8px', background: '#fff3cd', color: '#856404' }}>
                  Custom
                </span>
              )}
            </div>
          </Link>
        ))}
      </div>

      {filteredMovements.length === 0 && (
        <div className="empty-state">
          <h3>No movements found</h3>
          <p>Try adjusting your filters or add a custom movement</p>
        </div>
      )}
    </div>
  );
}

export default Movements;