import React from "react";

const Pagination = ({ currentPage = 1, totalPages = 1, onPageChange }) => {
  if (totalPages <= 1) return null;

  const handlePrevious = () => {
    if (currentPage > 1) onPageChange(currentPage - 1);
  };

  const handleNext = () => {
    if (currentPage < totalPages) onPageChange(currentPage + 1);
  };

  return (
    <div className="pagination" style={{ display: "flex", justifyContent: "center", gap: "1rem", marginTop: "1.5rem" }}>
      <button
        className="page-btn"
        disabled={currentPage <= 1}
        onClick={handlePrevious}
      >
        Previous
      </button>
      <span className="page-info">
        Page {currentPage} of {totalPages}
      </span>
      <button
        className="page-btn"
        disabled={currentPage >= totalPages}
        onClick={handleNext}
      >
        Next
      </button>
    </div>
  );
};

export default Pagination;