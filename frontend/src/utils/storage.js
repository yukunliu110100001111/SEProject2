const TOKEN_KEY = 'greenbite_token';
const ROLE_KEY = 'greenbite_role';
const USER_ID_KEY = 'greenbite_userId';
const USERNAME_KEY = 'greenbite_username';
const CART_KEY = 'greenbite_cart';

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
