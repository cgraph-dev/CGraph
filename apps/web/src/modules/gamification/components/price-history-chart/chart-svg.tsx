/**
 * ChartSVG - the SVG chart rendering (grid, paths, volume bars, hover indicator)
 */
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { ChartDimensions, ChartMetrics, ChartPaths, HoveredPointData } from './types';
import { GRID_PERCENTAGES, POSITIVE_COLOR, NEGATIVE_COLOR } from './constants';
import { tweens } from '@/lib/animation-presets';

interface ChartSVGProps {
  dimensions: ChartDimensions;
  metrics: ChartMetrics | null;
  paths: ChartPaths;
  showVolume: boolean;
  hoveredPoint: HoveredPointData | null;
  onMouseMove: (e: React.MouseEvent<SVGSVGElement>) => void;
  onMouseLeave: () => void;
}

/**
 * unknown for the gamification module.
 */
/**
 * Chart S V G component.
 */
export function ChartSVG({
  dimensions,
  metrics,
  paths,
  showVolume,
  hoveredPoint,
  onMouseMove,
  onMouseLeave,
}: ChartSVGProps) {
  const lineColor = metrics?.isPositive ? POSITIVE_COLOR : NEGATIVE_COLOR;

  return (
    <svg
      width={dimensions.width}
      height={dimensions.height}
      className="overflow-visible"
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
    >
      <defs>
        <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={lineColor} stopOpacity="0.3" />
          <stop offset="100%" stopColor={lineColor} stopOpacity="0" />
        </linearGradient>

        <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* Grid lines */}
      <g className="text-gray-800">
        {GRID_PERCENTAGES.map((pct) => {
          const y = 20 + (dimensions.height - 60) * pct;
          const price = metrics ? metrics.max - metrics.range * pct : 0;
          return (
            <g key={pct}>
              <line
                x1={60}
                y1={y}
                x2={dimensions.width - 20}
                y2={y}
                stroke="currentColor"
                strokeWidth="1"
                strokeDasharray="4,4"
              />
              <text x={55} y={y + 4} textAnchor="end" className="fill-gray-500 text-xs">
                {price.toLocaleString()}
              </text>
            </g>
          );
        })}
      </g>

      {/* Volume bars */}
      {showVolume && (
        <g>
          {paths.volumeBars.map((bar, i) => (
            <rect
              key={i}
              x={bar.x}
              y={bar.y}
              width={bar.width}
              height={bar.height}
              fill="rgba(255, 255, 255, 0.1)"
              rx="1"
            />
          ))}
        </g>
      )}

      {/* Area fill */}
      <motion.path
        d={paths.areaPath}
        fill="url(#areaGradient)"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={tweens.smooth}
      />

      {/* Main line */}
      <motion.path
        d={paths.linePath}
        fill="none"
        stroke={lineColor}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        filter="url(#glow)"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={tweens.slow}
      />

      {/* Hover indicator */}
      <AnimatePresence>
        {hoveredPoint && (
          <g>
            <motion.line
              x1={hoveredPoint.x}
              y1={20}
              x2={hoveredPoint.x}
              y2={dimensions.height - 40}
              stroke="rgba(255, 255, 255, 0.3)"
              strokeWidth="1"
              strokeDasharray="4,4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />
            <motion.circle
              cx={hoveredPoint.x}
              cy={hoveredPoint.y}
              r="6"
              fill={lineColor}
              stroke="white"
              strokeWidth="2"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
            />
          </g>
        )}
      </AnimatePresence>
    </svg>
  );
}
