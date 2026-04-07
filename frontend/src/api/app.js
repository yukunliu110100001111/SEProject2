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
