import type { AnalyzeRequest, SEOAnalysisResult } from "./types";

export async function analyzeSEO({ keyphrase, url }: { keyphrase: string; url: string }) {
  console.log("Sending request to /api/analyze with data:", { keyphrase, url });
  const response = await fetch("http://localhost:5000/api/analyze", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ keyphrase, url })
  });

  if (!response.ok) {
    const errorData = await response.json();
    console.error("Error response from /api/analyze:", errorData);
    throw new Error(errorData.message || "Failed to analyze SEO");
  }

  const data = await response.json();
  console.log("Received response from /api/analyze:", data);
  return data;
}
