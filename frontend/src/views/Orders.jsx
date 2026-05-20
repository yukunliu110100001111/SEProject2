import React, { useCallback, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { cancelOrder, confirmOrder, getOrders } from '../api/app';
import Navbar from '../components/Navbar';
import { useI18n } from '../i18n';
import './Orders.css';

const statusMap = {
  pending: { textKey: 'statusCreated', className: 'status-pending' },
  confirmed: { textKey: 'statusConfirmed', className: 'status-confirmed' },
  cancelled: { textKey: 'statusCancelled', className: 'status-cancelled' },
};

const Orders = ({ auth, cartCount, onOpenCart, onLogout }) => {
  const { t } = useI18n();
  const location = useLocation();
  const [orders, setOrders] = useState([]);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const canViewAllOrders = auth.role === 'staff' || auth.role === 'admin';
      const data = await getOrders({
        ...(canViewAllOrders ? {} : { userId: auth.userId }),
        page: 1,
        size: 100,
      });
      setOrders(data.items || []);
    } catch (err) {
      setError(err.message || t('failedLoadOrders'));
    } finally {
      setLoading(false);
    }
  }, [auth.role, auth.userId, t]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const handleStatusChange = async (orderId, action) => {
    setBusyId(orderId);
    setError('');

    try {
      await (action === 'confirm' ? confirmOrder(orderId) : cancelOrder(orderId));
      await loadOrders();
    } catch (err) {
      setError(err.message || t('orderActionFailed'));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="orders-container">
      <Navbar auth={auth} cartCount={cartCount} onOpenCart={onOpenCart} onLogout={onLogout} />

      <div className="orders-header">
        <h1>{auth.role === 'staff' || auth.role === 'admin' ? t('allOrders') : t('orders')}</h1>
      </div>

      {location.state?.createdOrderId && (
        <div className="orders-message">
          {t('orderCreated', { id: location.state.createdOrderId })}
        </div>
      )}
      {error && <div className="orders-message orders-error">{error}</div>}

      <div className="orders-list">
        {loading ? (
          <div className="orders-message">{t('loadingOrders')}</div>
        ) : orders.length === 0 ? (
          <div className="orders-message">{t('noOrdersYet')}</div>
        ) : (
          orders.map((order) => (
            <div key={order.orderId} className="order-card">
              <div className="order-card-header">
                <div className="order-meta">
                  <span className="order-date">{order.createdAt || '-'}</span>
                  <span className="order-id">{t('orderNumber', { id: order.orderId })}</span>
                </div>
                <div className={`status-badge ${statusMap[order.status]?.className || 'status-pending'}`}>
                  {statusMap[order.status]?.textKey ? t(statusMap[order.status].textKey) : t('unknown')}
                </div>
              </div>

              <div className="order-items">
                {order.items.map((item) => (
                  <div key={`${order.orderId}-${item.itemId ?? item.mealId}`} className="order-item-row">
                    <div className="order-item-name">
                      {item.name} <span>x {item.quantity}</span>
                    </div>
                    <div className="order-item-price">🔥 {item.calories * item.quantity} kcal</div>
                  </div>
                ))}
              </div>

              <div className="order-card-footer">
                <div className="order-carbon">
                  <span>{t('totalProtein')}</span>
                  <strong>{order.totalProtein} g</strong>
                </div>
                <div className="order-total">
                  <span>{t('totalCalories')}</span>
                  <strong>{order.totalCalories} kcal</strong>
                </div>
              </div>

              {order.status === 'pending' && (
                <div className="order-actions">
                  <button
                    type="button"
                    className="order-action confirm-action"
                    disabled={busyId === order.orderId}
                    onClick={() => handleStatusChange(order.orderId, 'confirm')}
                  >
                    {t('confirmOrder')}
                  </button>
                  <button
                    type="button"
                    className="order-action cancel-action"
                    disabled={busyId === order.orderId}
                    onClick={() => handleStatusChange(order.orderId, 'cancel')}
                  >
                    {t('cancelOrder')}
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Orders;
