import { useMotionValue } from 'motion/react';
import { useEffect, useRef } from 'react';
import { Violetto } from './monsters/Violetto';
import { Inky } from './monsters/Inky';
import { Gloop } from './monsters/Gloop';
import { Nugget } from './monsters/Nugget';

export function InteractiveMonsters({ isFormFocused = false, isPasswordVisible = false }) {
  const containerRef = useRef(null);
  const cursorX = useMotionValue(200);
  const cursorY = useMotionValue(200);

  useEffect(() => {
    const handleMouseMove = (event) => {
      if (!containerRef.current) {
        return;
      }

      const rect = containerRef.current.getBoundingClientRect();
      const svgX = ((event.clientX - rect.left) / rect.width) * 400;
      const svgY = ((event.clientY - rect.top) / rect.height) * 400;

      cursorX.set(svgX);
      cursorY.set(svgY);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [cursorX, cursorY]);

  return (
    <svg
      ref={containerRef}
      viewBox="0 0 400 400"
      className="monsters-svg"
      aria-label="Interactive monster characters"
    >
      <Violetto
        cursorX={cursorX}
        cursorY={cursorY}
        isFormFocused={isFormFocused}
        isPasswordVisible={isPasswordVisible}
      />
      <Inky
        cursorX={cursorX}
        cursorY={cursorY}
        isFormFocused={isFormFocused}
        isPasswordVisible={isPasswordVisible}
      />
      <Gloop
        cursorX={cursorX}
        cursorY={cursorY}
        isFormFocused={isFormFocused}
        isPasswordVisible={isPasswordVisible}
      />
      <Nugget
        cursorX={cursorX}
        cursorY={cursorY}
        isFormFocused={isFormFocused}
        isPasswordVisible={isPasswordVisible}
      />
    </svg>
  );
}
