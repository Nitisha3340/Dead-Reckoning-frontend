import React, { useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(ScrollTrigger, useGSAP);

const SplitText = ({
  text,
  className = '',
  delay = 50,
  duration = 0.6,
  ease = 'power3.out',
  from = { opacity: 0, y: 40 },
  to = { opacity: 1, y: 0 },
  threshold = 0.1,
  textAlign = 'center',
  onLetterAnimationComplete
}) => {
  const containerRef = useRef(null);

  useGSAP(() => {
    if (!containerRef.current) return;
    const chars = containerRef.current.querySelectorAll('.split-char');

    gsap.fromTo(
      chars,
      { ...from },
      {
        ...to,
        duration,
        ease,
        stagger: delay / 1000,
        scrollTrigger: {
          trigger: containerRef.current,
          start: `top ${100 - threshold * 100}%`,
          once: true
        },
        onComplete: () => {
          if (onLetterAnimationComplete) {
            onLetterAnimationComplete();
          }
        }
      }
    );
  }, { scope: containerRef, dependencies: [text, delay, duration, threshold] });

  // Custom split logic since GSAP SplitText is a premium plugin
  const words = text.split(' ').map((word, wordIndex) => (
    <span key={wordIndex} style={{ display: 'inline-block', whiteSpace: 'nowrap' }} className="split-word">
      {word.split('').map((char, charIndex) => (
        <span
          key={charIndex}
          className="split-char"
          style={{ display: 'inline-block', willChange: 'transform, opacity' }}
        >
          {char}
        </span>
      ))}
      <span className="split-char" style={{ display: 'inline-block', whiteSpace: 'pre' }}> </span>
    </span>
  ));

  return (
    <div ref={containerRef} className={`split-parent ${className}`} style={{ textAlign }}>
      {words}
    </div>
  );
};

export default SplitText;
