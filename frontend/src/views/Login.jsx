import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.css';

const Login = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    setLoading(true);

    // 模拟 API 请求延迟
    setTimeout(() => {
      if (username === 'admin' || username === 'customer1') {
        // 【关键步骤】：登录前先清空旧数据，确保环境纯净
        localStorage.clear();

        // 模拟 API 响应：严格遵循文档 2.1 节返回的字段
        const mockResponse = {
          userId: username === 'admin' ? 99 : 1,
          username: username,
          role: username === 'admin' ? 'admin' : 'customer',
          token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." // 模拟一个长 Token
        };

        // 写入存储，供 request.js 拦截器使用
        localStorage.setItem('greenbite_token', mockResponse.token);
        localStorage.setItem('greenbite_role', mockResponse.role);
        localStorage.setItem('greenbite_userId', mockResponse.userId);
        localStorage.setItem('greenbite_username', mockResponse.username);

        // 通知 App.jsx 更新 isAuthenticated 状态
        if (onLoginSuccess) onLoginSuccess();

        // 【分流逻辑】：管理员直接进后台，普通用户进首页
        if (mockResponse.role === 'admin') {
          navigate('/dashboard');
        } else {
          navigate('/home');
        }
      } else {
        alert("请输入正确的测试账号：\n用户：customer1 / 123456\n管理：admin / 123456");
      }
      setLoading(false);
    }, 800);
  };

  return (
    <div className="login-container">
      {/* 装饰性背景光晕 */}
      <div className="login-blob"></div>

      <div className="login-card">
        <div className="brand-logo">🍃</div>
        <h2>欢迎回来</h2>
        <p>让每一口食物都为地球注入活力</p>

        <form onSubmit={handleLogin}>
          <div className="input-group">
            <input
              type="text"
              placeholder="用户名"
              value={username}
              onChange={e => setUsername(e.target.value)}
              required
            />
          </div>
          <div className="input-group">
            <input
              type="password"
              placeholder="密码"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" disabled={loading}>
            {loading ? '同步神经链路...' : '进入绿洲'}
          </button>
        </form>

        <div className="login-footer">
          测试账号: <span>customer1</span> 或 <span>admin</span> <br/>
          默认密码: 123456
        </div>
      </div>
    </div>
  );
};

export default Login;