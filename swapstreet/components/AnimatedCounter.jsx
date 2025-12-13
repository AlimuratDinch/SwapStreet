"use client";

import { useEffect, useState, useRef } from "react";

// Animates numbers counting up from 0 to target value
// Parameters: target (number to count to), duration (animation time in ms), decimals (decimal places to show), triggerOnView (animate when in viewport)
export default function AnimatedCounter({ target, duration = 2000, decimals = 0, triggerOnView = false }) {
  const [count, setCount] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);
  const elementRef = useRef(null);

  useEffect(() => {
    if (triggerOnView && !hasAnimated) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              setHasAnimated(true);
              observer.disconnect();
            }
          });
        },
        { threshold: 0.3 }
      );

      if (elementRef.current) {
        observer.observe(elementRef.current);
      }

      return () => observer.disconnect();
    } else if (!triggerOnView) {
      setHasAnimated(true);
    }
  }, [triggerOnView, hasAnimated]);

  useEffect(() => {
    if (!hasAnimated) return;

    let start = 0;
    const increment = target / (duration / 16);
    
    const timer = setInterval(() => {
      start += increment;
      
      if (start >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);

    return () => clearInterval(timer);
  }, [target, duration, hasAnimated]);

  const formattedCount = decimals > 0 ? count.toFixed(decimals) : count.toLocaleString();

  return <span ref={elementRef}>{formattedCount}</span>;
}
