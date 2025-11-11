import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getWODs, getWODResults, getWODStats, deleteWODResult } from '../services/api';

function WODDetail({ user }) {
  const { id } = useParams();
  const [wod, setWod] = useState(null);
  const [results, setResults] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      const [wodsRes, resultsRes, statsRes] = await Promise.all([
        getWODs(),
        getWODResults(id),
        getWODStats(id)
      ]);

      const foundWod = wodsRes.data.find(w => w.id === parseInt(id));
      setWod(foundWod);
      setResults(resultsRes.data);
      setStats(statsRes.data);
      setLoading(false);
    } catch (error) {
      console.error('Error loading WOD detail:', error);
      setLoading(false);
    }
  };

  const handleDelete = async (resultId) => {
    if (window.confirm('Are you sure you want to delete this result?')) {
      try {
        await deleteWODResult(resultId);
        loadData();
      } catch (error) {
        console.error('Error deleting result:', error);
        alert('Failed to delete result');
      }
    }
  };

  const formatTime = (seconds) => {
    if (!seconds) return 'N/A';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return <div className="container">Loading...</div>;
  }

  if (!wod) {
    return <div className="container">WOD not found</div>;
  }

  return (
    <div className="container">
      <div className="page-header">
        <h1>{wod.name}</h1>
        <span className="badge" style={{ fontSize: '14px', marginTop: '10px' }}>
          {wod.format}
        </span>
      </div>

      {/* WOD Description */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <h3>Workout</h3>
        <p style={{ whiteSpace: 'pre-line', lineHeight: '1.8', marginTop: '10px' }}>
          {wod.description}
        </p>
        {wod.prescribed_loads && (
          <p style={{ marginTop: '12px', color: '#666' }}>
            <strong>Rx:</strong> {wod.prescribed_loads}
          </p>
        )}
      </div>

      {/* Stats */}
      {stats && stats.total_attempts > 0 && (
        <div className="stats-grid">
          {wod.format === 'For Time' && stats.best_time && (
            <>
              <div className="stat-card">
                <div className="stat-value">{formatTime(stats.best_time)}</div>
                <div className="stat-label">Best Time</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{formatTime(stats.last_time)}</div>
                <div className="stat-label">Latest Time</div>
              </div>
            </>
          )}
          {wod.format === 'AMRAP' && (
            <>
              <div className="stat-card">
                <div className="stat-value">
                  {Math.floor(stats.best_score / 1000)}+{stats.best_score % 1000}
                </div>
                <div className="stat-label">Best Score</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">
                  {Math.floor(stats.last_score / 1000)}+{stats.last_score % 1000}
                </div>
                <div className="stat-label">Latest Score</div>
              </div>
            </>
          )}
          <div className="stat-card">
            <div className="stat-value">{stats.total_attempts}</div>
            <div className="stat-label">Total Attempts</div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div style={{ marginTop: '20px', marginBottom: '20px' }}>
        <Link to={`/wods/${id}/add-result`} className="btn">
          + Log Result
        </Link>
      </div>

      {/* Results History */}
      <h2 style={{ marginBottom: '15px' }}>Results History</h2>
      {results.length === 0 ? (
        <div className="empty-state">
          <h3>No results yet</h3>
          <p>Log your first result for {wod.name}!</p>
          <Link to={`/wods/${id}/add-result`} className="btn" style={{ marginTop: '15px' }}>
            Log First Result
          </Link>
        </div>
      ) : (
        results.map(result => (
          <div key={result.id} className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
              <div>
                {result.format === 'For Time' && result.time_sec && (
                  <h3>Time: {formatTime(result.time_sec)}</h3>
                )}
                {result.format === 'AMRAP' && (
                  <h3>Rounds: {result.rounds || 0} + {result.extra_reps || 0}</h3>
                )}
                <span className="badge" style={{ marginTop: '8px' }}>
                  {result.rx_scaled}
                </span>
                {result.loads_used && (
                  <p style={{ marginTop: '10px' }}>
                    <strong>Loads:</strong> {result.loads_used}
                  </p>
                )}
                {result.note && (
                  <p style={{ marginTop: '8px', fontSize: '14px', color: '#666' }}>
                    {result.note}
                  </p>
                )}
                <p style={{ fontSize: '14px', color: '#999', marginTop: '8px' }}>
                  {new Date(result.date).toLocaleDateString()}
                </p>
              </div>
              <button 
                onClick={() => handleDelete(result.id)}
                className="btn btn-danger btn-small"
              >
                Delete
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

export default WODDetail;
