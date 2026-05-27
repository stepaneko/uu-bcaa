import React from "react";

export function PaginationControls({
  limit,
  setLimit,
  page,
  setPage,
  totalCount,
  hideLimitSelector = false,
}) {

  const totalPages =
    totalCount !== undefined && totalCount > 0
      ? Math.ceil(totalCount / limit)
      : 1;

  const isFirstPage = page <= 1;
  const isLastPage = page >= totalPages;

  // Array with page numbers [1, 2, 3, ...]
  const pages = [];
  for (let i = 1; i <= totalPages; i++) {
    pages.push(i);
  }

  return (
    <div className="d-flex justify-content-center align-items-center mt-3">
      <nav>
        <ul className="pagination mb-0 me-3">
          {/* Link to the first page */}
          <li className={`page-item ${isFirstPage ? "disabled" : ""}`}>
            <button
              className="page-link"
              onClick={() => setPage(1)}
              disabled={isFirstPage}
            >
              &laquo;
            </button>
          </li>
          {/* Link to the previous page */}
          <li className={`page-item ${isFirstPage ? "disabled" : ""}`}>
            <button
              className="page-link"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={isFirstPage}
            >
              &lsaquo;
            </button>
          </li>

          {/* Dynamic rendering all page numbers */}
          {pages.map((p) => (
            <li key={p} className={`page-item ${page === p ? "active" : ""}`}>
              <button className="page-link" onClick={() => setPage(p)}>
                {p}
              </button>
            </li>
          ))}

          {/* Link to the next page */}
          <li className={`page-item ${isLastPage ? "disabled" : ""}`}>
            <button
              className="page-link"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={isLastPage}
            >
              &rsaquo;
            </button>
          </li>
          {/* Link to the last page */}
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
            setPage(1); // If limit is changed the navigation returns back to the first page
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