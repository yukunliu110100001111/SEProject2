import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createOrder } from '../api/app';
import { getOrderCache, saveOrderCache } from '../utils/storage';
import './CartDrawer.css';

const CartDrawer = ({ isOpen, onClose, cart, onUpdateQuantity, onClearCart, auth }) => {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const totalCalories = cart.reduce((sum, item) => sum + item.calories * item.quantity, 0);
  const totalProtein = cart.reduce((sum, item) => sum + item.protein * item.quantity, 0);

  const handleCheckout = async () => {
    if (cart.length === 0 || submitting) {
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const response = await createOrder({
        userId: Number(auth.userId),
        items: cart.map((item) => ({
          mealId: item.mealId,
          quantity: item.quantity,
        })),
      });

      const newOrder = {
        orderId: response.orderId,
        status: response.status,
        date: new Date().toISOString(),
        items: cart,
        totalCalories,
        totalProtein,
      };

      saveOrderCache([newOrder, ...getOrderCache()]);
      onClearCart();
      onClose();
      navigate('/orders');
    } catch (err) {
      setError(err.message || '订单提交失败');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={`cart-overlay ${isOpen ? 'open' : ''}`}>
      <div className="cart-click-area" onClick={onClose}></div>

      <aside className="cart-drawer">
        <div className="cart-header">
          <h2>待提交订单</h2>
          <button className="close-btn" type="button" onClick={onClose}>
            &times;
          </button>
        </div>

        <div className="cart-items">
          {cart.length === 0 ? (
            <div className="empty-cart">
              <p>餐车为空</p>
            </div>
          ) : (
            cart.map((item) => (
              <div key={item.mealId} className="cart-item">
                <div className="item-info">
                  <h4>{item.name}</h4>
                  <p>环保分 {item.sustainabilityScore ?? '-'}/10</p>
                  <div className="item-stats">
                    <span>🔥 {item.calories} kcal</span>
                    <span>💪 {item.protein}g</span>
                  </div>
                </div>
                <div className="quantity-controls">
                  <button
                    className="qty-btn"
                    type="button"
                    onClick={() => onUpdateQuantity(item.mealId, -1)}
                  >
                    −
                  </button>
                  <span className="qty-number">{item.quantity}</span>
                  <button
                    className="qty-btn"
                    type="button"
                    onClick={() => onUpdateQuantity(item.mealId, 1)}
                  >
                    +
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="cart-footer">
          <div className="summary-row">
            <span>总热量</span>
            <strong>{totalCalories} kcal</strong>
          </div>
          <div className="summary-row summary-total">
            <span>总蛋白</span>
            <strong>{totalProtein} g</strong>
          </div>
          {error && <p className="cart-error">{error}</p>}
          <button
            className="checkout-btn"
            type="button"
            disabled={cart.length === 0 || submitting}
            onClick={handleCheckout}
          >
            {submitting ? '提交中...' : '提交订单'}
          </button>
        </div>
      </aside>
    </div>
  );
};

export default CartDrawer;
