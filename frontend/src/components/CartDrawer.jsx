import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createOrder } from '../api/app';
import { useI18n } from '../i18n';
import { pickPageLoadingSrc } from '../utils/loadingAnimations';
import './CartDrawer.css';

const CartDrawer = ({ isOpen, onClose, cart, onUpdateQuantity, onClearCart, auth }) => {
  const { t } = useI18n();
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
      const recommendationRequestId =
        cart.find((item) => item.recommendationRequestId)?.recommendationRequestId || null;
      const response = await createOrder({
        userId: Number(auth.userId),
        recommendationRequestId,
        items: cart.map((item) => ({
          mealId: item.mealId,
          quantity: item.quantity,
        })),
      });
      onClearCart();
      onClose();
      navigate('/loading', {
        state: {
          nextPath: '/orders',
          loadingSrc: pickPageLoadingSrc(),
          routeState: { createdOrderId: response.orderId },
        },
      });
    } catch (err) {
      setError(err.message || t('orderSubmissionFailed'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={`cart-overlay ${isOpen ? 'open' : ''}`}>
      <div className="cart-click-area" onClick={onClose}></div>

      <aside className="cart-drawer">
        <div className="cart-header">
          <h2>{t('cart')}</h2>
          <button className="close-btn" type="button" onClick={onClose}>
            &times;
          </button>
        </div>

        <div className="cart-items">
          {cart.length === 0 ? (
            <div className="empty-cart">
              <p>{t('cartEmpty')}</p>
            </div>
          ) : (
            cart.map((item) => (
              <div key={item.mealId} className="cart-item">
                <div className="item-info">
                  <h4>{item.name}</h4>
                  <p>{t('sustainability')} {item.sustainabilityScore ?? '-'}/10</p>
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
            <span>{t('totalCalories')}</span>
            <strong>{totalCalories} kcal</strong>
          </div>
          <div className="summary-row summary-total">
            <span>{t('totalProtein')}</span>
            <strong>{totalProtein} g</strong>
          </div>
          {error && <p className="cart-error">{error}</p>}
          <button
            className="checkout-btn"
            type="button"
            disabled={cart.length === 0 || submitting}
            onClick={handleCheckout}
          >
            {submitting ? t('submitting') : t('placeOrder')}
          </button>
        </div>
      </aside>
    </div>
  );
};

export default CartDrawer;
