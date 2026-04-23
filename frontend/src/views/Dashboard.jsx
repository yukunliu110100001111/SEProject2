import React, { useEffect, useState } from 'react';
import { getDashboard, getSustainabilityReport } from '../api/app';
import Navbar from '../components/Navbar';
import './Dashboard.css';

const Dashboard = ({ auth, cartCount, onOpenCart, onLogout }) => {
  const [data, setData] = useState(null);
  const [report, setReport] = useState(null);
  const [error, setError] = useState('');
  const [reportError, setReportError] = useState('');
  const [loadingReport, setLoadingReport] = useState(false);

  useEffect(() => {
    let active = true;

    const loadDashboard = async () => {
      try {
        const dashboard = await getDashboard();
        if (active) {
          setData(dashboard);
        }
      } catch (err) {
        if (active) {
          setError(err.message || 'Failed to load dashboard.');
        }
      }
    };

    loadDashboard();
    return () => {
      active = false;
    };
  }, []);

  const handleLoadReport = async () => {
    setLoadingReport(true);
    setReportError('');
    try {
      const nextReport = await getSustainabilityReport();
      setReport(nextReport);
    } catch (err) {
      setReportError(err.message || 'Failed to generate report.');
    } finally {
      setLoadingReport(false);
    }
  };

  if (!data && !error) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <Navbar auth={auth} cartCount={cartCount} onOpenCart={onOpenCart} onLogout={onLogout} />

      <div className="dashboard-header">
        <h1>Operations dashboard</h1>
      </div>

      {error && <div className="dashboard-message error-message">{error}</div>}

      {data && (
        <div className="dashboard-grid">
          <div className="admin-card stats-card">
            <h2>Low-carbon adoption</h2>
            <div className="gauge-container">
              <div className="gauge-value">{Math.round(Number(data.lowCarbonRate || 0) * 100)}%</div>
              <div className="gauge-bar">
                <div
                  className="gauge-fill"
                  style={{ width: `${Math.round(Number(data.lowCarbonRate || 0) * 100)}%` }}
                ></div>
              </div>
            </div>
          </div>

          <div className="admin-card">
            <h2>Top Meals</h2>
            <div className="rank-list">
              {data.topMeals.map((meal, index) => (
                <div key={`${meal.name}-${index}`} className="rank-item">
                  <span className="rank-number">0{index + 1}</span>
                  <div className="rank-info">
                    <div className="rank-name">{meal.name}</div>
                    <div className="rank-count">{meal.orders ?? meal.orderCount ?? 0} orders</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="admin-card">
            <h2>Inventory status</h2>
            <div className="stock-list">
              {data.stockUsage.map((item, index) => (
                <div key={`${item.name}-${index}`} className="stock-item">
                  <div className="stock-meta">
                    <span className="stock-name">{item.name}</span>
                    <span className={`stock-qty ${item.stockStatus || 'normal'}`}>
                      {item.currentqty ?? item.currentQty ?? 0} g
                    </span>
                  </div>
                  <div className="stock-progress-bg">
                    <div
                      className={`stock-progress-fill ${item.stockStatus || 'normal'}`}
                      style={{
                        width: `${Math.min(((item.currentqty ?? item.currentQty ?? 0) / 6000) * 100, 100)}%`,
                      }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="report-panel">
        <button className="report-btn" type="button" onClick={handleLoadReport} disabled={loadingReport}>
          {loadingReport ? 'Generating...' : 'Generate sustainability report'}
        </button>
        {reportError && <p className="dashboard-message error-message">{reportError}</p>}
        {report && (
          <div className="report-card">
            <h3>Report</h3>
            <p>{report.generatedAt}</p>
            <p>{report.summary}</p>
            <p>{Math.round(Number(report.lowCarbonRate || 0) * 100)}%</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
