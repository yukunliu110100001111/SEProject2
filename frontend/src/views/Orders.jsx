import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import './Orders.css';

const Orders = () => {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    // 读取本地的真实下单数据
    const savedOrders = JSON.parse(localStorage.getItem('greenbite_mock_orders'));

    if (savedOrders && savedOrders.length > 0) {
      setOrders(savedOrders);
    } else {
      // 兜底的假数据，严格遵守 API 的状态规范
      const initialMocks = [
        {
          orderId: 1002, // 纯数字 ID
          date: "2026-03-30 12:30",
          status: "pending", // 刚下单，等待确认
          items: [
            { name: "Chicken Salad", quantity: 1, calories: 450, protein: 30 }
          ],
          totalCalories: 450,
          totalProtein: 30
        },
        {
          orderId: 1001,
          date: "2026-03-28 18:45",
          status: "confirmed", // 已确认（已扣除库存）
          items: [
            { name: "Vegan Tofu Bowl", quantity: 2, calories: 380, protein: 25 },
            { name: "Mushroom Pasta", quantity: 1, calories: 520, protein: 15 }
          ],
          totalCalories: 1280, // 380*2 + 520
          totalProtein: 65     // 25*2 + 15
        }
      ];
      setOrders(initialMocks);
      localStorage.setItem('greenbite_mock_orders', JSON.stringify(initialMocks));
    }
  }, []);

  // 【核心修改】：严格对齐 API 规定的三种状态 [cite: 150-153]
  const statusMap = {
    pending: { text: "已创建 ⏳", className: "status-pending" },
    confirmed: { text: "已确认 ✅", className: "status-confirmed" },
    cancelled: { text: "已取消 ❌", className: "status-cancelled" }
  };

  return (
    <div className="orders-container">
      <Navbar cartCount={0} onOpenCart={() => alert('请先回首页点餐哦！')} />

      <div className="orders-header">
        <h1>我的健康账单</h1>
        <p>精准追踪每一口的营养摄入 🥗</p>
      </div>

      <div className="orders-list">
        {orders.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '50px', color: '#52796f' }}>
            暂无订单记录，快去挑选健康餐吧！
          </div>
        ) : (
          orders.map((order) => (
            <div key={order.orderId} className="order-card">

              <div className="order-card-header">
                <div className="order-meta">
                  <span className="order-date">{order.date}</span>
                  <span className="order-id">订单号：#{order.orderId}</span>
                </div>
                <div className={`status-badge ${statusMap[order.status]?.className || 'status-pending'}`}>
                  {statusMap[order.status]?.text || '未知状态'}
                </div>
              </div>

              <div className="order-items">
                {order.items.map((item, index) => (
                  <div key={index} className="order-item-row">
                    <div className="order-item-name">
                      {item.name} <span>x {item.quantity}</span>
                    </div>
                    {/* 把原先的价格换成了单品总热量 */}
                    <div className="order-item-price" style={{ color: '#52796f' }}>
                      🔥 {item.calories * item.quantity} kcal
                    </div>
                  </div>
                ))}
              </div>

              <div className="order-card-footer">
                <div className="order-carbon">
                  <span>💪 摄入蛋白质：</span>
                  <strong>{order.totalProtein} g</strong>
                </div>
                <div className="order-total">
                  <span>总计热量</span>
                  <strong>{order.totalCalories} kcal</strong>
                </div>
              </div>

            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Orders;