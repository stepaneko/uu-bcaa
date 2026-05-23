import React, { useState, useEffect } from 'react';

export default function InvoiceList() {
  const [invoices, setInvoices] = useState([]);
  const [pageInfo, setPageInfo] = useState({});
  const [taxPayerMap, setTaxPayerMap] = useState({});
  const [search, setSearch] = useState('');
  const [offset, setOffset] = useState(0);
  const limit = 10;

  useEffect(() => {
    fetchInvoices();
  }, [offset, search]);

  const fetchInvoices = async () => {
    // Volání na API s podporou search a stránkování
    const res = await fetch(`/invoices?limit=${limit}&offset=${offset}&search=${search}`);
    const data = await res.json();
    setInvoices(data.itemList || []);
    setPageInfo(data.pageInfo || {});
    setTaxPayerMap(data.taxPayerMap || {});
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setOffset(0); // Reset na první stránku při novém vyhledávání
    fetchInvoices();
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2>Faktury</h2>
        <button className="btn btn-success">
          <i className="bi bi-plus-lg me-1"></i> Přidat fakturu
        </button>
      </div>

      <form onSubmit={handleSearch} className="d-flex mb-3">
        <input 
          type="text" 
          className="form-control me-2" 
          placeholder="Hledat (číslo faktury, IČO, jméno...)" 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button className="btn btn-outline-primary" type="submit">Hledat</button>
      </form>

      <div className="card shadow-sm">
        <div className="card-body p-0">
          <table className="table table-hover mb-0">
            <thead className="table-light">
              <tr>
                <th>Poplatník</th>
                <th>Číslo faktury</th>
                <th>Datum plnění</th>
                <th>Základ daně</th>
                <th>DPH</th>
                <th>Typ faktury</th>
                <th className="text-end">Akce</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map(inv => (
                <tr key={inv.id}>
                  <td>{taxPayerMap[inv.taxPayerId] || inv.taxPayerId}</td>
                  <td>{inv.number}</td>
                  <td>{new Date(inv.taxableDate).toLocaleDateString()}</td>
                  <td>{inv.totalBase} CZK</td>
                  <td>{inv.totalVat} CZK</td>
                  <td>{inv.type === 'issued' ? 'Vydaná' : 'Přijatá'}</td>
                  <td className="text-end">
                    <button className="btn btn-sm btn-outline-primary me-2"><i className="bi bi-pencil"></i></button>
                    <button className="btn btn-sm btn-outline-danger"><i className="bi bi-trash"></i></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {pageInfo.totalPages > 1 && (
        <div className="d-flex justify-content-center mt-3">
          <button 
            className="btn btn-outline-secondary me-2" 
            disabled={pageInfo.currentPage <= 1}
            onClick={() => setOffset(offset - limit)}
          >
            Předchozí
          </button>
          <span className="align-self-center">
            Strana {pageInfo.currentPage} z {pageInfo.totalPages}
          </span>
          <button 
            className="btn btn-outline-secondary ms-2"
            disabled={pageInfo.currentPage >= pageInfo.totalPages}
            onClick={() => setOffset(offset + limit)}
          >
            Další
          </button>
        </div>
      )}
    </div>
  );
}