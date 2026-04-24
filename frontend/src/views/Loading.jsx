import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  GradientRing,
  LoadingText,
  MorphBlob,
  OrbitDots,
} from 'premium-react-loaders';
import { useLocation, useNavigate } from 'react-router-dom';
import './Loading.css';

const MIN_LOADING_MS = 3600;
const LOADING_LABEL_HOLD_MS = 1400;
const EXIT_DELAY_MS = 900;

const Loading = ({ auth, onConsumeTarget }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const startedAtRef = useRef(Date.now());
  const [progress, setProgress] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [showFinalizing, setShowFinalizing] = useState(false);
  const burgerStops = useMemo(
    () =>
      Array.from({ length: 7 }, (_, index) => ({
        id: index,
        ratio: (index + 1) / 8,
      })),
    []
  );

  const nextPath = useMemo(() => {
    if (location.state?.nextPath) {
      return location.state.nextPath;
    }

    if (auth?.role === 'admin') {
      return '/dashboard';
    }

    if (auth?.role === 'staff') {
      return '/staff';
    }

    return '/home';
  }, [auth?.role, location.state]);

  useEffect(() => {
    onConsumeTarget?.();
    startedAtRef.current = Date.now();
  }, [onConsumeTarget]);

  useEffect(() => {
    if (isComplete) {
      return undefined;
    }

    const timer = window.setInterval(() => {
      setProgress((current) => {
        if (current >= 100) {
          window.clearInterval(timer);
          return 100;
        }

        const delta =
          Math.floor(Math.random() * 4) +
          (current < 32 ? 5 : current < 68 ? 3 : 2);
        return Math.min(100, current + delta);
      });
    }, 180);

    return () => window.clearInterval(timer);
  }, [isComplete]);

  useEffect(() => {
    if (progress < 100 || isComplete) {
      return undefined;
    }

    setIsComplete(true);
    return undefined;
  }, [isComplete, progress]);

  useEffect(() => {
    if (!isComplete) {
      return undefined;
    }

    const elapsed = Date.now() - startedAtRef.current;
    const remaining = Math.max(0, MIN_LOADING_MS - elapsed);
    const finalizingTimer = window.setTimeout(() => {
      setShowFinalizing(true);
    }, LOADING_LABEL_HOLD_MS);
    const timer = window.setTimeout(() => {
      navigate(nextPath, { replace: true });
    }, Math.max(remaining, LOADING_LABEL_HOLD_MS) + EXIT_DELAY_MS);

    return () => {
      window.clearTimeout(finalizingTimer);
      window.clearTimeout(timer);
    };
  }, [isComplete, navigate, nextPath]);

  return (
    <div className="premium-loading-page">
      <div className="premium-loading-ambient premium-loading-ambient-a" aria-hidden="true"></div>
      <div className="premium-loading-ambient premium-loading-ambient-b" aria-hidden="true"></div>
      <div className="premium-loading-grid" aria-hidden="true"></div>

      <div className="premium-loading-shell">
        <div className="premium-loading-visual">
          <div className="premium-loading-core">
            <MorphBlob
              size={220}
              color="#34d399"
              speed="slow"
              respectMotionPreference={false}
              className="premium-loader-blob"
              ariaLabel="Morphing core"
            />
            <GradientRing
              size={260}
              thickness={14}
              colors={['#22c55e', '#6ee7b7', '#38bdf8', '#22c55e']}
              backgroundColor="rgba(255,255,255,0.24)"
              speed="slow"
              respectMotionPreference={false}
              className="premium-loader-ring outer-ring"
              ariaLabel="Outer ring"
            />
            <GradientRing
              size={188}
              thickness={10}
              colors={['#bbf7d0', '#4ade80', '#2dd4bf']}
              backgroundColor="rgba(255,255,255,0.24)"
              speed="normal"
              reverse
              respectMotionPreference={false}
              className="premium-loader-ring inner-ring"
              ariaLabel="Inner ring"
            />
            <OrbitDots
              size={296}
              dotCount={8}
              dotSize={10}
              orbitRadius={0.88}
              color="#15803d"
              secondaryColor="#38bdf8"
              stagger
              speed="slow"
              respectMotionPreference={false}
              className="premium-loader-orbit"
              ariaLabel="Orbiting accents"
            />
          </div>
        </div>

        <div className="premium-loading-copy">
          <span className="premium-loading-kicker">GreenBite</span>
          <h1>Preparing your experience</h1>
          <p>Launching a polished transition before you land on your dashboard.</p>

          <div className="premium-loading-status">
            <LoadingText
              text={showFinalizing ? 'Finalizing' : 'Loading'}
              animation="fade"
              showEllipsis
              dotCount={3}
              color="#0f172a"
              fontSize={18}
              fontWeight={700}
              respectMotionPreference={false}
            />
            <strong>{progress}%</strong>
          </div>

          <div
            className="premium-loading-progress premium-loading-chase"
            style={{ '--progress-ratio': progress / 100 }}
            aria-label="Loading progress"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={progress}
          >
            <div className="premium-loading-chase-track" aria-hidden="true">
              <div className="premium-loading-chase-line"></div>

              {burgerStops.map((stop) => (
                <div
                  key={stop.id}
                  className={`premium-loading-burger ${
                    progress >= stop.ratio * 100 ? 'is-eaten' : ''
                  }`}
                  style={{ '--burger-ratio': stop.ratio }}
                >
                  <span className="burger-bun bun-top"></span>
                  <span className="burger-lettuce"></span>
                  <span className="burger-patty"></span>
                  <span className="burger-bun bun-bottom"></span>
                </div>
              ))}

              <div className="premium-loading-pacman">
                <span className="pacman-body"></span>
                <span className="pacman-eye"></span>
                <span className="pacman-mouth"></span>
              </div>
            </div>
          </div>

          <div className="premium-loading-caption">
            {showFinalizing ? 'Almost there' : 'Pac-Man is clearing the burger lane'}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Loading;
