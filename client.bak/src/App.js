import React from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import TaxPayerList from './components/TaxPayerList';
import InvoiceList from './components/InvoiceList';
import VatOverview from './components/VatOverview';

// Zde se předpokládá, že logo je ve složce src
import logo from './logo.png'; 

function App() {
  return (
    <Router>
      <nav className="navbar navbar-expand-lg navbar-dark bg-primary mb-4">
        <div className="container">
          <NavLink className="navbar-brand d-flex align-items-center" to="/">
            <img src={logo} alt="EasyVAT Logo" height="30" className="me-2" />
            EasyVAT
          </NavLink>
          <div className="collapse navbar-collapse">
            <ul className="navbar-nav me-auto mb-2 mb-lg-0">
              <li className="nav-item">
                <NavLink className="nav-link" to="/taxpayers">Daňoví poplatníci</NavLink>
              </li>
              <li className="nav-item">
                <NavLink className="nav-link" to="/invoices">Faktury</NavLink>
              </li>
              <li className="nav-item">
                <NavLink className="nav-link" to="/vat-overview">Přehled DPH</NavLink>
              </li>
            </ul>
          </div>
        </div>
      </nav>
      
      <div className="container">
        <Routes>
          <Route path="/" element={<VatOverview />} />
          <Route path="/taxpayers" element={<TaxPayerList />} />
          <Route path="/invoices" element={<InvoiceList />} />
          <Route path="/vat-overview" element={<VatOverview />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;