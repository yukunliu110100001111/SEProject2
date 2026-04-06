import request from './request';

// 登录接口：接收 username 和 password
export const login = (data) => {
  return request({
    url: '/auth/login',
    method: 'post',
    data: data
  });
};