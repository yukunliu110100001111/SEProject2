import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getDashboard, getSustainabilityReport } from '../api/app';
import Dashboard from '../views/Dashboard';

vi.mock('../api/app', () => ({
  getDashboard: vi.fn(),
  getSustainabilityReport: vi.fn(),
}));

vi.mock('../components/Navbar', () => ({
  default: () => <nav aria-label="Mock navigation" />,
}));

const renderDashboard = () =>
  render(
    <Dashboard
      auth={{ role: 'admin', userId: 3, username: 'admin1' }}
      cartCount={0}
      onOpenCart={() => {}}
      onLogout={() => {}}
    />
  );

describe('Dashboard', () => {
  beforeEach(() => {
    getDashboard.mockReset();
    getSustainabilityReport.mockReset();
    getDashboard.mockResolvedValue({
      lowCarbonRate: 0,
      topMeals: [],
      stockUsage: [],
    });
  });

  it('uses the backend count field for top meal order totals', async () => {
    getDashboard.mockResolvedValue({
      lowCarbonRate: 0.42,
      topMeals: [
        {
          mealId: 1,
          name: 'Quinoa Bowl',
          count: 7,
        },
      ],
      stockUsage: [],
    });

    renderDashboard();

    await waitFor(() => {
      expect(getDashboard).toHaveBeenCalled();
    });

    expect(screen.getByText('Quinoa Bowl')).toBeInTheDocument();
    expect(screen.getByText('7 orders')).toBeInTheDocument();
  });
});
