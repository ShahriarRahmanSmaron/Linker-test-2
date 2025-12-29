import React, { useEffect, useRef, useState, useCallback } from 'react';

interface RevealProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}

// Shared IntersectionObserver for all Reveal components
// This dramatically improves performance by avoiding 30+ individual observers
type ObserverCallback = (isIntersecting: boolean) => void;
const observerCallbacks = new Map<Element, ObserverCallback>();
let sharedObserver: IntersectionObserver | null = null;

function getSharedObserver(): IntersectionObserver {
  if (!sharedObserver) {
    sharedObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const callback = observerCallbacks.get(entry.target);
          if (callback && entry.isIntersecting) {
            callback(true);
            // Unobserve after triggering to free resources
            sharedObserver?.unobserve(entry.target);
            observerCallbacks.delete(entry.target);
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px',
      }
    );
  }
  return sharedObserver;
}

function observeElement(element: Element, callback: ObserverCallback) {
  observerCallbacks.set(element, callback);
  getSharedObserver().observe(element);
}

function unobserveElement(element: Element) {
  observerCallbacks.delete(element);
  sharedObserver?.unobserve(element);
}

export const Reveal: React.FC<RevealProps> = ({ children, className = "", delay = 0 }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  const handleIntersection = useCallback((intersecting: boolean) => {
    if (intersecting) {
      setIsVisible(true);
    }
  }, []);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    observeElement(element, handleIntersection);

    return () => {
      unobserveElement(element);
    };
  }, [handleIntersection]);

  return (
    <div
      ref={ref}
      style={{ 
        transitionDelay: `${delay}ms`,
        // Use translate3d for GPU acceleration, remove will-change after animation
        transform: isVisible ? 'translate3d(0, 0, 0)' : 'translate3d(0, 48px, 0)',
        opacity: isVisible ? 1 : 0,
      }}
      className={`transition-[opacity,transform] duration-500 ease-out motion-reduce:transition-none
        ${className}
      `}
    >
      {children}
    </div>
  );
};