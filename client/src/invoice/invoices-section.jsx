import React, { useState, useEffect, useMemo } from "react";
import { PaginationControls } from "../common/pagination-controls";

const API_BASE_URL = "http://localhost:8888";

export function InvoicesSection({
  taxPayerId,
  period,
  refreshTrigger,
  onCreateClick,
  onEditClick,
  onDeleteClick,
}) {
  const [invoices, setInvoices] = useState([]);

  const [limit, setLimit] = useState(10);
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (!period) {
      setInvoices([]);
      return;
    }

    fetch(
      `${API_BASE_URL}/invoices?taxPayerId=${taxPayerId}&month=${period.month}&year=${period.year}`,
      { cache: "no-store" },
    )
      .then((res) => res.json())
      .then((data) => {
        setInvoices(data.itemList || []);
        setPage(1); // If new data is loaded, paging is reset to the first page
      })
      .catch((err) => console.error("An error occurred when getting invoices", err));
  }, [taxPayerId, period, refreshTrigger]);

  const sortedInvoices = useMemo(() => {
    return [...invoices].sort((a, b) => {
      if (a.type !== b.type) return a.type.localeCompare(b.type);
      if (a.taxableDate !== b.taxableDate)
        return new Date(b.taxableDate) - new Date(a.taxableDate);
      return a.invoiceNumber.localeCompare(b.invoiceNumber);
    });
  }, [invoices]);

  const paginatedInvoices = useMemo(() => {
    const numLimit = Number(limit);
    const startIndex = (page - 1) * numLimit;
    return sortedInvoices.slice(startIndex, startIndex + numLimit);
  }, [sortedInvoices, page, limit]);

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
        <button className="btn btn-primary" onClick={onCreateClick}>
          Create
        </button>
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
              paginatedInvoices.map(inv => (
                <tr key={inv.id}>
                  <td>
                    {inv.type.charAt(0).toUpperCase() + inv.type.slice(1)}
                  </td>
                  <td>{inv.invoiceNumber}</td>
                  <td>{formatDate(inv.taxableDate)}</td>
                  <td>{inv.vatId}</td>
                  <td>{inv.name}</td>
                  <td>{inv.description}</td>
                  <td className="text-end">{formatCurrency(inv.price)}</td>
                  <td className="text-end">{formatCurrency(inv.vatValue)}</td>
                  <td className="text-end text-nowrap w-1">
                    <button
                      className="btn btn-sm btn-outline-secondary me-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditClick(inv);
                      }}
                    >
                      Edit
                    </button>
                    <button
                      className="btn btn-sm btn-outline-danger"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteClick(inv);
                      }}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {period && invoices.length > 0 && (
        <PaginationControls
          limit={limit}
          setLimit={setLimit}
          page={page}
          setPage={setPage}
          totalCount={sortedInvoices.length}
          hideLimitSelector={false}
        />
      )}
    </section>
  );
}