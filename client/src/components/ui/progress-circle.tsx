import * as React from "react";

interface ProgressCircleProps {
  value: number;
  size: number;
  strokeWidth: number;
  scoreText?: string;
}

export function ProgressCircle({
  value,
  size = 120,
  strokeWidth = 10,
  scoreText = "Score",
}: ProgressCircleProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (value / 100) * circumference;
  
  // Get color based on score value - Figma thresholds
  const getScoreColor = (score: number) => {
    if (score >= 90) return "var(--score-high)"; // High: Green #63D489
    if (score >= 75) return "var(--score-good)"; // Good: Blue #5AA9FF
    if (score >= 60) return "var(--score-fair)"; // Fair: Yellow #FFDD64
    return "var(--score-low)"; // Low: Red #FF8484
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
          style={{ transform: "rotate(-90deg)" }}
        >
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="transparent"
            stroke="rgba(255, 255, 255, 0.08)"
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
            strokeLinecap="round"
            style={{ transition: "stroke-dashoffset 1s ease-in-out" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="font-bold" style={{ color: scoreColor, fontSize: "60px", lineHeight: "1" }}>
            {Math.round(value)}
          </span>
          <span className="font-semibold mt-2" style={{ color: "#ffffff", fontSize: "16px" }}>{scoreText}</span>
        </div>
      </div>
    </div>
  );
}

export default ProgressCircle;
