import React, { useEffect, useState } from 'react';
import { cancelOrder, confirmOrder } from '../api/app';
import Navbar from '../components/Navbar';
import { getOrderCache, saveOrderCache } from '../utils/storage';
import './Orders.css';

const statusMap = {
  pending: { text: 'Created', className: 'status-pending' },
  confirmed: { text: 'Confirmed', className: 'status-confirmed' },
  cancelled: { text: 'Cancelled', className: 'status-cancelled' },
};

const Orders = ({ auth, cartCount, onOpenCart, onLogout }) => {
  const [orders, setOrders] = useState([]);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    setOrders(getOrderCache());
  }, []);

  const updateCachedOrders = (updater) => {
    setOrders((current) => {
      const next = typeof updater === 'function' ? updater(current) : updater;
      saveOrderCache(next);
      return next;
    });
  };

  const handleStatusChange = async (orderId, action) => {
    setBusyId(orderId);
    setError('');

    try {
      const response = action === 'confirm' ? await confirmOrder(orderId) : await cancelOrder(orderId);
      updateCachedOrders((current) =>
        current.map((order) =>
          order.orderId === orderId ? { ...order, status: response.status } : order
        )
      );
    } catch (err) {
      setError(err.message || 'Order action failed.');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="orders-container">
      <Navbar auth={auth} cartCount={cartCount} onOpenCart={onOpenCart} onLogout={onLogout} />

      <div className="orders-header">
        <h1>Orders</h1>
      </div>

      {error && <div className="orders-message orders-error">{error}</div>}

      <div className="orders-list">
        {orders.length === 0 ? (
          <div className="orders-message">No orders yet.</div>
        ) : (
          orders.map((order) => (
            <div key={order.orderId} className="order-card">
              <div className="order-card-header">
                <div className="order-meta">
                  <span className="order-date">{order.date}</span>
                  <span className="order-id">Order #{order.orderId}</span>
                </div>
                <div className={`status-badge ${statusMap[order.status]?.className || 'status-pending'}`}>
                  {statusMap[order.status]?.text || 'Unknown'}
                </div>
              </div>

              <div className="order-items">
                {order.items.map((item) => (
                  <div key={`${order.orderId}-${item.mealId}`} className="order-item-row">
                    <div className="order-item-name">
                      {item.name} <span>x {item.quantity}</span>
                    </div>
                    <div className="order-item-price">🔥 {item.calories * item.quantity} kcal</div>
                  </div>
                ))}
              </div>

              <div className="order-card-footer">
                <div className="order-carbon">
                  <span>Total protein</span>
                  <strong>{order.totalProtein} g</strong>
                </div>
                <div className="order-total">
                  <span>Total calories</span>
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
                    Confirm order
                  </button>
                  <button
                    type="button"
                    className="order-action cancel-action"
                    disabled={busyId === order.orderId}
                    onClick={() => handleStatusChange(order.orderId, 'cancel')}
                  >
                    Cancel order
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
