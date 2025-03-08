import { useEffect } from "react";
import { Switch, Route } from "wouter";
import Home from "./pages/Home";

const App = () => {
  useEffect(() => {
    // Set the desired size for the extension UI
    const newSize = "large"; // You can change this to "default," "comfortable," or provide { width, height }
    // Set the Extension UI size
    webflow.setExtensionSize(newSize).catch((error) => {
      console.error("Error setting extension size:", error);
    });
  }, []);

  return (
    <Switch>
      {/* Add pages below */}
      <Route path="/" component={Home} />
    </Switch>
  );
};

export default App;