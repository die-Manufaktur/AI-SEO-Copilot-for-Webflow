import React from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "./tooltip";

interface CopyTooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
}

export function CopyTooltip({ content, children }: CopyTooltipProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {children}
        </TooltipTrigger>
        <TooltipContent style={{ transform: "translateX(-54px)" }} side="top">
          {content}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}