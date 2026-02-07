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
          <svg width="1.5625rem" height="1.5625rem" viewBox="0 0 31 29" fill="none" style={{ flexShrink: 0 }} aria-hidden="true">
            <g filter="url(#filter_success_stats)">
              <path d="M14.2287 4.5C14.6136 3.83333 15.5759 3.83333 15.9608 4.5L25.0541 20.25C25.439 20.9167 24.9578 21.75 24.188 21.75H6.00149C5.23169 21.75 4.75057 20.9167 5.13547 20.25L14.2287 4.5Z" fill="#A2FFB4"/>
              <path d="M14.6621 4.75C14.8546 4.41689 15.3349 4.41689 15.5274 4.75L24.6211 20.5C24.8135 20.8332 24.5731 21.2497 24.1885 21.25H6.00101C5.61641 21.2497 5.37606 20.8332 5.56839 20.5L14.6621 4.75Z" stroke="url(#paint_success_stats)"/>
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
              <linearGradient id="paint_success_stats" x1="2.59476" y1="3" x2="27.5948" y2="28" gradientUnits="userSpaceOnUse">
                <stop stopColor="white" stopOpacity="0.4"/>
                <stop offset="1" stopColor="white" stopOpacity="0"/>
              </linearGradient>
            </defs>
          </svg>
          {passed} passed
        </span>
        <span className="flex items-center gap-1.5" style={{ color: 'white' }}>
          <svg width="1.5625rem" height="1.5625rem" viewBox="0 0 31 28" fill="none" style={{ flexShrink: 0 }} aria-hidden="true">
            <g filter="url(#filter_fail_stats)">
              <path d="M15.9608 20.5C15.5759 21.1667 14.6136 21.1667 14.2287 20.5L5.13547 4.75C4.75057 4.08334 5.23169 3.25 6.00149 3.25L24.188 3.25C24.9578 3.25 25.439 4.08333 25.0541 4.75L15.9608 20.5Z" fill="#FF4343"/>
              <path d="M15.5274 20.25C15.3349 20.5831 14.8546 20.5831 14.6621 20.25L5.56839 4.5C5.37606 4.16681 5.61641 3.75035 6.00101 3.75L24.1885 3.75C24.5731 3.75035 24.8135 4.16681 24.6211 4.5L15.5274 20.25Z" stroke="url(#paint_fail_stats)"/>
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
              <linearGradient id="paint_fail_stats" x1="27.5948" y1="22" x2="2.59476" y2="-3" gradientUnits="userSpaceOnUse">
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