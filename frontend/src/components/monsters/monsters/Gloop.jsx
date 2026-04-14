import { motion as Motion, useMotionValue, useSpring, useTransform } from 'motion/react';
import { useEffect } from 'react';
import { useFaceTracking } from '../hooks/useEyeTracking';

export function Gloop({ cursorX, cursorY, isFormFocused = false, isPasswordVisible = false }) {
  const bodyLeft = 60;
  const bodyRight = 260;
  const bodyTop = 230;
  const bodyWidth = bodyRight - bodyLeft;
  const headHeight = 80;
  const headCenterX = bodyLeft + bodyWidth / 2;
  const headCenterY = bodyTop + headHeight / 2;
  const faceCenterX = headCenterX;
  const faceCenterY = headCenterY;
  const leftEyeOffsetX = -25;
  const rightEyeOffsetX = 25;
  const eyeOffsetY = 0;
  const mouthOffsetY = 10;
  const mouthHalfWidth = 11;
  const mouthCurveDepth = 19;

  const face = useFaceTracking(faceCenterX, faceCenterY, cursorX, cursorY, {
    maxFaceShift: 15,
    maxPupilDistance: 0,
  });

  const avertGazeX = useMotionValue(0);
  const avertGazeY = useMotionValue(0);
  const smoothAvertX = useSpring(avertGazeX, { stiffness: 120, damping: 20 });
  const smoothAvertY = useSpring(avertGazeY, { stiffness: 120, damping: 20 });
  const passwordVisibleFactor = useMotionValue(0);
  const smoothPasswordVisible = useSpring(passwordVisibleFactor, { stiffness: 120, damping: 20 });

  useEffect(() => {
    avertGazeX.set(isPasswordVisible ? -15 : 0);
    avertGazeY.set(0);
    passwordVisibleFactor.set(isPasswordVisible ? 1 : 0);
  }, [isPasswordVisible, avertGazeX, avertGazeY, passwordVisibleFactor]);

  const faceX = useTransform(
    [face.faceOffsetX, smoothAvertX, smoothPasswordVisible],
    ([fx, ax, pv]) => fx * (1 - pv) + ax * pv
  );
  const faceY = useTransform(
    [face.faceOffsetY, smoothAvertY, smoothPasswordVisible],
    ([fy, ay, pv]) => fy * (1 - pv) + ay * pv
  );

  const leanSkewValue = useMotionValue(0);
  const leanSkew = useSpring(leanSkewValue, { stiffness: 1000, damping: 50, mass: 0.1 });

  useEffect(() => {
    leanSkewValue.set(isFormFocused && !isPasswordVisible ? -3 : 0);
  }, [isFormFocused, isPasswordVisible, leanSkewValue]);

  return (
    <Motion.g initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5, delay: 0.3 }}>
      <Motion.g style={{ skewX: leanSkew, transformOrigin: 'bottom center' }}>
        <ellipse cx="160" cy="352" rx="96" ry="16" fill="rgba(15, 23, 42, 0.12)" />
        <path
          d="M 74 290
             Q 74 228 122 212
             Q 140 188 156 206
             Q 160 208 164 206
             Q 180 188 198 212
             Q 246 228 246 290
             Q 246 366 160 372
             Q 74 366 74 290 Z"
          fill="#ef4444"
        />
        <path
          d="M 98 302
             Q 110 240 160 234
             Q 210 240 222 302
             Q 214 356 160 362
             Q 106 356 98 302 Z"
          fill="#f87171"
          opacity="0.45"
        />
        <path
          d="M 194 170
             Q 204 146 220 150
             Q 214 168 198 182
             Q 190 178 194 170 Z"
          fill="#4caf50"
          transform="translate(-40 28)"
        />
        <path
          d="M 202 170
             Q 192 146 176 150
             Q 182 168 198 182
             Q 206 178 202 170 Z"
          fill="#4caf50"
          transform="translate(-40 28)"
        />

        {isPasswordVisible ? (
          <>
            <Motion.path
              d={`M ${faceCenterX + leftEyeOffsetX - 8} ${faceCenterY + eyeOffsetY + 3} Q ${faceCenterX + leftEyeOffsetX} ${faceCenterY + eyeOffsetY - 6}, ${faceCenterX + leftEyeOffsetX + 8} ${faceCenterY + eyeOffsetY + 3}`}
              stroke="black"
              strokeWidth={3}
              strokeLinecap="round"
              fill="none"
              style={{ x: faceX, y: faceY }}
            />
            <Motion.path
              d={`M ${faceCenterX + rightEyeOffsetX - 8} ${faceCenterY + eyeOffsetY + 3} Q ${faceCenterX + rightEyeOffsetX} ${faceCenterY + eyeOffsetY - 6}, ${faceCenterX + rightEyeOffsetX + 8} ${faceCenterY + eyeOffsetY + 3}`}
              stroke="black"
              strokeWidth={3}
              strokeLinecap="round"
              fill="none"
              style={{ x: faceX, y: faceY }}
            />
            <Motion.circle
              r={5}
              fill="black"
              style={{ x: faceX, y: faceY, translateX: faceCenterX - 10, translateY: faceCenterY + mouthOffsetY + 5 }}
            />
          </>
        ) : (
          <>
            <Motion.circle
              r={6}
              fill="black"
              style={{ x: faceX, y: faceY, translateX: faceCenterX + leftEyeOffsetX, translateY: faceCenterY + eyeOffsetY }}
              animate={{ scaleY: [1, 0.1, 1] }}
              transition={{ duration: 0.2, repeat: Infinity, repeatDelay: 2, delay: 0.5 }}
            />
            <Motion.circle
              r={6}
              fill="black"
              style={{ x: faceX, y: faceY, translateX: faceCenterX + rightEyeOffsetX, translateY: faceCenterY + eyeOffsetY }}
              animate={{ scaleY: [1, 0.1, 1] }}
              transition={{ duration: 0.2, repeat: Infinity, repeatDelay: 2, delay: 0.5 }}
            />
            {isFormFocused ? (
              <Motion.circle
                r={6}
                fill="black"
                style={{ x: faceX, y: faceY, translateX: faceCenterX, translateY: faceCenterY + mouthOffsetY + 8 }}
              />
            ) : (
              <Motion.path
                d={`M ${faceCenterX - mouthHalfWidth} ${faceCenterY + mouthOffsetY} Q ${faceCenterX} ${faceCenterY + mouthOffsetY + mouthCurveDepth}, ${faceCenterX + mouthHalfWidth} ${faceCenterY + mouthOffsetY} Z`}
                fill="black"
                style={{ x: faceX, y: faceY }}
              />
            )}
          </>
        )}
      </Motion.g>
    </Motion.g>
  );
}
