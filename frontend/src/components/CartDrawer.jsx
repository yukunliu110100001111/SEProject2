import React from 'react';
import { useNavigate } from 'react-router-dom';
import './CartDrawer.css';

const CartDrawer = ({ isOpen, onClose, cart, onUpdateQuantity, onClearCart }) => {
  const navigate = useNavigate();

  // 计算健康汇总数据
  const totalCalories = cart.reduce((sum, item) => sum + (item.calories * item.quantity), 0);
  const totalProtein = cart.reduce((sum, item) => sum + (item.protein * item.quantity), 0);

  const handleCheckout = () => {
    if (cart.length === 0) return;

    // 【关键修正 1】：从 localStorage 获取真实 userId
    // 不能写死为 1，否则 customer99 下单也会变成用户 1 的订单
    const currentUserId = localStorage.getItem('greenbite_userId');

    // 【关键修正 2】：严格按照 POST /orders 请求体定义
    // 文档结构是：{ "mealId": 1, "quantity": 2 } 的数组
    const orderPayload = {
      userId: Number(currentUserId),
      items: cart.map(item => ({
        mealId: item.mealId,
        quantity: item.quantity
      }))
    };

    console.log("🚀 API 请求发送中...", orderPayload);

    // 【模拟后端响应逻辑】
    const mockOrderId = Math.floor(Math.random() * 10000) + 1000;

    // 将订单存入模拟数据库，状态必须为 "pending"
    const newOrder = {
      orderId: mockOrderId,
      date: new Date().toISOString(), // 建议使用标准 ISO 时间格式
      status: "pending",
      items: [...cart],
      totalCalories,
      totalProtein
    };

    const existingOrders = JSON.parse(localStorage.getItem('greenbite_mock_orders')) || [];
    localStorage.setItem('greenbite_mock_orders', JSON.stringify([newOrder, ...existingOrders]));

    alert(`🎉 订单已提交！单号：#${mockOrderId}\n您的健康目标正在同步中...`);

    onClearCart();
    onClose();
    // 下单成功后跳转到订单列表页
    navigate('/orders');
  };

  return (
    <div className={`cart-overlay ${isOpen ? 'open' : ''}`}>
      {/* 点击遮罩层关闭 */}
      <div className="cart-click-area" onClick={onClose}></div>

      <div className="cart-drawer">
        <div className="cart-header">
          <h2>🛒 我的绿洲餐盒</h2>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>

        <div className="cart-items">
          {cart.length === 0 ? (
            <div className="empty-cart">
              <p>您的餐盒空空如也，快去挑点好吃的吧！🍃</p>
            </div>
          ) : (
            cart.map((item) => (
              <div key={item.mealId} className="cart-item">
                <div className="item-info">
                  <h4>{item.name}</h4>
                  <p>🌍 环保评分: {item.sustainabilityScore}/10</p>
                  <div className="item-stats">
                    <span>🔥 {item.calories} kcal</span>
                    <span>💪 {item.protein}g 蛋白</span>
                  </div>
                </div>
                <div className="quantity-controls">
                  <button className="qty-btn" onClick={() => onUpdateQuantity(item.mealId, -1)}>−</button>
                  <span className="qty-number">{item.quantity}</span>
                  <button className="qty-btn" onClick={() => onUpdateQuantity(item.mealId, 1)}>+</button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="cart-footer">
          <div className="summary-row">
            <span>总计热量：</span><strong>{totalCalories} kcal</strong>
          </div>
          <div className="summary-row summary-total">
            <span>总蛋白质：</span><strong>{totalProtein} g</strong>
          </div>
          {/* 文档中虽然没提价格，但为了用户体验，我们可以加个提示：环保餐点，健康无价 */}
          <button
            className="checkout-btn"
            onClick={handleCheckout}
            disabled={cart.length === 0}
          >
            确认提交 (POST /orders)
          </button>
        </div>
      </div>
    </div>
  );
};

export default CartDrawer;