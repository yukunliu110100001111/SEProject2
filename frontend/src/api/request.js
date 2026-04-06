import axios from 'axios';

// 创建 axios 实例
const service = axios.create({
  baseURL: '/api', // 配合我们之前在 vite.config.js 配置的代理
  timeout: 8000,   // 设置超时时间
});

// 请求拦截器：像给外卖贴封条一样，自动带上 Token
service.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('greenbite_token');
    if (token) {
      // 严格遵守文档 1.3 节的认证方式
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器：只把有用的“干货”给前端页面
service.interceptors.response.use(
  (response) => {
    const res = response.data;
    // 文档 1.2 节：code 200 是成功
    if (res.code === 200) {
      return res.data; // 直接返回 data 里的内容，页面就不用再多写一次 .data 了
    } else {
      // 这里可以后续接入精美的通知组件
      console.error('业务错误:', res.message);
      return Promise.reject(new Error(res.message || 'Error'));
    }
  },
  (error) => {
    console.error('网络异常:', error);
    return Promise.reject(error);
  }
);

export default service;