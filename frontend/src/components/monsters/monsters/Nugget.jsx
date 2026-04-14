import { motion as Motion, useMotionValue, useSpring, useTransform } from 'motion/react';
import { useEffect } from 'react';

export function Nugget({ cursorX, cursorY, isFormFocused = false, isPasswordVisible = false }) {
  const bodyLeft = 320;
  const bodyRight = 420;
  const bodyTop = 230;
  const bodyWidth = bodyRight - bodyLeft;
  const bodyCenterX = bodyLeft + bodyWidth / 2;
  const faceCenterX = bodyCenterX;
  const faceCenterY = bodyTop - 10;

  const avertRotation = useMotionValue(0);
  const smoothAvertRotation = useSpring(avertRotation, { stiffness: 100, damping: 15 });

  useEffect(() => {
    avertRotation.set(isPasswordVisible ? -1 : 0);
  }, [isPasswordVisible, avertRotation]);

  const rotationFactor = useSpring(
    useTransform([cursorX, smoothAvertRotation], ([cx, avert]) => {
      if (isPasswordVisible) {
        return avert;
      }
      return Math.max(-1, Math.min(1, (cx - faceCenterX) / 150));
    }),
    { stiffness: 100, damping: 15 }
  );

  const verticalFactor = useSpring(
    useTransform(cursorY, (cy) => Math.max(-1, Math.min(1, (cy - faceCenterY) / 150))),
    { stiffness: 100, damping: 15 }
  );

  const leftEyeX = useTransform(rotationFactor, (r) => faceCenterX - 29 + r * 36);
  const leftEyeVisible = useTransform(leftEyeX, (x) => (x > bodyLeft + 10 ? 1 : 0));
  const rightEyeX = useTransform(rotationFactor, (r) => faceCenterX + 29 + r * 36);
  const rightEyeVisible = useTransform(rightEyeX, (x) => (x < bodyRight - 10 ? 1 : 0));
  const eyeY = useTransform(verticalFactor, (v) => faceCenterY + v * 10);
  const mouthCenterX = useTransform(rotationFactor, (r) => faceCenterX + r * 30);
  const mouthY = useTransform(verticalFactor, (v) => faceCenterY + 25 + v * 5);
  const mouthWidth = useTransform(rotationFactor, (r) => 30 * (1 - Math.abs(r) * 0.26));

  const leanSkewValue = useMotionValue(0);
  const leanSkew = useSpring(leanSkewValue, { stiffness: 1000, damping: 50, mass: 0.1 });

  useEffect(() => {
    leanSkewValue.set(isFormFocused && !isPasswordVisible ? -5 : 0);
  }, [isFormFocused, isPasswordVisible, leanSkewValue]);

  return (
    <Motion.g initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5, delay: 0.4 }}>
      <Motion.g style={{ skewX: leanSkew, transformOrigin: 'bottom center' }}>
        <ellipse cx="370" cy="352" rx="54" ry="12" fill="rgba(15, 23, 42, 0.12)" />
        <path
          d="M 304 300
             Q 314 214 390 186
             Q 444 208 440 278
             Q 434 360 350 376
             Q 310 364 304 300 Z"
          fill="#f59e0b"
        />
        <path
          d="M 324 294
             Q 332 230 390 206
             Q 422 224 420 280
             Q 412 346 350 360
             Q 328 348 324 294 Z"
          fill="#fbbf24"
          opacity="0.5"
        />
        <path d="M 404 190 Q 424 156 450 166" stroke="#6caf43" strokeWidth="8" strokeLinecap="round" fill="none" />
        <Motion.circle
          r={4}
          fill="black"
          style={{ cx: leftEyeX, cy: eyeY, opacity: leftEyeVisible }}
          animate={{ scaleY: [1, 0.1, 1] }}
          transition={{ duration: 0.2, repeat: Infinity, repeatDelay: 2, delay: 1.5 }}
        />
        <Motion.circle
          r={4}
          fill="black"
          style={{ cx: rightEyeX, cy: eyeY, opacity: rightEyeVisible }}
          animate={{ scaleY: [1, 0.1, 1] }}
          transition={{ duration: 0.2, repeat: Infinity, repeatDelay: 2, delay: 1.5 }}
        />
        <Motion.line
          stroke="black"
          strokeWidth={4}
          strokeLinecap="round"
          x1={useTransform([mouthCenterX, mouthWidth], ([cx, w]) => cx - w)}
          x2={useTransform([mouthCenterX, mouthWidth], ([cx, w]) => cx + w)}
          y1={mouthY}
          y2={mouthY}
        />
      </Motion.g>
    </Motion.g>
  );
}
