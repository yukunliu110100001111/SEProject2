import { beforeEach, describe, expect, it } from 'vitest';
import {
  clearSession,
  getCart,
  getSession,
  saveCart,
  saveSession,
} from '../utils/storage';

describe('storage utilities', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('saves, reads, and clears a user session', () => {
    saveSession({
      token: 'token-123',
      role: 'staff',
      userId: 42,
      username: 'greenbite',
    });

    expect(getSession()).toEqual({
      token: 'token-123',
      role: 'staff',
      userId: '42',
      username: 'greenbite',
    });

    clearSession();

    expect(getSession()).toEqual({
      token: null,
      role: null,
      userId: null,
      username: null,
    });
  });

  it('persists cart items as JSON', () => {
    const cart = [
      {
        mealId: 1,
        name: 'Tofu Bowl',
        quantity: 2,
      },
    ];

    saveCart(cart);

    expect(getCart()).toEqual(cart);
  });

  it('returns an empty cart when stored data is missing or invalid', () => {
    expect(getCart()).toEqual([]);

    localStorage.setItem('greenbite_cart', '{bad json');

    expect(getCart()).toEqual([]);
  });
});
