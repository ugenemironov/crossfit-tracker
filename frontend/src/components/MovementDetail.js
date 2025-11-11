import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getMovements, getPRRecords, getMovementStats, getPercentTable, deletePRRecord } from '../services/api';

function MovementDetail({ user }) {
  const { id } = useParams();
  const [movement, setMovement] = useState(null);
  const [records, setRecords] = useState([]);
  const [stats, setStats] = useState(null);
  const [percentTable, setPercentTable] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showPercentCalc, setShowPercentCalc] = useState(false);

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      const [movementsRes, recordsRes, statsRes] = await Promise.all([
        getMovements(),
        getPRRecords(id),
        getMovementStats(id)
      ]);

      const foundMovement = movementsRes.data.find(m => m.id === parseInt(id));
      setMovement(foundMovement);
      setRecords(recordsRes.data);
      setStats(statsRes.data);

      // Load percent table if there's a best 1RM
      if (statsRes.data.best_1rm) {
        const percentRes = await getPercentTable(id);
        setPercentTable(percentRes.data);
      }

      setLoading(false);
    } catch (error) {
      console.error('Error loading movement detail:', error);
      setLoading(false);
    }
  };

  const handleDelete = async (recordId) => {
    if (window.confirm('Are you sure you want to delete this PR record?')) {
      try {
        await deletePRRecord(recordId);
        loadData();
      } catch (error) {
        console.error('Error deleting record:', error);
        alert('Failed to delete record');
      }
    }
  };

  if (loading) {
    return <div className="container">Loading...</div>;
  }

  if (!movement) {
    return <div className="container">Movement not found</div>;
  }

  return (
    <div className="container">
      <div className="page-header">
        <h1>{movement.name}</h1>
        <span className="badge" style={{ fontSize: '14px', marginTop: '10px' }}>
          {movement.category}
        </span>
      </div>

      {/* Stats */}
      {stats && stats.total_records > 0 && (
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-value">{stats.best_1rm?.toFixed(1) || 'N/A'}</div>
            <div className="stat-label">Best 1RM ({user.unit_system})</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.last_1rm?.toFixed(1) || 'N/A'}</div>
            <div className="stat-label">Latest 1RM</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.delta_percent > 0 ? '+' : ''}{stats.delta_percent}%</div>
            <div className="stat-label">Progress</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.total_records}</div>
            <div className="stat-label">Total Records</div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div style={{ marginTop: '20px', marginBottom: '20px', display: 'flex', gap: '10px' }}>
        <Link to={`/movements/${id}/add-pr`} className="btn">
          + Add PR
        </Link>
        {percentTable && (
          <button 
            onClick={() => setShowPercentCalc(!showPercentCalc)}
            className="btn btn-secondary"
          >
            {showPercentCalc ? 'Hide' : 'Show'} Percent Calculator
          </button>
        )}
      </div>
      {/* Percent Calculator */}
      {showPercentCalc && percentTable && (
        <div className="card" style={{ marginBottom: '20px' }}>
          <h3>Percentage Calculator</h3>
          <p style={{ marginBottom: '15px', color: '#666' }}>
            Based on 1RM: <strong>{percentTable.base_1rm} {user.unit_system}</strong>
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '10px' }}>
            {percentTable.table.map(row => (
              <div 
                key={row.percent}
                style={{
                  padding: '12px',
                  background: '#f8f9fa',
                  borderRadius: '8px',
                  textAlign: 'center'
                }}
              >
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#667eea' }}>
                  {row.weight} {user.unit_system}
                </div>
                <div style={{ fontSize: '12px', color: '#666' }}>
                  {row.percent}%
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* PR Records History */}
      <h2 style={{ marginBottom: '15px' }}>PR History</h2>
      {records.length === 0 ? (
        <div className="empty-state">
          <h3>No records yet</h3>
          <p>Add your first PR for {movement.name}!</p>
          <Link to={`/movements/${id}/add-pr`} className="btn" style={{ marginTop: '15px' }}>
            Add First PR
          </Link>
        </div>
      ) : (
        records.map(record => (
          <div key={record.id} className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
              <div>
                <h3>{record.rep_scheme}</h3>
                <p>
                  <strong>Weight:</strong> {record.weight} {record.unit}
                  {record.reps && ` x ${record.reps} reps`}
                </p>
                {record.est_1rm && (
                  <p style={{ color: '#666' }}>
                    Estimated 1RM: {record.est_1rm.toFixed(1)} {record.unit}
                  </p>
                )}
                {record.note && (
                  <p style={{ marginTop: '8px', fontSize: '14px', color: '#666' }}>
                    {record.note}
                  </p>
                )}
                <p style={{ fontSize: '14px', color: '#999', marginTop: '8px' }}>
                  {new Date(record.date).toLocaleDateString()}
                </p>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                {record.is_pr === 1 && (
                  <span className="badge badge-success">PR 🏆</span>
                )}
                <button 
                  onClick={() => handleDelete(record.id)}
                  className="btn btn-danger btn-small"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

export default MovementDetail;