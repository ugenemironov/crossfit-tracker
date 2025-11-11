import React, { useState, useEffect } from 'react';
import { getPRRecords, getWODResults } from '../services/api';
import { Link } from 'react-router-dom';

function Dashboard({ user }) {
  const [recentPRs, setRecentPRs] = useState([]);
  const [recentWODs, setRecentWODs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [prsRes, wodsRes] = await Promise.all([
        getPRRecords(),
        getWODResults()
      ]);
      
      setRecentPRs(prsRes.data.slice(0, 5));
      setRecentWODs(wodsRes.data.slice(0, 5));
      setLoading(false);
    } catch (error) {
      console.error('Error loading dashboard:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="container">Loading...</div>;
  }

  return (
    <div className="container">
      <div className="page-header">
        <h1>👋 Welcome back, {user.name}!</h1>
        <p>Track your progress and crush your goals</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{recentPRs.length}</div>
          <div className="stat-label">Total PRs</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{recentWODs.length}</div>
          <div className="stat-label">WOD Results</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{user.unit_system.toUpperCase()}</div>
          <div className="stat-label">Units</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '30px' }}>
        <div>
          <h2 style={{ marginBottom: '15px' }}>Recent PRs</h2>
          {recentPRs.length === 0 ? (
            <div className="empty-state">
              <h3>No PRs yet</h3>
              <p>Start tracking your personal records!</p>
              <Link to="/movements" className="btn" style={{ marginTop: '15px' }}>
                Add First PR
              </Link>
            </div>
          ) : (
            recentPRs.map(pr => (
              <div key={pr.id} className="card">
                <h3>{pr.movement_name}</h3>
                <p>
                  <strong>{pr.rep_scheme}:</strong> {pr.weight} {pr.unit}
                  {pr.est_1rm && ` (Est 1RM: ${pr.est_1rm.toFixed(1)} ${pr.unit})`}
                </p>
                <p style={{ fontSize: '14px', color: '#999', marginTop: '8px' }}>
                  {new Date(pr.date).toLocaleDateString()}
                </p>
              </div>
            ))
          )}
        </div>

        <div>
          <h2 style={{ marginBottom: '15px' }}>Recent WODs</h2>
          {recentWODs.length === 0 ? (
            <div className="empty-state">
              <h3>No WOD results yet</h3>
              <p>Log your first workout!</p>
              <Link to="/wods" className="btn" style={{ marginTop: '15px' }}>
                Add First Result
              </Link>
            </div>
          ) : (
            recentWODs.map(wod => (
              <div key={wod.id} className="card">
                <h3>{wod.wod_name}</h3>
                <p>
                  {wod.format === 'For Time' && wod.time_sec && (
                    <>Time: {Math.floor(wod.time_sec / 60)}:{(wod.time_sec % 60).toString().padStart(2, '0')}</>
                  )}
                  {wod.format === 'AMRAP' && (
                    <>Rounds: {wod.rounds} + {wod.extra_reps}</>
                  )}
                  <span className="badge" style={{ marginLeft: '10px' }}>{wod.rx_scaled}</span>
                </p>
                <p style={{ fontSize: '14px', color: '#999', marginTop: '8px' }}>
                  {new Date(wod.date).toLocaleDateString()}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;