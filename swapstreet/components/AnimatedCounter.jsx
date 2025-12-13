"use client";

import { useEffect, useState } from "react";

// Animates numbers counting up from 0 to target value
// Parameters: target (number to count to), duration (animation time in ms), decimals (decimal places to show)
export default function AnimatedCounter({ target, duration = 2000, decimals = 0 }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
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
  }, [target, duration]);

  if (decimals > 0) {
    return count.toFixed(decimals);
  }
  return count.toLocaleString();
}
