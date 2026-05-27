import 'bootstrap/dist/css/bootstrap.min.css';
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./common/layout";
import VatOverview from "./vat-overview/vat-overview";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<VatOverview />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
