import React, { useState, useEffect } from "react";
import { PaginationControls } from "../common/pagination-controls";

const API_BASE_URL = "http://localhost:8888";

export function TaxPayersSection({
  selectedTaxPayer,
  onSelect,
  onCreateClick,
  onEditClick,
  onDeleteClick,
  refreshTrigger,
}) {
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
      .catch((err) => console.error("An error occurred when getting tax payers", err));
  }, [page, limit, refreshTrigger]);

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
        <button className="btn btn-primary" onClick={onCreateClick}>
          Create
        </button>
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
                <td className="text-end text-nowrap w-1">
                  <button
                    className="btn btn-sm btn-outline-secondary me-2"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEditClick(tp);
                    }}
                  >
                    Edit
                  </button>
                  <button
                    className="btn btn-sm btn-outline-danger"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteClick(tp);
                    }}
                  >
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
