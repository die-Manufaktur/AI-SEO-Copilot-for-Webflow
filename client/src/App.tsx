import { Switch, Route } from "wouter";
import Home from "./pages/Home";

const App = () => {
  return (
    <Switch>
      {/* Add pages below */}
      <Route path="/" component={Home} />
    </Switch>
  );
}

export default App;