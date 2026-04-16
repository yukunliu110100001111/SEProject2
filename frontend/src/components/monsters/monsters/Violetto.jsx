import { motion as Motion, useMotionValue, useSpring, useTransform } from 'motion/react';
import { useEffect } from 'react';
import { useFaceTracking } from '../hooks/useEyeTracking';

export function Violetto({ cursorX, cursorY, isFormFocused = false, isPasswordVisible = false }) {
  const bodyX = 135;
  const bodyY = 20;
  const bodyWidth = 165;
  const bodyHeight = 340;
  const headCenterX = bodyX + bodyWidth / 2;
  const headCenterY = bodyY + 40;
  const faceCenterX = headCenterX;
  const faceCenterY = headCenterY;
  const leftEyeOffsetX = -25;
  const rightEyeOffsetX = 25;
  const eyeOffsetY = -8;
  const mouthOffsetY = 20;

  const face = useFaceTracking(faceCenterX, faceCenterY, cursorX, cursorY, {
    maxFaceShift: 20,
    maxPupilDistance: 4,
  });

  const avertFaceX = useMotionValue(0);
  const avertFaceY = useMotionValue(0);
  const avertPupilX = useMotionValue(0);
  const avertPupilY = useMotionValue(0);
  const smoothAvertFaceX = useSpring(avertFaceX, { stiffness: 120, damping: 20 });
  const smoothAvertFaceY = useSpring(avertFaceY, { stiffness: 120, damping: 20 });
  const smoothAvertPupilX = useSpring(avertPupilX, { stiffness: 120, damping: 20 });
  const smoothAvertPupilY = useSpring(avertPupilY, { stiffness: 120, damping: 20 });
  const passwordVisibleFactor = useMotionValue(0);
  const smoothPasswordVisible = useSpring(passwordVisibleFactor, { stiffness: 120, damping: 20 });

  useEffect(() => {
    avertFaceX.set(isPasswordVisible ? -15 : 0);
    avertFaceY.set(0);
    avertPupilX.set(isPasswordVisible ? -19 : 0);
    avertPupilY.set(0);
    passwordVisibleFactor.set(isPasswordVisible ? 1 : 0);
  }, [isPasswordVisible, avertFaceX, avertFaceY, avertPupilX, avertPupilY, passwordVisibleFactor]);

  const leanSkewValue = useMotionValue(0);
  const leanSkew = useSpring(leanSkewValue, { stiffness: 1000, damping: 50, mass: 0.1 });

  useEffect(() => {
    leanSkewValue.set(isFormFocused && !isPasswordVisible ? -8 : 0);
  }, [isFormFocused, isPasswordVisible, leanSkewValue]);

  const leftPupilTotalX = useTransform(
    [face.faceOffsetX, face.pupilOffsetX, smoothAvertPupilX, smoothPasswordVisible],
    ([fx, px, ax, pv]) => ((fx + px) * (1 - pv)) + ax * pv
  );
  const leftPupilTotalY = useTransform(
    [face.faceOffsetY, face.pupilOffsetY, smoothAvertPupilY, smoothPasswordVisible],
    ([fy, py, ay, pv]) => ((fy + py) * (1 - pv)) + ay * pv
  );
  const rightPupilTotalX = useTransform(
    [face.faceOffsetX, face.pupilOffsetX, smoothAvertPupilX, smoothPasswordVisible],
    ([fx, px, ax, pv]) => ((fx + px) * (1 - pv)) + ax * pv
  );
  const rightPupilTotalY = useTransform(
    [face.faceOffsetY, face.pupilOffsetY, smoothAvertPupilY, smoothPasswordVisible],
    ([fy, py, ay, pv]) => ((fy + py) * (1 - pv)) + ay * pv
  );
  const faceX = useTransform(
    [face.faceOffsetX, smoothAvertFaceX, smoothPasswordVisible],
    ([fx, ax, pv]) => fx * (1 - pv) + ax * pv
  );
  const faceY = useTransform(
    [face.faceOffsetY, smoothAvertFaceY, smoothPasswordVisible],
    ([fy, ay, pv]) => fy * (1 - pv) + ay * pv
  );

  return (
    <Motion.g initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}>
      <Motion.g style={{ skewX: leanSkew, transformOrigin: 'bottom center' }}>
        <ellipse cx="217.5" cy="352" rx="72" ry="14" fill="rgba(15, 23, 42, 0.12)" />
        <path
          d="M 218 -5
             L 218 -40
             L 249 -58"
          fill="none"
          stroke="#ef4444"
          strokeWidth="14"
          strokeLinecap="butt"
          strokeLinejoin="round"
        />
        <path
          d="M 156 -5
             L 279 -5
             L 312 15
             L 123 15 Z"
          fill="#111827"
        />
        <path
          d="M 128 20
             L 307 20
             L 268 360
             L 167 360 Z"
          fill="none"
          stroke="rgba(255,255,255,0.35)"
          strokeWidth="10"
          strokeLinejoin="round"
        />
        <path
          d="M 128 20
             L 307 20
             L 268 360
             L 167 360 Z"
          fill="#b89372"
        />
        <rect x="123" y="15" width="189" height="10" fill="#111827" />
        <Motion.circle
          r={8}
          fill="white"
          style={{ x: faceX, y: faceY, translateX: faceCenterX + leftEyeOffsetX, translateY: faceCenterY + eyeOffsetY }}
          animate={{ scaleY: [1, 0.1, 1] }}
          transition={{ duration: 0.2, repeat: Infinity, repeatDelay: 2, delay: 0 }}
        />
        <Motion.circle
          r={4}
          fill="black"
          style={{ x: leftPupilTotalX, y: leftPupilTotalY, translateX: faceCenterX + leftEyeOffsetX, translateY: faceCenterY + eyeOffsetY }}
          animate={{ scaleY: [1, 0.1, 1] }}
          transition={{ duration: 0.2, repeat: Infinity, repeatDelay: 2, delay: 0 }}
        />
        <Motion.circle
          r={8}
          fill="white"
          style={{ x: faceX, y: faceY, translateX: faceCenterX + rightEyeOffsetX, translateY: faceCenterY + eyeOffsetY }}
          animate={{ scaleY: [1, 0.1, 1] }}
          transition={{ duration: 0.2, repeat: Infinity, repeatDelay: 2, delay: 0 }}
        />
        <Motion.circle
          r={4}
          fill="black"
          style={{ x: rightPupilTotalX, y: rightPupilTotalY, translateX: faceCenterX + rightEyeOffsetX, translateY: faceCenterY + eyeOffsetY }}
          animate={{ scaleY: [1, 0.1, 1] }}
          transition={{ duration: 0.2, repeat: Infinity, repeatDelay: 2, delay: 0 }}
        />
        {isFormFocused && !isPasswordVisible ? (
          <Motion.rect
            x={faceCenterX - 1.5}
            y={faceCenterY + mouthOffsetY - 22}
            width={4}
            height={28}
            rx={1.5}
            fill="black"
            style={{ x: faceX, y: faceY }}
          />
        ) : (
          <Motion.path
            d={`M ${faceCenterX - 8} ${faceCenterY + mouthOffsetY} Q ${faceCenterX} ${faceCenterY + mouthOffsetY + 4} ${faceCenterX + 8} ${faceCenterY + mouthOffsetY}`}
            stroke="black"
            strokeWidth={4}
            strokeLinecap="round"
            fill="none"
            style={{ x: faceX, y: faceY }}
          />
        )}
        <rect x="182" y="160" width="72" height="88" rx="10" fill="#ffffff" opacity="0.28" />
      </Motion.g>
    </Motion.g>
  );
}
