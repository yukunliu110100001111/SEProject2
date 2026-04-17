import { motion as Motion, useMotionValue, useSpring, useTransform } from 'motion/react';
import { useEffect } from 'react';
import { useFaceTracking } from '../hooks/useEyeTracking';

export function Inky({ cursorX, cursorY, isFormFocused = false, isPasswordVisible = false }) {
  const bodyX = 250;
  const bodyY = 120;
  const bodyWidth = 100;
  const bodyHeight = 240;
  const headCenterX = bodyX + bodyWidth / 2;
  const headCenterY = bodyY + 30;
  const faceCenterX = headCenterX;
  const faceCenterY = headCenterY;
  const leftEyeOffsetX = -15;
  const rightEyeOffsetX = 15;
  const eyeOffsetY = -5;

  const face = useFaceTracking(faceCenterX, faceCenterY, cursorX, cursorY, {
    maxFaceShift: 15,
    maxPupilDistance: 5,
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
    avertFaceX.set(isPasswordVisible ? -12 : 0);
    avertFaceY.set(0);
    avertPupilX.set(isPasswordVisible ? -17 : 0);
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
    <Motion.g initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}>
      <Motion.g style={{ skewX: leanSkew, transformOrigin: 'bottom center' }}>
        <ellipse cx="300" cy="352" rx="66" ry="14" fill="rgba(15, 23, 42, 0.12)" />
        <rect x={bodyX} y={bodyY} width={bodyWidth} height={bodyHeight} fill="#4a2512" rx={8} />
        {Array.from({ length: 4 }).map((_, row) => (
          <g key={row}>
            <rect x="260" y={132 + row * 54} width="34" height="40" rx="7" fill="#6b3518" />
            <rect x="306" y={132 + row * 54} width="34" height="40" rx="7" fill="#6b3518" />
          </g>
        ))}
        <path d="M 300 128 L 300 338" stroke="#2f160b" strokeWidth="5" strokeLinecap="round" opacity="0.75" />
        <path d="M 256 181 L 344 181" stroke="#2f160b" strokeWidth="5" strokeLinecap="round" opacity="0.75" />
        <path d="M 256 235 L 344 235" stroke="#2f160b" strokeWidth="5" strokeLinecap="round" opacity="0.75" />
        <path d="M 256 289 L 344 289" stroke="#2f160b" strokeWidth="5" strokeLinecap="round" opacity="0.75" />
        <Motion.circle
          r={10}
          fill="white"
          style={{ x: faceX, y: faceY, translateX: faceCenterX + leftEyeOffsetX, translateY: faceCenterY + eyeOffsetY }}
          animate={{ scaleY: [1, 0.1, 1] }}
          transition={{ duration: 0.2, repeat: Infinity, repeatDelay: 2, delay: 1 }}
        />
        <Motion.circle
          r={5}
          fill="black"
          style={{ x: leftPupilTotalX, y: leftPupilTotalY, translateX: faceCenterX + leftEyeOffsetX, translateY: faceCenterY + eyeOffsetY }}
          animate={{ scaleY: [1, 0.1, 1] }}
          transition={{ duration: 0.2, repeat: Infinity, repeatDelay: 2, delay: 1 }}
        />
        <Motion.circle
          r={10}
          fill="white"
          style={{ x: faceX, y: faceY, translateX: faceCenterX + rightEyeOffsetX, translateY: faceCenterY + eyeOffsetY }}
          animate={{ scaleY: [1, 0.1, 1] }}
          transition={{ duration: 0.2, repeat: Infinity, repeatDelay: 2, delay: 1 }}
        />
        <Motion.circle
          r={6}
          fill="black"
          style={{ x: rightPupilTotalX, y: rightPupilTotalY, translateX: faceCenterX + rightEyeOffsetX, translateY: faceCenterY + eyeOffsetY }}
          animate={{ scaleY: [1, 0.1, 1] }}
          transition={{ duration: 0.2, repeat: Infinity, repeatDelay: 2, delay: 1 }}
        />
      </Motion.g>
    </Motion.g>
  );
}
