import { useSpring, useTransform } from 'motion/react';

export function useEyeTracking(eyeX, eyeY, cursorX, cursorY, options = {}) {
  const config =
    typeof options === 'number' ? { maxPupilDistance: options, maxEyeShift: 0 } : options;

  const maxPupilDistance = config.maxPupilDistance ?? 6;
  const maxEyeShift = config.maxEyeShift ?? 8;

  const angle = useTransform([cursorX, cursorY], ([cx, cy]) =>
    Math.atan2(cy - eyeY, cx - eyeX)
  );

  const normalizedDistance = useTransform([cursorX, cursorY], ([cx, cy]) => {
    const dx = cx - eyeX;
    const dy = cy - eyeY;
    return Math.min(Math.sqrt(dx * dx + dy * dy) / 100, 1);
  });

  const eyeOffsetX = useSpring(
    useTransform([angle, normalizedDistance], ([a, d]) => Math.cos(a) * d * maxEyeShift),
    { stiffness: 120, damping: 20 }
  );

  const eyeOffsetY = useSpring(
    useTransform([angle, normalizedDistance], ([a, d]) => Math.sin(a) * d * maxEyeShift),
    { stiffness: 120, damping: 20 }
  );

  const pupilX = useSpring(
    useTransform([angle, normalizedDistance], ([a, d]) => Math.cos(a) * d * maxPupilDistance),
    { stiffness: 150, damping: 15 }
  );

  const pupilY = useSpring(
    useTransform([angle, normalizedDistance], ([a, d]) => Math.sin(a) * d * maxPupilDistance),
    { stiffness: 150, damping: 15 }
  );

  return { eyeOffsetX, eyeOffsetY, pupilX, pupilY };
}

export function useFaceTracking(faceCenterX, faceCenterY, cursorX, cursorY, options = {}) {
  const maxFaceShift = options.maxFaceShift ?? 15;
  const maxPupilDistance = options.maxPupilDistance ?? 4;

  const angle = useTransform([cursorX, cursorY], ([cx, cy]) =>
    Math.atan2(cy - faceCenterY, cx - faceCenterX)
  );

  const normalizedDistance = useTransform([cursorX, cursorY], ([cx, cy]) => {
    const dx = cx - faceCenterX;
    const dy = cy - faceCenterY;
    return Math.min(Math.sqrt(dx * dx + dy * dy) / 150, 1);
  });

  const faceOffsetX = useSpring(
    useTransform([angle, normalizedDistance], ([a, d]) => Math.cos(a) * d * maxFaceShift),
    { stiffness: 100, damping: 20 }
  );

  const faceOffsetY = useSpring(
    useTransform([angle, normalizedDistance], ([a, d]) => Math.sin(a) * d * maxFaceShift),
    { stiffness: 100, damping: 20 }
  );

  const pupilOffsetX = useSpring(
    useTransform([angle, normalizedDistance], ([a, d]) => Math.cos(a) * d * maxPupilDistance),
    { stiffness: 180, damping: 12 }
  );

  const pupilOffsetY = useSpring(
    useTransform([angle, normalizedDistance], ([a, d]) => Math.sin(a) * d * maxPupilDistance),
    { stiffness: 180, damping: 12 }
  );

  return { faceOffsetX, faceOffsetY, pupilOffsetX, pupilOffsetY };
}
