import React, { useEffect, useMemo } from 'react';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  CUSTOMIZE_LOADING_SRC,
  LOGIN_LOADING_SRC,
  PAGE_LOADING_SRCS,
} from '../utils/loadingAnimations';
import './Loading.css';

const MIN_LOADING_MS = 1800;

const Loading = ({ auth, onConsumeTarget }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const nextPath = useMemo(() => {
    if (location.state?.nextPath) {
      return location.state.nextPath;
    }

    if (!auth?.token) {
      return '/login';
    }

    if (auth?.role === 'admin') {
      return '/dashboard';
    }

    if (auth?.role === 'staff') {
      return '/staff';
    }

    return '/home';
  }, [auth?.role, auth?.token, location.state]);

  const isCustomizeLoading = nextPath === '/customize';
  const isLoginLoading = nextPath === '/login';
  const lottieSrc = isCustomizeLoading
    ? CUSTOMIZE_LOADING_SRC
    : isLoginLoading
      ? LOGIN_LOADING_SRC
      : location.state?.loadingSrc || PAGE_LOADING_SRCS[0];

  useEffect(() => {
    onConsumeTarget?.();
    const timer = window.setTimeout(() => {
      navigate(nextPath, {
        replace: true,
        state: isLoginLoading ? { fromLoading: true } : location.state?.routeState,
      });
    }, MIN_LOADING_MS);

    return () => window.clearTimeout(timer);
  }, [isLoginLoading, location.state, navigate, nextPath, onConsumeTarget]);

  return (
    <div className="premium-loading-page">
      <div className="premium-loading-lottie-frame">
        <DotLottieReact
          src={lottieSrc}
          loop
          autoplay
          className="premium-loading-lottie"
          aria-label={
            isCustomizeLoading
              ? 'Customize loading animation'
              : isLoginLoading
                ? 'Login loading animation'
                : 'Page loading animation'
          }
        />
      </div>
    </div>
  );
};

export default Loading;
