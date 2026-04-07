import React, { useEffect, useState } from 'react';
import { cancelOrder, confirmOrder } from '../api/app';
import Navbar from '../components/Navbar';
import { getOrderCache, saveOrderCache } from '../utils/storage';
import './Orders.css';

const statusMap = {
  pending: { text: '已创建', className: 'status-pending' },
  confirmed: { text: '已确认', className: 'status-confirmed' },
  cancelled: { text: '已取消', className: 'status-cancelled' },
};

const Orders = ({ auth, cartCount, onLogout }) => {
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
      setError(err.message || '订单操作失败');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="orders-container">
      <Navbar auth={auth} cartCount={cartCount} onOpenCart={() => {}} onLogout={onLogout} />

      <div className="orders-header">
        <h1>我的订单</h1>
        <p>当前订单列表来自前端缓存，并与确认/取消接口联动。</p>
      </div>

      {error && <div className="orders-message orders-error">{error}</div>}

      <div className="orders-list">
        {orders.length === 0 ? (
          <div className="orders-message">暂无订单，先去推荐页下单。</div>
        ) : (
          orders.map((order) => (
            <div key={order.orderId} className="order-card">
              <div className="order-card-header">
                <div className="order-meta">
                  <span className="order-date">{order.date}</span>
                  <span className="order-id">订单号 #{order.orderId}</span>
                </div>
                <div className={`status-badge ${statusMap[order.status]?.className || 'status-pending'}`}>
                  {statusMap[order.status]?.text || '未知状态'}
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
                  <span>总蛋白质</span>
                  <strong>{order.totalProtein} g</strong>
                </div>
                <div className="order-total">
                  <span>总热量</span>
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
                    确认订单
                  </button>
                  <button
                    type="button"
                    className="order-action cancel-action"
                    disabled={busyId === order.orderId}
                    onClick={() => handleStatusChange(order.orderId, 'cancel')}
                  >
                    取消订单
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
