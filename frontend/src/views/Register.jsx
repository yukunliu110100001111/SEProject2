import React, { useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { login, register } from '../api/app';
import { InteractiveMonsters } from '../components/monsters/InteractiveMonsters';
import PasswordField from '../components/PasswordField';
import { saveSession } from '../utils/storage';
import { pickAuthBubbleMeals } from '../utils/authBubbleMeals';
import './Login.css';

const passwordComplexityMessage =
  'Password must be at least 8 characters and include uppercase, lowercase, and a number.';

const isPasswordStrong = (password) =>
  password.length >= 8 &&
  /[a-z]/.test(password) &&
  /[A-Z]/.test(password) &&
  /\d/.test(password);

const Register = ({ onRegisterSuccess }) => {
  const [form, setForm] = useState({
    username: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isFormFocused, setIsFormFocused] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const blurTimeoutRef = useRef(null);
  const passwordInputRef = useRef(null);
  const bubbleMeals = useMemo(() => pickAuthBubbleMeals(3), []);

  const handleFocus = () => {
    if (blurTimeoutRef.current !== null) {
      clearTimeout(blurTimeoutRef.current);
      blurTimeoutRef.current = null;
    }
    setIsFormFocused(true);
  };

  const handleBlur = () => {
    blurTimeoutRef.current = window.setTimeout(() => {
      setIsFormFocused(false);
    }, 100);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!isPasswordStrong(form.password)) {
      setError(passwordComplexityMessage);
      return;
    }

    setLoading(true);
    setError('');

    try {
      await register(form);
      const session = await login(form);
      saveSession(session);
      onRegisterSuccess?.(
        session.role === 'admin' ? '/dashboard' : session.role === 'staff' ? '/staff' : '/home'
      );
    } catch (err) {
      setError(err.message || 'Sign-up failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-background-brand" aria-hidden="true">
        G<span>r</span>een<span>B</span>ite
      </div>
      <div className="login-blob"></div>
      <div className="login-shell">
        <div className="monster-panel">
          <div className="monster-stage">
            <InteractiveMonsters
              isFormFocused={isFormFocused}
              isPasswordVisible={showPassword}
            />
          </div>
        </div>

        <div className="login-card">
          <div className="login-card-bubbles" aria-hidden="true">
            <span className="login-card-bubble bubble-a">{bubbleMeals[0]}</span>
            <span className="login-card-bubble bubble-b">{bubbleMeals[1]}</span>
            <span className="login-card-bubble bubble-c">{bubbleMeals[2]}</span>
          </div>
          <div className="login-card-glow login-card-glow-top" aria-hidden="true"></div>
          <div className="login-card-glow login-card-glow-bottom" aria-hidden="true"></div>

          <div className="login-card-head">
            <div className="brand-logo">🪴</div>
            <div className="login-heading-group">
              <span className="login-eyebrow">Create Account</span>
              <h2>Create account</h2>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="login-form">
            <div className="input-group">
              <span className="input-label">Username</span>
              <input
                type="text"
                placeholder="Username"
                value={form.username}
                onChange={(e) => setForm((current) => ({ ...current, username: e.target.value }))}
                onFocus={handleFocus}
                onBlur={handleBlur}
                required
              />
            </div>
            <div className="input-group">
              <span className="input-label">Password</span>
              <PasswordField
                placeholder="Password"
                value={form.password}
                onChange={(e) => setForm((current) => ({ ...current, password: e.target.value }))}
                visible={showPassword}
                inputRef={passwordInputRef}
                onFocus={handleFocus}
                onBlur={handleBlur}
                onToggle={() => {
                  setShowPassword((current) => !current);
                  const input = passwordInputRef.current;
                  if (input) {
                    input.focus();
                    setTimeout(() => {
                      input.setSelectionRange(input.value.length, input.value.length);
                    }, 0);
                  }
                }}
              />
              <span className="password-hint">{passwordComplexityMessage}</span>
            </div>
            {error && <p className="login-error">{error}</p>}
            <button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create account'}
            </button>
          </form>

          <div className="login-footer">
            <Link to="/login" className="register-link">
              Back to sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
