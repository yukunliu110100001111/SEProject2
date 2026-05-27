import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  BarChart3,
  FileText,
  Leaf,
  MousePointerClick,
  PackageSearch,
  ShoppingBag,
  Target,
  TrendingUp,
} from 'lucide-react';
import { getDashboard, getSustainabilityReport } from '../api/app';
import Navbar from '../components/Navbar';
import { useI18n } from '../i18n';
import './Dashboard.css';

const getMealOrderCount = (meal) => meal.orders ?? meal.orderCount ?? meal.count ?? 0;
const asArray = (value) => (Array.isArray(value) ? value : []);
const toPercent = (value) => `${Math.round(Number(value || 0) * 100)}%`;
const toNumber = (value) => Number(value || 0).toLocaleString();
const currentQty = (item) =>
  item.currentqty ?? item.currentQty ?? item.currentQty_g ?? item.currentqty_g ?? item.quantity ?? 0;
const expiryDate = (item) => item.expirydate ?? item.expiryDate ?? item.expiry ?? null;

const MetricCard = ({ icon, label, value, detail }) => (
  <div className="metric-card">
    <div className="metric-icon" aria-hidden="true">
      {React.createElement(icon, { size: 18 })}
    </div>
    <div>
      <p>{label}</p>
      <strong>{value}</strong>
      {detail && <span>{detail}</span>}
    </div>
  </div>
);

const RankedList = ({ items, valueLabel, emptyText }) => (
  <div className="rank-list">
    {items.length === 0 && <p className="empty-state">{emptyText}</p>}
    {items.slice(0, 5).map((meal, index) => (
      <div key={`${meal.name}-${index}`} className="rank-item">
        <span className="rank-number">{String(index + 1).padStart(2, '0')}</span>
        <div className="rank-info">
          <div className="rank-name">{meal.name}</div>
          <div className="rank-count">{valueLabel(getMealOrderCount(meal))}</div>
        </div>
      </div>
    ))}
  </div>
);

const Dashboard = ({ auth, cartCount, onOpenCart, onLogout }) => {
  const { t } = useI18n();
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
          setError(err.message || t('failedLoadDashboard'));
        }
      }
    };

    loadDashboard();
    return () => {
      active = false;
    };
  }, [t]);

  const handleLoadReport = async () => {
    setLoadingReport(true);
    setReportError('');
    try {
      const nextReport = await getSustainabilityReport();
      setReport(nextReport);
    } catch (err) {
      setReportError(err.message || t('failedGenerateReport'));
    } finally {
      setLoadingReport(false);
    }
  };

  const dashboard = data || {};
  const topMeals = asArray(dashboard.topMeals);
  const stockUsage = asArray(dashboard.stockUsage);
  const analytics = dashboard.recommendationAnalytics || {};
  const topRecommended = asArray(dashboard.topRecommendedMeals || analytics.topRecommendedMeals);
  const topClicked = asArray(dashboard.topClickedMeals || analytics.topClickedMeals);
  const topSelected = asArray(dashboard.topSelectedMeals || analytics.topSelectedMeals);
  const positionPerformance = asArray(analytics.positionPerformance);
  const highStock = asArray(dashboard.highStockIngredients);
  const nearExpiry = asArray(dashboard.nearExpiryIngredients);
  const reportTopMeals = asArray(report?.topMeals);
  const reportHighStock = asArray(report?.highStockIngredients);
  const reportNearExpiry = asArray(report?.nearExpiryIngredients);

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
        <div>
          <h1>{t('operationsDashboard')}</h1>
          <p>{t('dashboardSubtitle')}</p>
        </div>
      </div>

      {error && <div className="dashboard-message error-message">{error}</div>}

      {data && (
        <>
          <section className="metric-grid" aria-label={t('dashboardKpis')}>
            <MetricCard
              icon={Leaf}
              label={t('lowCarbonAdoption')}
              value={toPercent(dashboard.lowCarbonRate)}
              detail={t('lowCarbonSelections', { count: toNumber(dashboard.lowCarbonSelectionCount) })}
            />
            <MetricCard
              icon={BarChart3}
              label={t('recommendationExposure')}
              value={toNumber(analytics.totalExposureCount)}
              detail={t('recommendationRange', {
                start: analytics.rangeStart || '-',
                end: analytics.rangeEnd || '-',
              })}
            />
            <MetricCard
              icon={MousePointerClick}
              label={t('clickThroughRate')}
              value={toPercent(analytics.clickThroughRate)}
              detail={t('clicksCount', { count: toNumber(analytics.totalClickCount) })}
            />
            <MetricCard
              icon={Target}
              label={t('selectionRate')}
              value={toPercent(analytics.selectionRate)}
              detail={t('selectedCount', { count: toNumber(analytics.totalSelectedCount) })}
            />
          </section>

          <div className="dashboard-grid">
            <div className="admin-card stats-card">
              <div className="card-title">
                <Leaf size={18} />
                <h2>{t('lowCarbonAdoption')}</h2>
              </div>
              <div className="gauge-container">
                <div className="gauge-value">{toPercent(dashboard.lowCarbonRate)}</div>
              <div className="gauge-bar">
                <div
                  className="gauge-fill"
                  style={{ width: toPercent(dashboard.lowCarbonRate) }}
                ></div>
              </div>
                <p className="gauge-desc">{t('lowCarbonSelections', { count: toNumber(dashboard.lowCarbonSelectionCount) })}</p>
            </div>
          </div>

          <div className="admin-card">
            <div className="card-title">
              <ShoppingBag size={18} />
              <h2>{t('topMeals')}</h2>
            </div>
            <RankedList
              items={topMeals}
              valueLabel={(count) => `${count} ${t('ordersUnit')}`}
              emptyText={t('noDashboardData')}
            />
          </div>

          <div className="admin-card">
            <div className="card-title">
              <PackageSearch size={18} />
              <h2>{t('inventoryStatus')}</h2>
            </div>
            <div className="stock-list">
              {stockUsage.length === 0 && <p className="empty-state">{t('noDashboardData')}</p>}
              {stockUsage.slice(0, 6).map((item, index) => (
                <div key={`${item.name}-${index}`} className="stock-item">
                  <div className="stock-meta">
                    <span className="stock-name">{item.name}</span>
                    <span className={`stock-qty ${item.stockStatus || 'normal'}`}>
                      {currentQty(item)} g
                    </span>
                  </div>
                  <div className="stock-progress-bg">
                    <div
                      className={`stock-progress-fill ${item.stockStatus || 'normal'}`}
                      style={{
                        width: `${Math.min((currentQty(item) / 6000) * 100, 100)}%`,
                      }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

            <div className="admin-card wide-card">
              <div className="card-title">
                <TrendingUp size={18} />
                <h2>{t('recommendationAnalytics')}</h2>
              </div>
              <div className="analytics-columns">
                <section>
                  <h3>{t('topRecommended')}</h3>
                  <RankedList
                    items={topRecommended}
                    valueLabel={(count) => t('exposuresCount', { count })}
                    emptyText={t('noDashboardData')}
                  />
                </section>
                <section>
                  <h3>{t('topClicked')}</h3>
                  <RankedList
                    items={topClicked}
                    valueLabel={(count) => t('clicksCount', { count })}
                    emptyText={t('noDashboardData')}
                  />
                </section>
                <section>
                  <h3>{t('topSelected')}</h3>
                  <RankedList
                    items={topSelected}
                    valueLabel={(count) => t('selectedCount', { count })}
                    emptyText={t('noDashboardData')}
                  />
                </section>
              </div>
              {positionPerformance.length > 0 && (
                <div className="position-strip" aria-label={t('positionPerformance')}>
                  {positionPerformance.slice(0, 6).map((item, index) => (
                    <div key={`${item.rankPosition || index}-${index}`} className="position-pill">
                      <span>{t('rankPosition', { rank: item.rankPosition ?? index + 1 })}</span>
                      <strong>{toPercent(item.clickThroughRate)}</strong>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="admin-card wide-card">
              <div className="card-title">
                <AlertTriangle size={18} />
                <h2>{t('inventoryRisk')}</h2>
              </div>
              <div className="risk-grid">
                <section>
                  <h3>{t('highStockIngredients')}</h3>
                  {highStock.length === 0 && <p className="empty-state">{t('noDashboardData')}</p>}
                  {highStock.slice(0, 5).map((item, index) => (
                    <div className="risk-row" key={`${item.name}-${index}`}>
                      <span>{item.name}</span>
                      <strong>{currentQty(item)} g</strong>
                    </div>
                  ))}
                </section>
                <section>
                  <h3>{t('nearExpiryIngredients')}</h3>
                  {nearExpiry.length === 0 && <p className="empty-state">{t('noDashboardData')}</p>}
                  {nearExpiry.slice(0, 5).map((item, index) => (
                    <div className="risk-row urgent" key={`${item.name}-${index}`}>
                      <span>{item.name}</span>
                      <strong>{expiryDate(item) || '-'}</strong>
                    </div>
                  ))}
                </section>
              </div>
            </div>
        </div>
        </>
      )}

      <div className="report-panel">
        <div className="report-header">
          <div>
            <h2>{t('sustainabilityReport')}</h2>
            <p>{t('reportDescription')}</p>
          </div>
          <button className="report-btn" type="button" onClick={handleLoadReport} disabled={loadingReport}>
            <FileText size={18} />
            {loadingReport ? t('generating') : t('generateReport')}
          </button>
        </div>
        {reportError && <p className="dashboard-message error-message">{reportError}</p>}
        {report && (
          <div className="report-card">
            <div className="report-meta">
              <span>{t('reportId')}: #{report.reportId || '-'}</span>
              <span>{report.rangeStart || '-'} - {report.rangeEnd || '-'}</span>
              <span>{report.generatedAt}</span>
            </div>
            <p className="report-summary">{report.summary}</p>
            <div className="report-grid">
              <MetricCard
                icon={Leaf}
                label={t('lowCarbonAdoption')}
                value={toPercent(report.lowCarbonRate)}
                detail={t('lowCarbonSelections', { count: toNumber(report.lowCarbonSelectionCount) })}
              />
              <MetricCard
                icon={MousePointerClick}
                label={t('clickThroughRate')}
                value={toPercent(report.recommendationAnalytics?.clickThroughRate)}
                detail={t('recommendationExposureShort', {
                  count: toNumber(report.recommendationAnalytics?.totalExposureCount),
                })}
              />
              <MetricCard
                icon={AlertTriangle}
                label={t('inventoryRisk')}
                value={toNumber(reportHighStock.length + reportNearExpiry.length)}
                detail={t('riskItems')}
              />
            </div>
            <div className="report-lists">
              <section>
                <h3>{t('topMeals')}</h3>
                <RankedList
                  items={reportTopMeals}
                  valueLabel={(count) => `${count} ${t('ordersUnit')}`}
                  emptyText={t('noDashboardData')}
                />
              </section>
              <section>
                <h3>{t('inventoryRisk')}</h3>
                {[...reportNearExpiry.slice(0, 3), ...reportHighStock.slice(0, 3)].length === 0 && (
                  <p className="empty-state">{t('noDashboardData')}</p>
                )}
                {[...reportNearExpiry.slice(0, 3), ...reportHighStock.slice(0, 3)].map((item, index) => (
                  <div className="risk-row" key={`${item.name}-${index}`}>
                    <span>{item.name}</span>
                    <strong>{expiryDate(item) || `${currentQty(item)} g`}</strong>
                  </div>
                ))}
              </section>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
