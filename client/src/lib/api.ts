import type { AnalyzeRequest, SEOAnalysisResult } from "./types";

export async function analyzeSEO(data: AnalyzeRequest): Promise<SEOAnalysisResult> {
  const response = await fetch("/api/analyze", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }

  return response.json();
}
