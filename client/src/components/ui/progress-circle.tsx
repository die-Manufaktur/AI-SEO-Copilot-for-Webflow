import * as React from "react";
import { useId } from "react";

interface ProgressCircleProps {
  value: number;
  size: number;
  strokeWidth: number;
  scoreText?: string;
}

export function ProgressCircle({
  value,
  size = 120,
  strokeWidth = 25,
  scoreText = "Score",
}: ProgressCircleProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (value / 100) * circumference;
  const filterId = useId();

  // Get color based on score value - Figma thresholds (hex so SVG filter floodColor works)
  const getScoreColor = (score: number) => {
    if (score >= 67) return "#A2FFB4"; // >= 67%: Green
    if (score >= 33) return "#FFD064"; // >= 33%: Yellow
    return "#FF4343"; // < 33%: Red
  };

  // Get the score color once so we can use it for both the circle and text
  const scoreColor = getScoreColor(value);

  return (
    <div className="inline-flex flex-col items-center justify-center">
      <div className="relative inline-flex items-center justify-center">
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          style={{ transform: "rotate(-90deg)", overflow: "visible" }}
        >
          <defs>
            <filter id={filterId} x="-30%" y="-30%" width="160%" height="160%">
              <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor={scoreColor} floodOpacity="0.6" />
            </filter>
          </defs>
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="transparent"
            stroke="var(--color-bg-300)"
            strokeWidth={strokeWidth}
          />
          {/* Progress circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="transparent"
            stroke={scoreColor}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            filter={`url(#${filterId})`}
            style={{ transition: "stroke-dashoffset 1s ease-in-out" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="font-bold" style={{ color: scoreColor, fontSize: "60px", lineHeight: "1" }}>
            {Math.round(value)}
          </span>
          <span className="font-semibold mt-2" style={{ color: "var(--color-text-primary)", fontSize: "16px" }}>{scoreText}</span>
        </div>
      </div>
    </div>
  );
}

export default ProgressCircle;
