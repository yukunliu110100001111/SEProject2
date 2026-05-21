import React, { useEffect, useMemo, useRef, useState } from 'react';

const BUBBLE_SIZE = [
  { width: 142, height: 42 },
  { width: 156, height: 42 },
  { width: 132, height: 42 },
  { width: 148, height: 42 },
  { width: 124, height: 42 },
  { width: 164, height: 42 },
  { width: 138, height: 42 },
  { width: 152, height: 42 },
];
const BUBBLE_GAP = 8;

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const toRect = (bubble, padding = 0) => ({
  left: bubble.x - padding,
  top: bubble.y - padding,
  right: bubble.x + bubble.width + padding,
  bottom: bubble.y + bubble.height + padding,
});

const intersects = (bubble, rect) =>
  bubble.x < rect.right &&
  bubble.x + bubble.width > rect.left &&
  bubble.y < rect.bottom &&
  bubble.y + bubble.height > rect.top;

const overlapsBubble = (bubble, other, padding = BUBBLE_GAP) => {
  const left = bubble.x - padding;
  const right = bubble.x + bubble.width + padding;
  const top = bubble.y - padding;
  const bottom = bubble.y + bubble.height + padding;
  return (
    left < other.x + other.width + padding &&
    right > other.x - padding &&
    top < other.y + other.height + padding &&
    bottom > other.y - padding
  );
};

const isValidBubblePosition = (bubble, shell, placedBubbles) =>
  !intersects(bubble, shell) &&
  placedBubbles.every((placedBubble) => !overlapsBubble(bubble, placedBubble));

const createInitialBubble = (index, container, shell, placedBubbles) => {
  const size = BUBBLE_SIZE[index % BUBBLE_SIZE.length];
  const lanes = [
    {
      x: shell.left - size.width - 34 - (index % 2) * 14,
      y: shell.top + 30 + (index % 4) * 96,
    },
    {
      x: shell.right + 34 + (index % 2) * 16,
      y: shell.top + 54 + (index % 4) * 88,
    },
    {
      x: shell.left + shell.width * (0.18 + index * 0.23),
      y: shell.top - size.height - 28,
    },
    {
      x: shell.left + shell.width * (0.12 + (index % 4) * 0.22),
      y: shell.bottom + 28,
    },
  ];

  const baseBubble = {
    ...size,
    vx: (index % 2 === 0 ? 0.34 : -0.38) + (index % 3) * 0.04,
    vy: (index % 2 === 0 ? 0.36 : -0.32) + (index % 4) * 0.035,
  };

  const candidates = lanes.flatMap((lane, laneIndex) =>
    Array.from({ length: 8 }, (_, offsetIndex) => ({
      x: lane.x + ((offsetIndex % 4) - 1.5) * 42 + laneIndex * 6,
      y: lane.y + (Math.floor(offsetIndex / 4) - 0.5) * 54,
    }))
  );

  const candidate =
    candidates.find((position) => {
      const bubble = {
        ...baseBubble,
        x: clamp(position.x, 12, container.width - size.width - 12),
        y: clamp(position.y, 12, container.height - size.height - 12),
      };
      return isValidBubblePosition(bubble, shell, placedBubbles);
    }) || lanes[index % lanes.length];

  return {
    ...baseBubble,
    x: clamp(candidate.x, 12, container.width - size.width - 12),
    y: clamp(candidate.y, 12, container.height - size.height - 12),
  };
};

const resolveShellCollision = (bubble, shell) => {
  if (!intersects(bubble, shell)) {
    return;
  }

  const overlaps = {
    left: bubble.x + bubble.width - shell.left,
    right: shell.right - bubble.x,
    top: bubble.y + bubble.height - shell.top,
    bottom: shell.bottom - bubble.y,
  };
  const minOverlap = Math.min(overlaps.left, overlaps.right, overlaps.top, overlaps.bottom);

  if (minOverlap === overlaps.left) {
    bubble.x = shell.left - bubble.width - 1;
    bubble.vx = -Math.abs(bubble.vx);
  } else if (minOverlap === overlaps.right) {
    bubble.x = shell.right + 1;
    bubble.vx = Math.abs(bubble.vx);
  } else if (minOverlap === overlaps.top) {
    bubble.y = shell.top - bubble.height - 1;
    bubble.vy = -Math.abs(bubble.vy);
  } else {
    bubble.y = shell.bottom + 1;
    bubble.vy = Math.abs(bubble.vy);
  }
};

const resolveBubbleCollision = (leftBubble, rightBubble) => {
  if (!overlapsBubble(leftBubble, rightBubble, BUBBLE_GAP)) {
    return;
  }

  const leftRect = toRect(leftBubble, BUBBLE_GAP);
  const rightRect = toRect(rightBubble, BUBBLE_GAP);
  const overlapX = Math.min(leftRect.right - rightRect.left, rightRect.right - leftRect.left);
  const overlapY = Math.min(leftRect.bottom - rightRect.top, rightRect.bottom - leftRect.top);

  if (overlapX <= 0 || overlapY <= 0) {
    return;
  }

  if (overlapX < overlapY) {
    const push = overlapX / 2;
    if (leftBubble.x < rightBubble.x) {
      leftBubble.x -= push;
      rightBubble.x += push;
    } else {
      leftBubble.x += push;
      rightBubble.x -= push;
    }
    const leftVelocity = leftBubble.vx;
    leftBubble.vx = rightBubble.vx;
    rightBubble.vx = leftVelocity;
  } else {
    const push = overlapY / 2;
    if (leftBubble.y < rightBubble.y) {
      leftBubble.y -= push;
      rightBubble.y += push;
    } else {
      leftBubble.y += push;
      rightBubble.y -= push;
    }
    const leftVelocity = leftBubble.vy;
    leftBubble.vy = rightBubble.vy;
    rightBubble.vy = leftVelocity;
  }
};

const resolveAllBubbleCollisions = (bubbles) => {
  for (let leftIndex = 0; leftIndex < bubbles.length; leftIndex += 1) {
    for (let rightIndex = leftIndex + 1; rightIndex < bubbles.length; rightIndex += 1) {
      resolveBubbleCollision(bubbles[leftIndex], bubbles[rightIndex]);
    }
  }
};

const AuthFloatingBubbles = ({ labels }) => {
  const containerRef = useRef(null);
  const frameRef = useRef(null);
  const bubbleStateRef = useRef([]);
  const [positions, setPositions] = useState([]);
  const visibleLabels = useMemo(() => {
    const baseLabels = labels.filter(Boolean);
    const fallbackLabels = ['Low carbon', 'Fresh', 'Chef pick'];
    return Array.from({ length: 8 }, (_, index) =>
      baseLabels[index % baseLabels.length] || fallbackLabels[index % fallbackLabels.length]
    );
  }, [labels]);

  useEffect(() => {
    const container = containerRef.current?.parentElement;
    const shell = container?.querySelector('.login-shell');
    if (!container || !shell || visibleLabels.length === 0) {
      return undefined;
    }

    const getRects = () => {
      const containerRect = container.getBoundingClientRect();
      const shellRect = shell.getBoundingClientRect();
      return {
        container: {
          width: containerRect.width,
          height: containerRect.height,
        },
        shell: {
          left: shellRect.left - containerRect.left,
          top: shellRect.top - containerRect.top,
          right: shellRect.right - containerRect.left,
          bottom: shellRect.bottom - containerRect.top,
          width: shellRect.width,
          height: shellRect.height,
        },
      };
    };

    const initialize = () => {
      const rects = getRects();
      bubbleStateRef.current = visibleLabels.reduce((bubbles, _, index) => {
        bubbles.push(createInitialBubble(index, rects.container, rects.shell, bubbles));
        return bubbles;
      }, []);
      resolveAllBubbleCollisions(bubbleStateRef.current);
      setPositions(bubbleStateRef.current.map(({ x, y }) => ({ x, y })));
    };

    const tick = () => {
      const rects = getRects();
      bubbleStateRef.current.forEach((bubble) => {
        bubble.x += bubble.vx;
        bubble.y += bubble.vy;

        if (bubble.x <= 10 || bubble.x + bubble.width >= rects.container.width - 10) {
          bubble.vx *= -1;
          bubble.x = clamp(bubble.x, 10, rects.container.width - bubble.width - 10);
        }
        if (bubble.y <= 10 || bubble.y + bubble.height >= rects.container.height - 10) {
          bubble.vy *= -1;
          bubble.y = clamp(bubble.y, 10, rects.container.height - bubble.height - 10);
        }

        resolveShellCollision(bubble, rects.shell);
      });

      resolveAllBubbleCollisions(bubbleStateRef.current);
      bubbleStateRef.current.forEach((bubble) => {
        bubble.x = clamp(bubble.x, 10, rects.container.width - bubble.width - 10);
        bubble.y = clamp(bubble.y, 10, rects.container.height - bubble.height - 10);
        resolveShellCollision(bubble, rects.shell);
      });

      setPositions(bubbleStateRef.current.map(({ x, y }) => ({ x, y })));
      frameRef.current = window.requestAnimationFrame(tick);
    };

    initialize();
    frameRef.current = window.requestAnimationFrame(tick);
    window.addEventListener('resize', initialize);

    return () => {
      if (frameRef.current) {
        window.cancelAnimationFrame(frameRef.current);
      }
      window.removeEventListener('resize', initialize);
    };
  }, [visibleLabels]);

  return (
    <div className="auth-floating-bubbles" ref={containerRef} aria-hidden="true">
      {visibleLabels.map((label, index) => (
        <span
          className={`auth-floating-bubble bubble-${index + 1}`}
          key={`${label}-${index}`}
          style={{
            transform: `translate3d(${positions[index]?.x ?? -999}px, ${positions[index]?.y ?? -999}px, 0)`,
          }}
        >
          {label}
        </span>
      ))}
    </div>
  );
};

export default AuthFloatingBubbles;
