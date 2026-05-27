import React, { useState, useEffect, useMemo } from "react";

const RequiredMark = () => <span className="text-danger ms-1">*</span>;

export function InvoiceModal({
  show,
  invoice,
  taxPayer,
  period,
  onClose,
  onSave,
  apiBaseUrl,
  onShowAlert,
}) {
  const getDefaultDate = () => {
    if (period && period.year && period.month) {
      const m = period.month.toString().padStart(2, "0");
      return `${period.year}-${m}-01`;
    }
    return new Date().toISOString().split("T")[0];
  };

  const defaultFormState = {
    taxPayerId: taxPayer?.id || "",
    type: "received", // Default: Received
    number: "",
    taxableDate: getDefaultDate(),
    vatId: "",
    name: "",
    description: "",
    price: "",
    vatValue: "",
  };

  const [formData, setFormData] = useState(defaultFormState);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (show) {
      setFormData(
        invoice
          ? { ...invoice }
          : { ...defaultFormState, taxPayerId: taxPayer?.id },
      );
      setErrors({});
    }
  }, [show, invoice, taxPayer]);

  const calculatedVat = useMemo(() => {
    const p = parseFloat(formData.price);
    return isNaN(p)
      ? ""
      : (p * 0.21).toLocaleString("cs-CZ", { minimumFractionDigits: 2 });
  }, [formData.price]);

  if (!show || !taxPayer) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: null }));
  };

  const validate = () => {
    const newErrors = {};
    const req = "Required";
    if (!formData.number) newErrors.number = req;
    if (!formData.type) newErrors.type = req;
    if (!formData.taxableDate) newErrors.taxableDate = req;
    if (!formData.vatId) newErrors.vatId = req;
    if (!formData.name) newErrors.name = req;
    if (!formData.price) newErrors.price = req;
    if (!formData.vatValue) newErrors.vatValue = req;

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setIsSubmitting(true);

    const isUpdate = !!formData.id;
    const url = isUpdate
      ? `${apiBaseUrl}/invoices/invoice/${formData.id}`
      : `${apiBaseUrl}/invoices/invoice`;

    const method = isUpdate ? "PUT" : "POST";
    const defaultErrorMsg = isUpdate
      ? "An error occurred when updating the invoice"
      : "An error occurred when creating a new invoice";

    try {
      const response = await fetch(url, {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          price: parseFloat(formData.price),
          vatValue: parseFloat(formData.vatValue),
        }),
      });

      if (response.ok) {
        onSave();
        onClose();
        onShowAlert(
          "success",
          `Invoice successfully ${isUpdate ? "updated" : "created"}.`,
        );
      } else {
        const data = await response.json().catch(() => ({}));
        onShowAlert("danger", data.message || defaultErrorMsg);
      }
    } catch (err) {
      onShowAlert("danger", "Connection error.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="modal fade show d-block"
      tabIndex="-1"
      style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
    >
      <div className="modal-dialog modal-lg modal-dialog-centered">
        <div className="modal-content shadow">
          <div
            className="modal-header text-white"
            style={{ backgroundColor: "#458ccf" }}
          >
            <h5 className="modal-title fw-bold">Invoice</h5>
          </div>

          <div className="modal-body p-4">
            {/* Tax payer setion is read-only */}
            <div className="bg-light p-3 rounded mb-4 border">
              <small className="text-muted d-block mb-2 fw-bold text-uppercase">
                Tax payer
              </small>
              <div className="row g-2 mb-2">
                <div className="col-md-2">
                  <label className="form-label small">Type</label>
                  <select
                    className="form-select form-select-sm bg-white"
                    disabled
                    value={taxPayer.type}
                  >
                    <option value="individual">I</option>
                    <option value="company">C</option>
                  </select>
                </div>
                <div className="col-md-2">
                  <label className="form-label small">Title</label>
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    disabled
                    value={taxPayer.title || ""}
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label small">First name</label>
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    disabled
                    value={taxPayer.firstName || ""}
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label small">Last name</label>
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    disabled
                    value={taxPayer.lastName || ""}
                  />
                </div>
              </div>
              <div className="row g-2">
                <div className="col-md-8">
                  <label className="form-label small">Company name</label>
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    disabled
                    value={taxPayer.companyName || ""}
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label small">VAT ID</label>
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    disabled
                    value={taxPayer.vatId || ""}
                  />
                </div>
              </div>
            </div>

            {/* Invoice section is editable */}
            <div className="row g-3 mb-3">
              <div className="col-md-4">
                <label className="form-label">
                  Invoice number
                  <RequiredMark />
                </label>
                <input
                  type="text"
                  name="number"
                  className={`form-control ${errors.number ? "is-invalid" : ""}`}
                  value={formData.number}
                  onChange={handleChange}
                />
              </div>
              <div className="col-md-4">
                <label className="form-label">
                  Type
                  <RequiredMark />
                </label>
                <select
                  name="type"
                  className="form-select"
                  value={formData.type}
                  onChange={handleChange}
                >
                  <option value="issued">Issued</option>
                  <option value="received">Received</option>
                </select>
              </div>
              <div className="col-md-4">
                <label className="form-label">
                  Taxable date
                  <RequiredMark />
                </label>
                <input
                  type="date"
                  name="taxableDate"
                  className={`form-control ${errors.taxableDate ? "is-invalid" : ""}`}
                  value={formData.taxableDate}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="row g-3 mb-3">
              <div className="col-md-4">
                <label className="form-label">
                  VAT ID
                  <RequiredMark />
                </label>
                <input
                  type="text"
                  name="vatId"
                  className={`form-control ${errors.vatId ? "is-invalid" : ""}`}
                  value={formData.vatId}
                  onChange={handleChange}
                />
              </div>
              <div className="col-md-8">
                <label className="form-label">
                  Name
                  <RequiredMark />
                </label>
                <input
                  type="text"
                  name="name"
                  className={`form-control ${errors.name ? "is-invalid" : ""}`}
                  value={formData.name}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="mb-3">
              <label className="form-label">Description</label>
              <textarea
                name="description"
                className="form-control"
                rows="2"
                value={formData.description || ""}
                onChange={handleChange}
              ></textarea>
            </div>

            <div className="row g-3 align-items-end">
              <div className="col-md-4">
                <label className="form-label">
                  Price (excl. VAT)
                  <RequiredMark />
                </label>
                <div className="input-group">
                  <input
                    type="number"
                    name="price"
                    className={`form-control ${errors.price ? "is-invalid" : ""}`}
                    value={formData.price}
                    onChange={handleChange}
                  />
                  <span className="input-group-text">CZK</span>
                </div>
              </div>
              <div className="col-md-4">
                <label className="form-label">
                  VAT value
                  <RequiredMark />
                </label>
                <div className="input-group">
                  <input
                    type="number"
                    name="vatValue"
                    className={`form-control ${errors.vatValue ? "is-invalid" : ""}`}
                    value={formData.vatValue}
                    onChange={handleChange}
                  />
                  <span className="input-group-text">CZK</span>
                </div>
              </div>
              <div className="col-md-4">
                <label className="form-label text-muted">
                  VAT value (calculated)
                </label>
                <div className="input-group">
                  <input
                    type="text"
                    className="form-control bg-light"
                    disabled
                    value={calculatedVat}
                  />
                  <span className="input-group-text">CZK</span>
                </div>
              </div>
            </div>
          </div>

          <div className="modal-footer border-top-0">
            <button
              className="btn text-white px-4"
              style={{ backgroundColor: "#458ccf" }}
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              Save
            </button>
            <button
              className="btn btn-outline-secondary px-4 bg-white text-dark"
              onClick={onClose}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}