import React, { useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2, Leaf, Lock, ShieldCheck, Sparkles, User } from 'lucide-react';
import { login, register } from '../api/app';
import AuthFloatingBubbles from '../components/AuthFloatingBubbles';
import { InteractiveMonsters } from '../components/monsters/InteractiveMonsters';
import PasswordField from '../components/PasswordField';
import { useI18n } from '../i18n';
import { saveSession } from '../utils/storage';
import { pickAuthBubbleMeals } from '../utils/authBubbleMeals';
import './Login.css';

const isPasswordStrong = (password) =>
  password.length >= 8 &&
  /[a-z]/.test(password) &&
  /[A-Z]/.test(password) &&
  /\d/.test(password);

const getPasswordStrength = (password) => {
  const checks = [
    password.length >= 8,
    /[a-z]/.test(password),
    /[A-Z]/.test(password),
    /\d/.test(password),
  ];
  return checks.filter(Boolean).length;
};

const Register = ({ onRegisterSuccess }) => {
  const { language, setLanguage, t } = useI18n();
  const [form, setForm] = useState({
    username: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isFormFocused, setIsFormFocused] = useState(false);
  const [capsLockOn, setCapsLockOn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const blurTimeoutRef = useRef(null);
  const passwordInputRef = useRef(null);
  const bubbleMeals = useMemo(() => pickAuthBubbleMeals(3), []);
  const passwordStrength = getPasswordStrength(form.password);
  const passwordStrengthLabel =
    passwordStrength >= 4 ? t('strengthStrong') : passwordStrength >= 2 ? t('strengthFair') : t('strengthWeak');
  const completionCount = Number(Boolean(form.username.trim())) + Number(passwordStrength >= 4);

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

  const handlePasswordKey = (event) => {
    setCapsLockOn(Boolean(event.getModifierState?.('CapsLock')));
  };

  const handleChange = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
    setFieldErrors((current) => ({ ...current, [key]: '' }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const nextFieldErrors = {
      username: form.username.trim() ? '' : t('usernameRequired'),
      password: form.password ? '' : t('passwordRequired'),
    };
    setFieldErrors(nextFieldErrors);
    if (nextFieldErrors.username || nextFieldErrors.password) {
      return;
    }

    if (!isPasswordStrong(form.password)) {
      setError(t('passwordRule'));
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
      setError(err.message || t('signUpFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-background-brand" aria-hidden="true">
        G<span>r</span>een<span>B</span>ite
      </div>
      <button
        className="auth-language-toggle"
        type="button"
        onClick={() => setLanguage(language === 'en' ? 'zh' : 'en')}
        aria-label={t('language')}
      >
        {language === 'en' ? '中文' : 'EN'}
      </button>
      <div className="login-blob"></div>
      <AuthFloatingBubbles labels={bubbleMeals} />
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
          <div className="login-card-glow login-card-glow-top" aria-hidden="true"></div>
          <div className="login-card-glow login-card-glow-bottom" aria-hidden="true"></div>

          <div className="login-card-head">
            <div className="brand-logo">🪴</div>
            <div className="login-heading-group">
              <span className="login-eyebrow">{t('createAccountEyebrow')}</span>
              <h2>{t('createAccountTitle')}</h2>
              <p>{t('registerSubtitle')}</p>
            </div>
          </div>

          <div className="auth-benefits" aria-hidden="true">
            <span><Sparkles size={14} />{t('smartPicks')}</span>
            <span><Leaf size={14} />{t('lowerWaste')}</span>
            <span><ShieldCheck size={14} />{t('secureAccess')}</span>
          </div>

          <div className="auth-progress" aria-live="polite">
            <span>{t('formProgress', { count: completionCount })}</span>
            <div className="auth-progress-dots">
              <i className={form.username.trim() ? 'ready' : ''}></i>
              <i className={passwordStrength >= 4 ? 'ready' : ''}></i>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="login-form" noValidate>
            <div className={`input-group ${fieldErrors.username ? 'has-error' : ''}`}>
              <span className="input-icon"><User size={17} /></span>
              <span className="input-label">{t('username')}</span>
              <input
                type="text"
                placeholder={t('username')}
                value={form.username}
                onChange={(e) => handleChange('username', e.target.value)}
                onFocus={handleFocus}
                onBlur={handleBlur}
                required
              />
              {form.username.trim() && (
                <span className="input-ready" title={t('usernameReady')}>
                  <CheckCircle2 size={16} />
                </span>
              )}
              <span className={fieldErrors.username ? 'input-error' : 'input-helper'}>
                {fieldErrors.username || t('registerUsernameHint')}
              </span>
            </div>
            <div className={`input-group ${fieldErrors.password ? 'has-error' : ''}`}>
              <span className="input-icon"><Lock size={17} /></span>
              <span className="input-label">{t('password')}</span>
              <PasswordField
                placeholder={t('password')}
                value={form.password}
                onChange={(e) => handleChange('password', e.target.value)}
                visible={showPassword}
                inputRef={passwordInputRef}
                onFocus={handleFocus}
                onBlur={handleBlur}
                onKeyUp={handlePasswordKey}
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
              <div className={`password-strength strength-${Math.min(passwordStrength, 4)}`}>
                <div className="password-strength-head">
                  <span>{t('passwordStrength')}</span>
                  <strong>{passwordStrengthLabel}</strong>
                </div>
                <div className="password-strength-bars" aria-hidden="true">
                  {[1, 2, 3, 4].map((step) => (
                    <i key={step} className={passwordStrength >= step ? 'active' : ''}></i>
                  ))}
                </div>
              </div>
              {capsLockOn && <span className="caps-lock-hint">{t('capsLockOn')}</span>}
              <span className={fieldErrors.password ? 'input-error' : 'input-helper'}>
                {fieldErrors.password || t('registerPasswordHint')}
              </span>
              <span className="password-hint">{t('passwordRule')}</span>
            </div>
            {error && <p className="login-error">{error}</p>}
            <button type="submit" disabled={loading} className={loading ? 'is-loading' : ''}>
              <span>{loading ? t('creating') : t('createAccountTitle')}</span>
              {loading ? <i className="submit-spinner"></i> : <ArrowRight size={18} />}
            </button>
          </form>

          <div className="login-footer">
            <Link to="/login" className="register-link">
              {t('backToSignIn')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
