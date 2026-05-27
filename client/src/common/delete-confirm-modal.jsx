import React, { useState } from "react";

export function DeleteConfirmModal({
  show,
  title,
  message,
  onClose,
  onConfirm,
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!show) return null;

  const handleConfirm = async () => {
    setIsSubmitting(true);
    await onConfirm();
    setIsSubmitting(false);
  };

  return (
    <div
      className="modal fade show d-block"
      tabIndex="-1"
      style={{ backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1070 }}
    >
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content shadow">

          <div className="modal-header text-white bg-danger">
            <h5 className="modal-title fw-bold">{title}</h5>
          </div>

          <div className="modal-body p-4">
            <p className="mb-0 fs-5">{message}</p>
          </div>

          <div className="modal-footer bg-white border-top-0 pt-0">
            <button
              className="btn btn-danger px-4"
              onClick={handleConfirm}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Deleting..." : "Delete"}
            </button>
            <button
              className="btn btn-outline-secondary px-4 bg-white text-dark"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}