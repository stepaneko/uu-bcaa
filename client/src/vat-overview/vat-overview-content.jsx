import React, { useContext, useState, useEffect, useMemo } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import logo from "./logo.png";

import Alert from "react-bootstrap/Alert";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import Pagination from "react-bootstrap/Pagination";
import Table from "react-bootstrap/Table";

const API_BASE_URL = "http://localhost:8888";

export default function VatOverviewContent() {
  const [selectedTaxPayer, setSelectedTaxPayer] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState(null);

  // Pomocná funkce, která při výběru nového poplatníka skryje/resetuje vybrané období
  const handleTaxPayerSelect = (tp) => {
    setSelectedTaxPayer(tp);
    setSelectedPeriod(null);
  };

  return (
    <div className="container-fluid py-4">
      <header className="mb-4">
        <img src={logo} alt="EasyVAT Logo" style={{ height: "160px" }} />
      </header>

      {/* Změna: předáváme novou funkci handleTaxPayerSelect */}
      <TaxPayersSection
        selectedTaxPayer={selectedTaxPayer}
        onSelect={handleTaxPayerSelect}
      />

      {selectedTaxPayer && (
        <TaxPeriodsSection
          taxPayerId={selectedTaxPayer.id}
          selectedPeriod={selectedPeriod}
          onSelect={setSelectedPeriod}
        />
      )}

      {/* ZMĚNA: Sekce Invoices se nyní zobrazí hned po výběru poplatníka (přidáno vyhodnocení bez vybraného období) */}
      {selectedTaxPayer && (
        <InvoicesSection
          taxPayerId={selectedTaxPayer.id}
          period={selectedPeriod}
        />
      )}
    </div>
  );
}

// --- KOMPONENTA 1: Tax Payers ---
function TaxPayersSection({ selectedTaxPayer, onSelect }) {
  const [taxPayers, setTaxPayers] = useState([]);
  const [limit, setLimit] = useState(3);
  const [page, setPage] = useState(1);

  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    const offset = (page - 1) * limit;
    fetch(`${API_BASE_URL}/taxpayers?limit=${limit}&offset=${offset}`)
      .then((res) => res.json())
      .then((data) => {
        const items = data.itemList?.itemList || data.itemList || [];
        setTaxPayers(items);

        const total = data.pageInfo?.totalItems || 0;
        setTotalCount(total);
      })
      .catch((err) => console.error("Chyba při načítání poplatníků:", err));
  }, [page, limit]);

  const formatName = (tp) => {
    if (tp.type === "individual") {
      return `${tp.title ? tp.title + " " : ""}${tp.firstName || ""} ${tp.lastName || ""}`.trim();
    }
    return tp.companyName || "";
  };

  const formatAddress = (tp) => {
    return `${tp.street} ${tp.descriptiveNumber}, ${tp.postalCode} ${tp.city}`.trim();
  };

  return (
    <section className="mb-5">
      <div className="d-flex justify-content-between align-items-center mb-2">
        <h2>Tax payers</h2>
        <button className="btn btn-primary">Create</button>
      </div>
      <div className="table-responsive">
        <table className="table table-borderless table-hover align-middle">
          <thead className="table-light">
            <tr>
              <th>Name</th>
              <th>Type</th>
              <th>VAT ID</th>
              <th>Address</th>
              <th>E-mail</th>
              <th>Phone</th>
              <th className="text-end">Actions</th>
            </tr>
          </thead>
          <tbody>
            {taxPayers.map((tp) => (
              <tr
                key={tp.id}
                className={
                  selectedTaxPayer?.id === tp.id
                    ? "table-primary cursor-pointer"
                    : "cursor-pointer"
                }
                onClick={() => onSelect(tp)}
                style={{ cursor: "pointer" }}
              >
                <td>{formatName(tp)}</td>
                <td>{tp.type === "company" ? "C" : "I"}</td>
                <td>{tp.vatId}</td>
                <td>{formatAddress(tp)}</td>
                <td>{tp.email}</td>
                <td>{tp.phoneNumber}</td>
                <td className="text-end">
                  <button className="btn btn-sm btn-outline-secondary me-2">
                    Edit
                  </button>
                  <button className="btn btn-sm btn-outline-danger">
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <PaginationControls
        limit={limit}
        setLimit={setLimit}
        page={page}
        setPage={setPage}
        totalCount={totalCount}
      />
    </section>
  );
}

// --- KOMPONENTA 2: Tax Periods ---
function TaxPeriodsSection({ taxPayerId, selectedPeriod, onSelect }) {
  const [periods, setPeriods] = useState([]);
  const [limit, setLimit] = useState(3);
  const [page, setPage] = useState(1);

  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    const offset = (page - 1) * limit;
    fetch(
      `${API_BASE_URL}/taxperiods?taxPayerId=${taxPayerId}&limit=${limit}&offset=${offset}`,
    )
      .then((res) => res.json())
      .then((data) => {
        // Opět přistupujeme k datům přes itemList
        const items = data.itemList?.itemList || data.itemList || [];
        setPeriods(items);

        const total = data.pageInfo?.totalItems || 0;
        setTotalCount(total);
      })
      .catch((err) => console.error("Chyba při načítání období:", err));
  }, [taxPayerId, page, limit]);

  // Pomocná funkce pro formátování měny
  const formatCurrency = (val) =>
    val != null
      ? new Intl.NumberFormat("cs-CZ", { minimumFractionDigits: 2 }).format(val)
      : "";

  // Pomocná funkce pro získání názvu měsíce z jeho čísla (1-12)
  const getMonthName = (monthNumber) => {
    if (!monthNumber) return "";
    const date = new Date();
    date.setMonth(monthNumber - 1);
    return date.toLocaleString("en-US", { month: "long" });
  };

  return (
    <section className="mb-5">
      <h2>Tax periods</h2>
      <div className="table-responsive">
        <table className="table table-borderless table-hover align-middle text-end">
          <thead className="table-light">
            <tr className="text-center align-middle">
              <th rowSpan="2" className="text-start">
                Month Year
              </th>
              <th rowSpan="2">Output tax base</th>
              <th rowSpan="2">Output tax</th>
              <th rowSpan="2">Input tax base</th>
              <th rowSpan="2">Input tax</th>
              <th rowSpan="2">Tax</th>
              <th className="pb-0 border-bottom-0">Output tax base</th>
              <th className="pb-0 border-bottom-0">Output tax</th>
              <th className="pb-0 border-bottom-0">Input tax base</th>
              <th className="pb-0 border-bottom-0">Input tax</th>
              <th rowSpan="2" className="text-end">
                Actions
              </th>
            </tr>
            <tr
              className="text-center text-muted"
              style={{ fontSize: "0.85em" }}
            >
              <th colspan="2" className="pt-0 border-top-0">
                <small className="text-muted fw-normal">&lt; 10 000,00</small>
              </th>
              <th colspan="2" className="pt-0 border-top-0">
                <small className="text-muted fw-normal">&lt; 10 000,00</small>
              </th>
            </tr>
          </thead>
          <tbody>
            {periods.length === 0 ? (
              <tr>
                <td colSpan="11" className="text-center text-muted py-3">
                  No invoice records were found in the system for the selected
                  tax payer and period.
                </td>
              </tr>
            ) : (
              periods.map((p, idx) => {
                const isSelected =
                  selectedPeriod?.month === p.month &&
                  selectedPeriod?.year === p.year;
                // Opravena kontrola na totalVat namísto tax
                const hasData = p.totalVat != null;

                return (
                  <tr
                    key={idx}
                    className={
                      isSelected
                        ? "table-primary cursor-pointer"
                        : "cursor-pointer"
                    }
                    onClick={() => onSelect(p)}
                    style={{ cursor: "pointer" }}
                  >
                    {/* Zobrazení měsíce s využitím nové pomocné funkce */}
                    <td className="text-start">
                      {getMonthName(p.month)} {p.year}
                    </td>

                    {hasData ? (
                      <>
                        {/* Názvy vlastností upraveny podle reálné JSON odpovědi */}
                        <td>{formatCurrency(p.outputBase)}</td>
                        <td>{formatCurrency(p.outputVat)}</td>
                        <td>{formatCurrency(p.inputBase)}</td>
                        <td>{formatCurrency(p.inputVat)}</td>
                        <td>{formatCurrency(p.totalVat)}</td>
                        <td>{formatCurrency(p.outputBase10k)}</td>
                        <td>{formatCurrency(p.outputVat10k)}</td>
                        <td>{formatCurrency(p.inputBase10k)}</td>
                        <td>{formatCurrency(p.inputVat10k)}</td>
                        <td>
                          <button className="btn btn-sm btn-primary">
                            Export
                          </button>
                        </td>
                      </>
                    ) : (
                      <td colSpan="10" className="text-center text-muted">
                        No invoice records were found in the system for the
                        selected tax payer and period.
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      <PaginationControls
        limit={limit}
        setLimit={setLimit}
        page={page}
        setPage={setPage}
        totalCount={totalCount}
      />
    </section>
  );
}

function InvoicesSection({ taxPayerId, period }) {
  const [invoices, setInvoices] = useState([]);

  useEffect(() => {
    // ZMĚNA: Pokud není vybráno období, nevoláme API a vyčistíme stav
    if (!period) {
      setInvoices([]);
      return;
    }

    fetch(
      `${API_BASE_URL}/invoices?taxPayerId=${taxPayerId}&month=${period.month}&year=${period.year}`,
    )
      .then((res) => res.json())
      .then((data) => {
        setInvoices(data.itemList || []);
      })
      .catch((err) => console.error("Chyba při načítání faktur:", err));
  }, [taxPayerId, period]);

  const sortedInvoices = useMemo(() => {
    return [...invoices].sort((a, b) => {
      if (a.type !== b.type) return a.type.localeCompare(b.type);
      if (a.taxableDate !== b.taxableDate)
        return new Date(a.taxableDate) - new Date(b.taxableDate);
      return a.number.localeCompare(b.number);
    });
  }, [invoices]);

  const formatCurrency = (val) =>
    new Intl.NumberFormat("cs-CZ", { minimumFractionDigits: 2 }).format(val);
  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return `${d.getDate()}.${d.getMonth() + 1}.${d.getFullYear()}`;
  };

  return (
    <section className="mb-5">
      {/* Tlačítko Create a nadpis jsou zobrazeny vždy */}
      <div className="d-flex justify-content-between align-items-center mb-2">
        <h2>Invoices</h2>
        <button className="btn btn-primary">Create</button>
      </div>
      <div className="table-responsive">
        <table className="table table-borderless table-hover align-middle">
          {/* Záhlaví tabulky je zobrazeno vždy */}
          <thead className="table-light">
            <tr className="align-middle">
              <th rowSpan="2">Type</th>
              <th rowSpan="2">Invoice number</th>
              <th rowSpan="2">Taxable date</th>
              <th rowSpan="2">VAT ID</th>
              <th rowSpan="2">Name</th>
              <th rowSpan="2">Description</th>
              <th className="pb-0 border-bottom-0">Price</th>
              <th rowSpan="2">VAT</th>
              <th rowSpan="2" className="text-end">
                Actions
              </th>
            </tr>
            <tr style={{ fontSize: "0.85em" }}>
              <th className="pt-0 border-top-0">
                <small className="text-muted fw-normal">excl. VAT</small>
              </th>
            </tr>
          </thead>
          <tbody>
            {/* ZMĚNA: Kontrola, zda je vybrané období */}
            {!period ? (
              <tr>
                <td colSpan="9" className="text-center text-muted py-3">
                  Invoices will be displayed after selection of a tax period
                </td>
              </tr>
            ) : sortedInvoices.length === 0 ? (
              <tr>
                <td colSpan="9" className="text-center text-muted py-3">
                  No invoice records were found for this period.
                </td>
              </tr>
            ) : (
              sortedInvoices.map((inv) => (
                <tr key={inv.id}>
                  <td>
                    {inv.type.charAt(0).toUpperCase() + inv.type.slice(1)}
                  </td>
                  <td>{inv.number}</td>
                  <td>{formatDate(inv.taxableDate)}</td>
                  <td>{inv.vatId}</td>
                  <td>{inv.name}</td>
                  <td>{inv.description}</td>
                  <td className="text-end">{formatCurrency(inv.price)}</td>
                  <td className="text-end">{formatCurrency(inv.vatValue)}</td>
                  <td className="text-end">
                    <button className="btn btn-sm btn-outline-secondary me-2">
                      Edit
                    </button>
                    <button className="btn btn-sm btn-outline-danger">
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {/* Stránkování dává smysl zobrazit pouze tehdy, když reálně máme vybrané období a data */}
      {period && invoices.length > 0 && (
        <PaginationControls
          limit={10}
          setLimit={() => {}}
          page={1}
          setPage={() => {}}
          totalCount={() => {}}
          hideLimitSelector={true}
        />
      )}
    </section>
  );
}

// --- KOMPONENTA 3: Invoices ---
/* function InvoicesSection({ taxPayerId, period }) {
  const [invoices, setInvoices] = useState([]);
  const [limit, setLimit] = useState(5);
  const [page, setPage] = useState(1);

  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    fetch(
      `${API_BASE_URL}/invoices?taxPayerId=${taxPayerId}&month=${period.month}&year=${period.year}`,
    )
      .then((res) => res.json())
      .then((data) => {
        // Preventivní ošetření pro faktury
        const items = data.itemList?.itemList || data.itemList || [];
        setInvoices(items);

        const total = data.pageInfo?.totalItems || 0;
        setTotalCount(total);
      })
      .catch((err) => console.error("Chyba při načítání faktur:", err));
  }, [taxPayerId, period]);

  // Řazení: Typ (vzestupně), Datum (vzestupně), Číslo faktury (vzestupně)
  const sortedInvoices = useMemo(() => {
    return [...invoices].sort((a, b) => {
      if (a.type !== b.type) return a.type.localeCompare(b.type);
      if (a.taxableDate !== b.taxableDate)
        return new Date(a.taxableDate) - new Date(b.taxableDate);
      return a.number.localeCompare(b.number);
    });
  }, [invoices]);

  const formatCurrency = (val) =>
    new Intl.NumberFormat("cs-CZ", { minimumFractionDigits: 2 }).format(val);
  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return `${d.getDate()}.${d.getMonth() + 1}.${d.getFullYear()}`;
  };

  return (
    <section className="mb-5">
      <div className="d-flex justify-content-between align-items-center mb-2">
        <h2>Invoices</h2>
        <button className="btn btn-primary">Create</button>
      </div>
      <div className="table-responsive">
        <table className="table table-borderless table-hover align-middle">
          <thead className="table-light">
            <tr className="align-middle">
              <th rowSpan="2">Type</th>
              <th rowSpan="2">Invoice number</th>
              <th rowSpan="2">Taxable date</th>
              <th rowSpan="2">VAT ID</th>
              <th rowSpan="2">Name</th>
              <th rowSpan="2">Description</th>
              <th className="pb-0 border-bottom-0">
                Price
              </th>
              <th rowSpan="2">VAT</th>
              <th rowSpan="2" className="text-end">
                Actions
              </th>
            </tr>
            <tr style={{ fontSize: "0.85em" }}>
              <th className="pt-0 border-top-0">
                <small className="text-muted fw-normal">excl. VAT</small>
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedInvoices.map((inv) => (
              <tr key={inv.id}>
                <td>{inv.type.charAt(0).toUpperCase() + inv.type.slice(1)}</td>
                <td>{inv.number}</td>
                <td>{formatDate(inv.taxableDate)}</td>
                <td>{inv.vatId}</td>
                <td>{inv.name}</td>
                <td>{inv.description}</td>
                <td className="text-end">{formatCurrency(inv.price)}</td>
                <td className="text-end">{formatCurrency(inv.vatValue)}</td>
                <td className="text-end">
                  <button className="btn btn-sm btn-outline-secondary me-2">
                    Edit
                  </button>
                  <button className="btn btn-sm btn-outline-danger">
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <PaginationControls
        limit={limit}
        setLimit={setLimit}
        page={page}
        setPage={setPage}
      />
    </section>
  );
} 
*/

function PaginationControls({
  limit,
  setLimit,
  page,
  setPage,
  totalCount,
  hideLimitSelector = false,
}) {
  // Výpočet celkového počtu stránek
  const totalPages =
    totalCount !== undefined && totalCount > 0
      ? Math.ceil(totalCount / limit)
      : 1;

  const isFirstPage = page <= 1;
  const isLastPage = page >= totalPages;

  // Vytvoření pole s čísly stránek [1, 2, 3, ...] pro vykreslení
  const pages = [];
  for (let i = 1; i <= totalPages; i++) {
    pages.push(i);
  }

  return (
    <div className="d-flex justify-content-center align-items-center mt-3">
      <nav>
        <ul className="pagination mb-0 me-3">
          {/* Tlačítko na první stránku */}
          <li className={`page-item ${isFirstPage ? "disabled" : ""}`}>
            <button
              className="page-link"
              onClick={() => setPage(1)}
              disabled={isFirstPage}
            >
              &laquo;
            </button>
          </li>
          {/* Tlačítko na předchozí stránku */}
          <li className={`page-item ${isFirstPage ? "disabled" : ""}`}>
            <button
              className="page-link"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={isFirstPage}
            >
              &lsaquo;
            </button>
          </li>

          {/* Dynamické vykreslení všech čísel stránek */}
          {pages.map((p) => (
            <li key={p} className={`page-item ${page === p ? "active" : ""}`}>
              <button className="page-link" onClick={() => setPage(p)}>
                {p}
              </button>
            </li>
          ))}

          {/* Tlačítko na další stránku */}
          <li className={`page-item ${isLastPage ? "disabled" : ""}`}>
            <button
              className="page-link"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={isLastPage}
            >
              &rsaquo;
            </button>
          </li>
          {/* Tlačítko na poslední stránku */}
          <li className={`page-item ${isLastPage ? "disabled" : ""}`}>
            <button
              className="page-link"
              onClick={() => setPage(totalPages)}
              disabled={isLastPage}
            >
              &raquo;
            </button>
          </li>
        </ul>
      </nav>
      {!hideLimitSelector && (
        <select
          className="form-select form-select-sm w-auto"
          value={limit}
          onChange={(e) => {
            setLimit(Number(e.target.value));
            setPage(1); // Při změně limitu se vždy vrátíme na 1. stránku
          }}
        >
          <option value="3">3</option>
          <option value="5">5</option>
          <option value="10">10</option>
          <option value="20">20</option>
        </select>
      )}
    </div>
  );
}

// --- POMOCNÁ KOMPONENTA: Stránkování ---
/* function PaginationControls({
  limit,
  setLimit,
  page,
  setPage,
  totalCount,
  hideLimitSelector = false,
}) {
  // Výpočet celkového počtu stránek (pokud totalCount chybí, předpokládáme minimálně 1 stránku)
  const totalPages =
    totalCount !== undefined && totalCount > 0
      ? Math.ceil(totalCount / limit)
      : 1;

  const isFirstPage = page <= 1;
  const isLastPage = page >= totalPages;

  return (
    <div className="d-flex justify-content-center align-items-center mt-3">
      <nav>
        <ul className="pagination mb-0 me-3">
          <li className={`page-item ${isFirstPage ? "disabled" : ""}`}>
            <button
              className="page-link"
              onClick={() => setPage(1)}
              disabled={isFirstPage}
            >
              &laquo;
            </button>
          </li>
          <li className={`page-item ${isFirstPage ? "disabled" : ""}`}>
            <button
              className="page-link"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={isFirstPage}
            >
              &lsaquo;
            </button>
          </li>
          <li className="page-item active">
            <span className="page-link">{page}</span>
          </li>
          <li className={`page-item ${isLastPage ? "disabled" : ""}`}>
            <button
              className="page-link"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={isLastPage}
            >
              &rsaquo;
            </button>
          </li>
          <li className={`page-item ${isLastPage ? "disabled" : ""}`}>
            <button
              className="page-link"
              onClick={() => setPage(totalPages)}
              disabled={isLastPage}
            >
              &raquo;
            </button>
          </li>
        </ul>
      </nav>
      {!hideLimitSelector && (
        <select
          className="form-select form-select-sm w-auto"
          value={limit}
          onChange={(e) => {
            setLimit(Number(e.target.value));
            setPage(1);
          }}
        >
          <option value="3">3</option>
          <option value="5">5</option>
          <option value="10">10</option>
          <option value="20">20</option>
        </select>
      )}
    </div>
  );
}
 */
