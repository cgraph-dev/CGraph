/**
 * StatsSection Component
 * Statistics display section
 */

import type { RefObject } from 'react';
import { stats } from './constants';

interface StatsSectionProps {
  statsRef: RefObject<HTMLDivElement | null>;
}

export function StatsSection({ statsRef }: StatsSectionProps) {
  return (
    <section ref={statsRef} className="stats">
      <div className="stats__container">
        {stats.map((stat) => (
          <div key={stat.label} className="stats__item">
            <div className="stats__value font-zentry">{stat.value}</div>
            <div className="stats__label font-robert">{stat.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
