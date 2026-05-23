import React, { useState, useEffect } from 'react';

export default function VatOverview() {
  const [taxPayers, setTaxPayers] = useState([]);
  const [selectedTaxPayer, setSelectedTaxPayer] = useState('');
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);

  useEffect(() => {
    fetch('/taxpayers')
      .then(res => res.json())
      .then(data => setTaxPayers(data));
  }, []);

  const handleExport = (type) => {
    if (!selectedTaxPayer) {
      alert("Vyberte daňového poplatníka!");
      return;
    }
    
    // Sestavení URL (předpokládáme, že backend očekává parametry v query)
    const url = `/export/${type}?taxPayerId=${selectedTaxPayer}&year=${year}&month=${month}`;
    window.open(url, '_blank');
  };

  return (
    <div className="row justify-content-center mt-5">
      <div className="col-md-6">
        <div className="card shadow">
          <div className="card-header bg-primary text-white text-center">
            <h4 className="mb-0">Přehled DPH a Exporty</h4>
          </div>
          <div className="card-body">
            <div className="mb-3">
              <label className="form-label">Daňový poplatník</label>
              <select 
                className="form-select" 
                value={selectedTaxPayer} 
                onChange={(e) => setSelectedTaxPayer(e.target.value)}
              >
                <option value="">-- Vyberte poplatníka --</option>
                {taxPayers.map(tp => (
                  <option key={tp.id} value={tp.id}>
                    {tp.type === 'company' ? tp.companyName : `${tp.firstName} ${tp.lastName}`}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="row mb-4">
              <div className="col">
                <label className="form-label">Rok</label>
                <input 
                  type="number" 
                  className="form-control" 
                  value={year} 
                  onChange={(e) => setYear(e.target.value)} 
                />
              </div>
              <div className="col">
                <label className="form-label">Měsíc</label>
                <select 
                  className="form-select" 
                  value={month} 
                  onChange={(e) => setMonth(e.target.value)}
                >
                  {[...Array(12)].map((_, i) => (
                    <option key={i+1} value={i+1}>{i+1}. měsíc</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="d-grid gap-2">
              <button 
                className="btn btn-success" 
                onClick={() => handleExport('dp')}
              >
                <i className="bi bi-file-earmark-code me-2"></i> 
                Vygenerovat XML pro Přiznání DPH
              </button>
              <button 
                className="btn btn-warning" 
                onClick={() => handleExport('kh')}
              >
                <i className="bi bi-file-earmark-check me-2"></i> 
                Vygenerovat XML pro Kontrolní hlášení
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}