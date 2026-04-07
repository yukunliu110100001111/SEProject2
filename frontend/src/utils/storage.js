const TOKEN_KEY = 'greenbite_token';
const ROLE_KEY = 'greenbite_role';
const USER_ID_KEY = 'greenbite_userId';
const USERNAME_KEY = 'greenbite_username';
const CART_KEY = 'greenbite_cart';
const ORDERS_KEY = 'greenbite_orders_cache';
const STAFF_INGREDIENTS_KEY = 'greenbite_staff_ingredients_cache';
const MEAL_IMAGE_MAP_KEY = 'greenbite_meal_image_map';

export const saveSession = ({ token, role, userId, username }) => {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(ROLE_KEY, role);
  localStorage.setItem(USER_ID_KEY, String(userId));
  localStorage.setItem(USERNAME_KEY, username);
};

export const getSession = () => ({
  token: localStorage.getItem(TOKEN_KEY),
  role: localStorage.getItem(ROLE_KEY),
  userId: localStorage.getItem(USER_ID_KEY),
  username: localStorage.getItem(USERNAME_KEY),
});

export const clearSession = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(ROLE_KEY);
  localStorage.removeItem(USER_ID_KEY);
  localStorage.removeItem(USERNAME_KEY);
};

export const getCart = () => {
  try {
    return JSON.parse(localStorage.getItem(CART_KEY)) || [];
  } catch {
    return [];
  }
};

export const saveCart = (cart) => {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
};

export const getOrderCache = () => {
  try {
    return JSON.parse(localStorage.getItem(ORDERS_KEY)) || [];
  } catch {
    return [];
  }
};

export const saveOrderCache = (orders) => {
  localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
};

export const getStaffIngredientCache = () => {
  try {
    return JSON.parse(localStorage.getItem(STAFF_INGREDIENTS_KEY)) || [];
  } catch {
    return [];
  }
};

export const saveStaffIngredientCache = (items) => {
  localStorage.setItem(STAFF_INGREDIENTS_KEY, JSON.stringify(items));
};

export const getMealImageMap = () => {
  try {
    return JSON.parse(localStorage.getItem(MEAL_IMAGE_MAP_KEY)) || {};
  } catch {
    return {};
  }
};

export const saveMealImageMap = (map) => {
  localStorage.setItem(MEAL_IMAGE_MAP_KEY, JSON.stringify(map));
};

export const saveMealImage = (mealId, imageUrl) => {
  const current = getMealImageMap();
  if (imageUrl) {
    current[String(mealId)] = imageUrl;
  } else {
    delete current[String(mealId)];
  }
  saveMealImageMap(current);
};

export const removeMealImage = (mealId) => {
  const current = getMealImageMap();
  delete current[String(mealId)];
  saveMealImageMap(current);
};
