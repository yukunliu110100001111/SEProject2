import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getOrders } from '../api/app';
import Orders from '../views/Orders';

vi.mock('../api/app', () => ({
  cancelOrder: vi.fn(),
  confirmOrder: vi.fn(),
  getOrders: vi.fn(),
}));

vi.mock('../components/Navbar', () => ({
  default: () => <nav aria-label="Mock navigation" />,
}));

const renderOrders = (auth) =>
  render(
    <MemoryRouter>
      <Orders
        auth={auth}
        cartCount={0}
        onOpenCart={() => {}}
        onLogout={() => {}}
      />
    </MemoryRouter>
  );

describe('Orders', () => {
  beforeEach(() => {
    getOrders.mockReset();
    getOrders.mockResolvedValue({ items: [] });
  });

  it('loads only the current customer orders for customer users', async () => {
    renderOrders({
      role: 'customer',
      userId: 1,
      username: 'customer1',
    });

    await waitFor(() => {
      expect(getOrders).toHaveBeenCalledWith({
        userId: 1,
        page: 1,
        size: 100,
      });
    });
  });

  it('loads all orders for staff users', async () => {
    renderOrders({
      role: 'staff',
      userId: 2,
      username: 'staff1',
    });

    await waitFor(() => {
      expect(getOrders).toHaveBeenCalledWith({
        page: 1,
        size: 100,
      });
    });
    expect(screen.getByRole('heading', { name: 'All orders' })).toBeInTheDocument();
  });

  it('loads all orders for admin users', async () => {
    renderOrders({
      role: 'admin',
      userId: 3,
      username: 'admin1',
    });

    await waitFor(() => {
      expect(getOrders).toHaveBeenCalledWith({
        page: 1,
        size: 100,
      });
    });
  });
});
