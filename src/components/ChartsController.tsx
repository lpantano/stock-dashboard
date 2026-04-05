import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import YearChart from './YearChart';
import type { YearData } from '../types';

interface Props {
  years: YearData[];
}

const OPTIONS = ['Full Year', 'Time Machine'] as const;

export default function ChartsController({ years }: Props) {
  const [timeMachine, setTimeMachine] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [thumbStyle, setThumbStyle] = useState({ width: 0, transform: 'translateX(0px)' });
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    const activeIndex = timeMachine ? 1 : 0;
    const btn = buttonRefs.current[activeIndex];
    const container = containerRef.current;
    if (!btn || !container) return;
    const containerLeft = container.getBoundingClientRect().left;
    const btnRect = btn.getBoundingClientRect();
    setThumbStyle({
      width: btnRect.width,
      transform: `translateX(${btnRect.left - containerLeft - 3}px)`,
    });
  }, [timeMachine, mounted]);

  if (!mounted) return null;

  return (
    <>
      <div className="view-toggle">
        <div
          ref={containerRef}
          style={{
            position: 'relative',
            display: 'inline-flex',
            background: 'var(--bg)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            padding: '3px',
          }}
        >
          {/* Sliding thumb */}
          <div
            aria-hidden="true"
            style={{
              position: 'absolute',
              top: 3,
              left: 0,
              height: 'calc(100% - 6px)',
              borderRadius: 7,
              background: 'var(--accent-dim)',
              boxShadow: '0 1px 4px rgba(79,126,240,0.25)',
              width: thumbStyle.width,
              transform: thumbStyle.transform,
              transition: `transform var(--duration-base) var(--ease-spring), width var(--duration-base) var(--ease-spring)`,
              pointerEvents: 'none',
            }}
          />

          {OPTIONS.map((label, i) => {
            const isActive = i === (timeMachine ? 1 : 0);
            return (
              <button
                key={label}
                ref={(el) => { buttonRefs.current[i] = el; }}
                onClick={() => setTimeMachine(i === 1)}
                style={{
                  position: 'relative',
                  zIndex: 1,
                  background: 'transparent',
                  border: 'none',
                  borderRadius: 7,
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.78rem',
                  padding: '0.35rem 1rem',
                  cursor: 'pointer',
                  color: isActive ? 'var(--accent-bright)' : 'var(--muted)',
                  transition: `color var(--duration-fast) var(--ease-out)`,
                  whiteSpace: 'nowrap',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    (e.currentTarget as HTMLButtonElement).style.color = 'var(--muted-strong)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    (e.currentTarget as HTMLButtonElement).style.color = 'var(--muted)';
                  }
                }}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {years.map((y) => {
        const slot = document.getElementById(`chart-${y.year}`);
        if (!slot) return null;
        return createPortal(
          <YearChart
            key={y.year}
            year={y.year}
            bars={y.bars}
            yearOpen={y.yearOpen}
            timeMachine={timeMachine}
          />,
          slot
        );
      })}
    </>
  );
}
