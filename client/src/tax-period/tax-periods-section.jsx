import React, { useState, useEffect } from "react";
import { PaginationControls } from "../common/pagination-controls";

const API_BASE_URL = "http://localhost:8888";

export function TaxPeriodsSection({
  taxPayerId,
  selectedPeriod,
  onSelect,
  refreshTrigger,
  onExportClick,
}) {
  const [periods, setPeriods] = useState([]);
  const [limit, setLimit] = useState(3);
  const [page, setPage] = useState(1);

  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    const offset = (page - 1) * limit;
    fetch(
      `${API_BASE_URL}/taxperiods?taxPayerId=${taxPayerId}&limit=${limit}&offset=${offset}`,
      { cache: "no-store" },
    )
      .then((res) => res.json())
      .then((data) => {

        const items = data.itemList?.itemList || data.itemList || [];
        setPeriods(items);

        const total = data.pageInfo?.totalItems || 0;
        setTotalCount(total);
      })
      .catch((err) => console.error("An error occured when getting tax periods", err));
  }, [taxPayerId, page, limit, refreshTrigger]);

  const formatCurrency = (val) =>
    val != null
      ? new Intl.NumberFormat("cs-CZ", { minimumFractionDigits: 2 }).format(val)
      : "";

  // Getting month name from its number (1-12)
  const getMonthName = (monthNumber) => {
    if (!monthNumber) return "";
    const date = new Date();
    date.setMonth(monthNumber - 1);
    return date.toLocaleString("en-US", { month: "long" });
  };

  return (
    <section className="mb-5">
      <h2 className="mb-2">Tax periods</h2>
      <div className="table-responsive">
        <table className="table table-borderless table-hover align-middle">
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
                  tax payer.
                </td>
              </tr>
            ) : (
              periods.map((p, idx) => {
                const isSelected =
                  selectedPeriod?.month === p.month &&
                  selectedPeriod?.year === p.year;

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
                    <td className="text-start">
                      {getMonthName(p.month)} {p.year}
                    </td>

                    {hasData ? (
                      <>
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
                          <button
                            className="btn btn-sm btn-primary"
                            onClick={(e) => {
                              e.stopPropagation();
                              onExportClick(p);
                            }}
                          >
                            Export
                          </button>
                        </td>
                      </>
                    ) : (
                      <td colSpan="10" className="text-center text-muted">
                        No invoice records were found in the system for the
                        selected tax payer.
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