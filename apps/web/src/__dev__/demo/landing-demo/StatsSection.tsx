/**
 * Stats Section Component
 */

import { forwardRef } from 'react';
import { stats } from './constants';

export const StatsSection = forwardRef<HTMLDivElement>(function StatsSection(_props, ref) {
  return (
    <section ref={ref} className="stats-section zoom-section">
      <div className="stats-grid">
        {stats.map((stat) => (
          <div key={stat.label} className="stat-card">
            <span className="stat-card__icon">{stat.icon}</span>
            <span className="stat-card__value font-zentry">{stat.value}</span>
            <span className="stat-card__label font-robert">{stat.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
});
