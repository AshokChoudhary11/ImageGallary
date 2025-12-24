import "./App.css";
import { PWABanner } from "./component/PwaBanner";
import { Screen1 } from "./pages/screen1";
import { Screen2 } from "./pages/screen2";

function App() {
  return (
    <div className="App">
      <Screen1 />
      <br></br>
      <Screen2 />
      <PWABanner />
    </div>
  );
}

export default App;
