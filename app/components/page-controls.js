"use client";

export const ITEMS_PER_PAGE = 20;

export default function PageControls({
  itemCount,
  page,
  pageSize = ITEMS_PER_PAGE,
  onPageChange
}) {
  const pageCount = Math.ceil(itemCount / pageSize);

  if (pageCount <= 1) return null;

  const firstItem = (page - 1) * pageSize + 1;
  const lastItem = Math.min(page * pageSize, itemCount);

  return (
    <nav className="page-controls" aria-label="Page navigation">
      <span className="page-summary" aria-live="polite">
        Showing {firstItem}-{lastItem} of {itemCount}
      </span>
      <div className="page-actions">
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
          aria-label="Go to previous page">
          Previous
        </button>
        <span aria-current="page">Page {page} of {pageCount}</span>
        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={page === pageCount}
          aria-label="Go to next page">
          Next
        </button>
      </div>
    </nav>
  );
}
