import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMealDetail, getMeals, getRecommendations } from '../api/app';
import AiAssistantBubble from '../components/AiAssistantBubble';
import MealCard from '../components/MealCard';
import Navbar from '../components/Navbar';
import { useI18n } from '../i18n';
import { pickPageLoadingSrc } from '../utils/loadingAnimations';
import './Home.css';

const categories = [
  { id: 'all', labelKey: 'all' },
  { id: 'lowCarbon', labelKey: 'lowCarbon' },
  { id: 'highProtein', labelKey: 'highProtein' },
  { id: 'plantBased', labelKey: 'plantBased' },
  { id: 'light', labelKey: 'light' },
  { id: 'stockFirst', labelKey: 'stockFirst' },
];

const hasTag = (meal, expectedTags) =>
  expectedTags.some((expectedTag) =>
    meal.tags?.some((tag) => tag?.toLowerCase() === expectedTag)
  );

const matchesCategory = (meal, category, recommendation) => {
  if (category === 'all') {
    return true;
  }

  if (category === 'lowCarbon') {
    return hasTag(meal, ['low-carbon']) || Number(meal.sustainabilityScore || 0) >= 8;
  }

  if (category === 'highProtein') {
    return hasTag(meal, ['high-protein']) || Number(meal.protein || 0) >= 25;
  }

  if (category === 'plantBased') {
    return hasTag(meal, ['plant-based', 'vegetarian', 'vegan']);
  }

  if (category === 'light') {
    return Number(meal.calories || 0) > 0 && Number(meal.calories || 0) <= 450;
  }

  if (category === 'stockFirst') {
    return /stock|expiry/i.test(recommendation?.reason || '');
  }

  return true;
};

const matchesCategories = (meal, activeCategories, recommendation) => {
  if (
    activeCategories.length === 0 ||
    activeCategories.includes('all')
  ) {
    return true;
  }

  return activeCategories.every((category) =>
    matchesCategory(meal, category, recommendation)
  );
};

const Home = ({
  auth,
  cartCount,
  onOpenCart,
  onLogout,
  onAddToCart,
}) => {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [activeCategories, setActiveCategories] = useState(['all']);
  const [meals, setMeals] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    const loadData = async () => {
      setLoading(true);
      setError('');

      try {
        const [mealList, recommendationList] = await Promise.all([
          getMeals(),
          getRecommendations(auth.userId),
        ]);

        const detailList = await Promise.all(
          mealList.map(async (meal) => {
            try {
              const detail = await getMealDetail(meal.mealId);
              return {
                ...meal,
                ...detail,
                sustainabilityScore:
                  detail.sustainabilityScore ?? meal.sustainabilityScore,
              };
            } catch {
              return meal;
            }
          })
        );

        if (!active) {
          return;
        }

        setMeals(
          detailList.map((meal) => ({ ...meal }))
        );
        setRecommendations(recommendationList);
      } catch (err) {
        if (active) {
          setError(err.message || t('loadRecommendationsFailed'));
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadData();
    return () => {
      active = false;
    };
  }, [auth.userId, t]);

  const recommendationMap = useMemo(() => {
    const map = new Map();
    recommendations.forEach((item) => {
      map.set(item.mealId, item);
    });
    return map;
  }, [recommendations]);

  const filteredMeals = useMemo(() => {
    return meals
      .filter((meal) => {
        const recommendation = recommendationMap.get(meal.mealId);
        const keyword = search.trim().toLowerCase();
        const matchesKeyword =
          !keyword ||
          meal.name?.toLowerCase().includes(keyword) ||
          meal.description?.toLowerCase().includes(keyword) ||
          meal.tags?.some((tag) => tag.toLowerCase().includes(keyword));

        if (!matchesKeyword) {
          return false;
        }

        return matchesCategories(meal, activeCategories, recommendation);
      })
      .sort((a, b) => {
        const left = Number(recommendationMap.get(a.mealId)?.score || 0);
        const right = Number(recommendationMap.get(b.mealId)?.score || 0);
        return right - left;
      });
  }, [activeCategories, meals, recommendationMap, search]);

  const recommendedMeals = useMemo(
    () =>
      filteredMeals.filter(
        (meal) => !recommendationMap.get(meal.mealId)?.allergenConflict
      ),
    [filteredMeals, recommendationMap]
  );

  const allergenConflictMeals = useMemo(
    () =>
      filteredMeals.filter(
        (meal) => recommendationMap.get(meal.mealId)?.allergenConflict
      ),
    [filteredMeals, recommendationMap]
  );

  const handleCategoryToggle = (category) => {
    setActiveCategories((current) => {
      if (category === 'all') {
        return ['all'];
      }

      const next = current.filter((item) => item !== 'all');
      if (next.includes(category)) {
        const reduced = next.filter((item) => item !== category);
        return reduced.length > 0 ? reduced : ['all'];
      }

      return [...next, category];
    });
  };

  return (
    <div className="home-container">
      <div className="bg-blob blob-1"></div>
      <div className="bg-blob blob-2"></div>
      <div className="bg-blob blob-3"></div>

      <Navbar
        auth={auth}
        cartCount={cartCount}
        onOpenCart={onOpenCart}
        onLogout={onLogout}
      />

      <section className="banner-intro">
        <div className="hero-width-shell">
          <div className="hero-stack-shell">
            <div className="banner-panel">
              <div className="banner-glow banner-glow-left"></div>
              <div className="banner-glow banner-glow-right"></div>
            <div className="banner-category-row" aria-label={t('mealCategories')}>
              {categories.map((category) => (
                <button
                  key={category.id}
                  type="button"
                  className={`category-pill ${activeCategories.includes(category.id) ? 'active' : ''}`}
                  onClick={() => handleCategoryToggle(category.id)}
                >
                  {t(category.labelKey)}
                </button>
              ))}
            </div>
            <div className="banner-search-wrapper">
              <input
                type="text"
                placeholder={t('search')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="banner-copy">
              <span className="banner-kicker">GreenBite</span>
              <h1>{t('todaysPicks')}</h1>
              <div className="banner-actions">
                <button type="button" className="banner-btn primary" onClick={() => window.scrollTo({ top: 720, behavior: 'smooth' })}>
                  {t('browse')}
                </button>
                <button type="button" className="banner-btn secondary" onClick={onOpenCart}>
                  {t('cart')}
                </button>
              </div>
            </div>
            </div>
            {!loading && !error && recommendedMeals.length > 0 && (
              <section className="top-showcase-section" aria-label={t('featuredMeals')}>
                <div className="showcase-track-shell">
                  <div className="showcase-marquee">
                    {[0, 1].map((groupIndex) => (
                      <div className="showcase-track" key={groupIndex}>
                        {recommendedMeals.map((meal) => {
                          const recommendation = recommendationMap.get(meal.mealId);
                          return (
                          <button
                            key={`${groupIndex}-${meal.mealId}`}
                            type="button"
                            className="showcase-card"
                            onClick={() =>
                              navigate('/loading', {
                                state: {
                                  nextPath: `/meals/${meal.mealId}`,
                                  loadingSrc: pickPageLoadingSrc(),
                                  routeState: recommendation
                                    ? {
                                        recommendationRequestId: recommendation.recommendationRequestId,
                                        recommendationRankPosition: recommendation.recommendationRankPosition,
                                      }
                                    : undefined,
                                },
                              })
                            }
                          >
                            <img
                              src={meal.imageUrl || 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=500'}
                              alt={meal.name}
                              className="showcase-image"
                            />
                            <div className="showcase-overlay">
                              <strong>{meal.name}</strong>
                              <span>{t('sustainability')} {meal.sustainabilityScore ?? '-'}/10</span>
                            </div>
                          </button>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            )}
          </div>
        </div>
      </section>

      <section className="hero-section">
        <div className="welcome-bar">
          <div className="user-welcome">
            {t('hiUser', { name: auth.username })}
          </div>
        </div>
        <div className="hero-title-area">
          <h1 className="hero-main-title">
            {t('recommendedForYou')}
          </h1>
        </div>
      </section>

      <section className="list-section">
        <div className="list-header">
          <h2 className="list-title">{t('recommendations')}</h2>
        </div>

        {loading && <div className="page-card">{t('loadingRecommendations')}</div>}
        {error && <div className="page-card error-card">{error}</div>}

        {!loading && !error && (
          recommendedMeals.length > 0 ? (
            <div className="meal-grid">
              {recommendedMeals.map((meal) => {
                const recommendation = recommendationMap.get(meal.mealId);
                return (
                <MealCard
                  key={meal.mealId}
                  meal={meal}
                  recommendation={recommendation}
                  onAdd={() =>
                    onAddToCart({
                      ...meal,
                      recommendationRequestId: recommendation?.recommendationRequestId || null,
                    })
                  }
                  onClick={() =>
                    navigate('/loading', {
                      state: {
                        nextPath: `/meals/${meal.mealId}`,
                        loadingSrc: pickPageLoadingSrc(),
                        routeState: recommendation
                          ? {
                              recommendationRequestId: recommendation.recommendationRequestId,
                              recommendationRankPosition: recommendation.recommendationRankPosition,
                            }
                          : undefined,
                      },
                    })
                  }
                />
                );
              })}
            </div>
          ) : (
            <div className="page-card">{t('noMealsMatch')}</div>
          )
        )}
      </section>
      {!loading && !error && allergenConflictMeals.length > 0 && (
        <section className="list-section allergen-section">
          <div className="list-header allergen-header">
            <h2 className="list-title">{t('notRecommendedDueToAllergens')}</h2>
            <p>{t('allergenSectionHint')}</p>
          </div>
          <div className="meal-grid">
            {allergenConflictMeals.map((meal) => {
              const recommendation = recommendationMap.get(meal.mealId);
              return (
                <MealCard
                  key={meal.mealId}
                  meal={meal}
                  recommendation={recommendation}
                  disabledAdd
                  onClick={() =>
                    navigate('/loading', {
                      state: {
                        nextPath: `/meals/${meal.mealId}`,
                        loadingSrc: pickPageLoadingSrc(),
                        routeState: recommendation
                          ? {
                              recommendationRequestId: recommendation.recommendationRequestId,
                              recommendationRankPosition: recommendation.recommendationRankPosition,
                            }
                          : undefined,
                      },
                    })
                  }
                />
              );
            })}
          </div>
        </section>
      )}
      <AiAssistantBubble auth={auth} />
    </div>
  );
};

export default Home;
