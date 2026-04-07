import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { login, register } from '../api/app';
import { saveSession } from '../utils/storage';
import './Login.css';

const Register = ({ onRegisterSuccess }) => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    username: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      await register(form);
      const session = await login(form);
      saveSession(session);
      onRegisterSuccess?.();
      navigate('/home');
    } catch (err) {
      setError(err.message || '注册失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-blob"></div>
      <div className="login-card">
        <div className="brand-logo">🪴</div>
        <h2>注册账号</h2>
        <p>注册后会自动登录并进入推荐页</p>

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <input
              type="text"
              placeholder="用户名"
              value={form.username}
              onChange={(e) => setForm((current) => ({ ...current, username: e.target.value }))}
              required
            />
          </div>
          <div className="input-group">
            <input
              type="password"
              placeholder="密码"
              value={form.password}
              onChange={(e) => setForm((current) => ({ ...current, password: e.target.value }))}
              required
            />
          </div>
          {error && <p className="login-error">{error}</p>}
          <button type="submit" disabled={loading}>
            {loading ? '注册中...' : '完成注册'}
          </button>
        </form>

        <div className="login-footer">
          <Link to="/login" className="register-link">
            已有账号？返回登录
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
