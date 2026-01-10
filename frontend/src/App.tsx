import { AppRoutes } from "./routes/AppRoutes";
import NotificationListener from "./components/NotificationListener";
import "./index.css";

function App() {
  return (
    <>
      <NotificationListener />
      <AppRoutes />
    </>
  );
}

export default App;
