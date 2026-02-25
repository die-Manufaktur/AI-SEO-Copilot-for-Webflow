import React from 'react';
import { cn } from '@/lib/utils';

interface StatsSummaryProps {
  passed: number;
  toImprove: number;
  className?: string;
}

export const StatsSummary = React.forwardRef<HTMLDivElement, StatsSummaryProps>(
  ({ passed, toImprove, className }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "inline-flex items-center gap-4 bg-background3 rounded-full px-5 py-2 w-fit mx-auto my-6 text-sm font-medium",
          className
        )}
        style={{ borderRadius: '41px' }}
        role="status"
        aria-label={`Summary: ${passed} items passed, ${toImprove} items need improvement`}
      >
        <span className="flex items-center gap-1.5" style={{ color: 'white' }}>
          <svg width="1.5625rem" height="1.5625rem" viewBox="0 0 31 29" fill="none" style={{ flexShrink: 0, stroke: 'none' }} aria-hidden="true">
            <g filter="url(#filter_success_stats)">
              <path d="M14.2287 4.5C14.6136 3.83333 15.5759 3.83333 15.9608 4.5L25.0541 20.25C25.439 20.9167 24.9578 21.75 24.188 21.75H6.00149C5.23169 21.75 4.75057 20.9167 5.13547 20.25L14.2287 4.5Z" fill="#A2FFB4" style={{ stroke: 'none' }}/>
              <path d="M14.2287 4.5C14.6136 3.83333 15.5759 3.83333 15.9608 4.5L25.0541 20.25C25.439 20.9167 24.9578 21.75 24.188 21.75H6.00149C5.23169 21.75 4.75057 20.9167 5.13547 20.25L14.2287 4.5Z" fill="url(#paint_success_stats)" style={{ stroke: 'none' }}/>
            </g>
            <defs>
              <filter id="filter_success_stats" x="0" y="1" width="30.1895" height="27.75" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
                <feFlood floodOpacity="0" result="BackgroundImageFix"/>
                <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
                <feOffset dy="2"/>
                <feGaussianBlur stdDeviation="2.5"/>
                <feComposite in2="hardAlpha" operator="out"/>
                <feColorMatrix type="matrix" values="0 0 0 0 0.282353 0 0 0 0 0.788235 0 0 0 0 0.521569 0 0 0 0.3 0"/>
                <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow"/>
                <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow" result="shape"/>
              </filter>
              <linearGradient id="paint_success_stats" x1="5.13547" y1="4.5" x2="25.0541" y2="21.75" gradientUnits="userSpaceOnUse">
                <stop stopColor="white" stopOpacity="0.4"/>
                <stop offset="1" stopColor="white" stopOpacity="0"/>
              </linearGradient>
            </defs>
          </svg>
          {passed} passed
        </span>
        <span className="flex items-center gap-1.5" style={{ color: 'white' }}>
          <svg width="1.5625rem" height="1.5625rem" viewBox="0 0 31 28" fill="none" style={{ flexShrink: 0, stroke: 'none' }} aria-hidden="true">
            <g filter="url(#filter_fail_stats)">
              <path d="M15.9608 20.5C15.5759 21.1667 14.6136 21.1667 14.2287 20.5L5.13547 4.75C4.75057 4.08334 5.23169 3.25 6.00149 3.25L24.188 3.25C24.9578 3.25 25.439 4.08333 25.0541 4.75L15.9608 20.5Z" fill="#FF4343" style={{ stroke: 'none' }}/>
              <path d="M15.9608 20.5C15.5759 21.1667 14.6136 21.1667 14.2287 20.5L5.13547 4.75C4.75057 4.08334 5.23169 3.25 6.00149 3.25L24.188 3.25C24.9578 3.25 25.439 4.08333 25.0541 4.75L15.9608 20.5Z" fill="url(#paint_fail_stats)" style={{ stroke: 'none' }}/>
            </g>
            <defs>
              <filter id="filter_fail_stats" x="0" y="0.25" width="30.1895" height="27.75" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
                <feFlood floodOpacity="0" result="BackgroundImageFix"/>
                <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
                <feOffset dy="2"/>
                <feGaussianBlur stdDeviation="2.5"/>
                <feComposite in2="hardAlpha" operator="out"/>
                <feColorMatrix type="matrix" values="0 0 0 0 0.996078 0 0 0 0 0.294118 0 0 0 0 0.145098 0 0 0 0.4 0"/>
                <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow"/>
                <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow" result="shape"/>
              </filter>
              <linearGradient id="paint_fail_stats" x1="5.13547" y1="3.25" x2="25.0541" y2="20.5" gradientUnits="userSpaceOnUse">
                <stop stopColor="white" stopOpacity="0.4"/>
                <stop offset="1" stopColor="white" stopOpacity="0"/>
              </linearGradient>
            </defs>
          </svg>
          {toImprove} to improve
        </span>
      </div>
    );
  }
);

StatsSummary.displayName = "StatsSummary";

export default StatsSummary;