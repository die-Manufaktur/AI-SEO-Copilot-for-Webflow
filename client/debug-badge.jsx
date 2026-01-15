import { DevBadge } from "./src/components/ui/dev-badge";
import React from "react";
import { createRoot } from "react-dom/client";

const div = document.createElement("div");
const root = createRoot(div);
root.render(<DevBadge />);
setTimeout(() => {
  console.log("Applied classes:", div.querySelector("span")?.className);
}, 100);
