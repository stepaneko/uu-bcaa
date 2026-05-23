import { BrowserRouter, Routes, Route } from "react-router-dom";
import VatOverview from "./vat-overview/vat-overview";

function App() {
  return (
    <div>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<VatOverview />}>
          </Route>
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
