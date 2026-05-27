import { fireEvent, render, screen, waitFor } from '@testing-library/react';
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
      recommendationAnalytics: {},
      highStockIngredients: [],
      nearExpiryIngredients: [],
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
      recommendationAnalytics: {},
      highStockIngredients: [],
      nearExpiryIngredients: [],
    });

    renderDashboard();

    await waitFor(() => {
      expect(getDashboard).toHaveBeenCalled();
    });

    expect(screen.getByText('Quinoa Bowl')).toBeInTheDocument();
    expect(screen.getByText('7 orders')).toBeInTheDocument();
  });

  it('renders recommendation analytics, inventory risks, and generated report summary', async () => {
    getDashboard.mockResolvedValue({
      lowCarbonRate: 0.5,
      lowCarbonSelectionCount: 4,
      topMeals: [],
      stockUsage: [],
      topRecommendedMeals: [{ mealId: 2, name: 'Salmon Plate', count: 9 }],
      topClickedMeals: [{ mealId: 3, name: 'Chicken Bowl', count: 5 }],
      topSelectedMeals: [{ mealId: 4, name: 'Veggie Bowl', count: 3 }],
      highStockIngredients: [{ ingredientId: 1, name: 'Rice', currentQty_g: 8000 }],
      nearExpiryIngredients: [{ ingredientId: 2, name: 'Tofu', expiryDate: '2026-05-30' }],
      recommendationAnalytics: {
        rangeStart: '2026-04-28',
        rangeEnd: '2026-05-27',
        totalExposureCount: 20,
        totalClickCount: 5,
        totalSelectedCount: 3,
        clickThroughRate: 0.25,
        selectionRate: 0.15,
      },
    });
    getSustainabilityReport.mockResolvedValue({
      reportId: 11,
      generatedAt: '2026-05-27T10:00:00',
      rangeStart: '2026-04-28',
      rangeEnd: '2026-05-27',
      summary: 'Low-carbon selection rate improved.',
      lowCarbonRate: 0.5,
      lowCarbonSelectionCount: 4,
      topMeals: [{ mealId: 5, name: 'Green Salad', count: 2 }],
      highStockIngredients: [{ ingredientId: 1, name: 'Rice', currentQty_g: 8000 }],
      nearExpiryIngredients: [],
      recommendationAnalytics: {
        totalExposureCount: 20,
        clickThroughRate: 0.25,
      },
    });

    renderDashboard();

    expect(await screen.findByText('Recommendation analytics')).toBeInTheDocument();
    expect(screen.getByText('Salmon Plate')).toBeInTheDocument();
    expect(screen.getByText('Rice')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Generate sustainability report/i }));

    expect(await screen.findByText('Low-carbon selection rate improved.')).toBeInTheDocument();
    expect(screen.getByText('Report ID: #11')).toBeInTheDocument();
    expect(screen.getByText('Green Salad')).toBeInTheDocument();
  });
});
