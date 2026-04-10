import request from './request';

export const login = (data) =>
  request({
    url: '/auth/login',
    method: 'post',
    data,
  });

export const register = (data) =>
  request({
    url: '/auth/register',
    method: 'post',
    data,
  });

export const getUser = (userId) =>
  request({
    url: `/users/${userId}`,
    method: 'get',
  });

export const updateUser = (userId, data) =>
  request({
    url: `/users/${userId}`,
    method: 'put',
    data,
  });

export const updatePreferences = (userId, data) =>
  request({
    url: `/users/${userId}/preferences`,
    method: 'put',
    data,
  });

export const getMeals = () =>
  request({
    url: '/meals',
    method: 'get',
  });

export const getMealDetail = (mealId) =>
  request({
    url: `/meals/${mealId}`,
    method: 'get',
  });

export const getRecommendations = (userId) =>
  request({
    url: `/recommendations?userId=${userId}`,
    method: 'get',
  });

export const createOrder = (data) =>
  request({
    url: '/orders',
    method: 'post',
    data,
  });

export const confirmOrder = (orderId) =>
  request({
    url: `/orders/${orderId}/confirm`,
    method: 'post',
  });

export const cancelOrder = (orderId) =>
  request({
    url: `/orders/${orderId}/cancel`,
    method: 'post',
  });

export const createMeal = (data) =>
  request({
    url: '/meals',
    method: 'post',
    data,
  });

export const updateMeal = (mealId, data) =>
  request({
    url: `/meals/${mealId}`,
    method: 'put',
    data,
  });

export const deleteMeal = (mealId) =>
  request({
    url: `/meals/${mealId}`,
    method: 'delete',
  });

export const createIngredient = (data) =>
  request({
    url: '/ingredients',
    method: 'post',
    data,
  });

export const updateIngredient = (ingredientId, data) =>
  request({
    url: `/ingredients/${ingredientId}`,
    method: 'put',
    data,
  });

export const updateStock = (ingredientId, data) =>
  request({
    url: `/stock/${ingredientId}`,
    method: 'put',
    data,
  });

export const getDashboard = () =>
  request({
    url: '/dashboard',
    method: 'get',
  });

export const getSustainabilityReport = () =>
  request({
    url: '/reports/sustainability',
    method: 'get',
  });

export const chatWithAssistant = (messages) =>
  request({
    url: '/ai/chat',
    method: 'post',
    data: { messages },
  });

export const confirmAssistantAction = (actionId) =>
  request({
    url: `/ai/actions/${actionId}/confirm`,
    method: 'post',
  });

export const streamAssistantChat = async (messages, handlers = {}) => {
  const token = localStorage.getItem('greenbite_token');
  const response = await fetch('/api/ai/chat/stream', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ messages }),
  });

  if (!response.ok || !response.body) {
    const text = await response.text();
    if (response.status === 401) {
      localStorage.removeItem('greenbite_token');
      localStorage.removeItem('greenbite_role');
      localStorage.removeItem('greenbite_userId');
      localStorage.removeItem('greenbite_username');
      window.location.href = '/login';
      throw new Error('登录状态已失效，请重新登录');
    }
    throw new Error(text || 'AI 助手流式请求失败');
  }

  const decoder = new TextDecoder();
  const reader = response.body.getReader();
  let buffer = '';

  const emitEvent = (rawEvent) => {
    const lines = rawEvent.split('\n');
    let eventName = 'message';
    const dataLines = [];

    lines.forEach((line) => {
      if (line.startsWith('event:')) {
        eventName = line.slice(6).trim();
      } else if (line.startsWith('data:')) {
        dataLines.push(line.slice(5).trim());
      }
    });

    const dataText = dataLines.join('\n');
    let data = dataText;
    if (dataText.startsWith('{') || dataText.startsWith('[')) {
      try {
        data = JSON.parse(dataText);
      } catch {
        data = dataText;
      }
    }

    handlers.onEvent?.({ event: eventName, data });
  };

  while (true) {
    const { value, done } = await reader.read();
    if (done) {
      break;
    }

    buffer += decoder.decode(value, { stream: true });
    const parts = buffer.split('\n\n');
    buffer = parts.pop() ?? '';
    parts.forEach((part) => {
      if (part.trim()) {
        emitEvent(part);
      }
    });
  }

  if (buffer.trim()) {
    emitEvent(buffer);
  }
};
