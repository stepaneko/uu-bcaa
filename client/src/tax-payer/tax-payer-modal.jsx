import React, { useState, useEffect } from "react";

// Pomocná komponenta pro zobrazení červené hvězdičky u povinných polí
const RequiredMark = () => <span className="text-danger ms-1">*</span>;

export function TaxPayerModal({
  show,
  taxPayer,
  onClose,
  onSave,
  apiBaseUrl,
  onShowAlert,
}) {
  // Výchozí stav formuláře
  const defaultFormState = {
    type: "individual", // V UI reprezentováno jako 'I', na server posíláme 'individual'
    title: "",
    firstName: "",
    lastName: "",
    companyName: "",
    vatId: "",
    street: "",
    descriptiveNumber: "",
    referenceNumber: "",
    city: "",
    postalCode: "",
    email: "",
    phoneNumber: "",
  };

  const [formData, setFormData] = useState(defaultFormState);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Inicializace dat při otevření modálu (buď prázdný formulář nebo data pro úpravu)
  useEffect(() => {
    if (show) {
      setFormData(taxPayer || defaultFormState);
      setErrors({});
    }
  }, [show, taxPayer]);

  if (!show) return null;

  const isIndividual = formData.type === "individual";
  const isCompany = formData.type === "company";

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => {
      const newData = { ...prev, [name]: value };

      // Pokud měníme typ poplatníka, vymažeme ihned irelevantní pole
      if (name === "type") {
        if (value === "individual") {
          newData.companyName = "";
        } else if (value === "company") {
          newData.title = "";
          newData.firstName = "";
          newData.lastName = "";
        }
      }
      return newData;
    });

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const validate = () => {
    const newErrors = {};
    const requiredMsg = "This field is required";

    // Povinná pole podle schématu a návrhu
    if (!formData.vatId) newErrors.vatId = requiredMsg;
    if (!formData.street) newErrors.street = requiredMsg;
    if (!formData.descriptiveNumber) newErrors.descriptiveNumber = requiredMsg;
    if (!formData.city) newErrors.city = requiredMsg;
    if (!formData.postalCode) newErrors.postalCode = requiredMsg;
    if (!formData.email) newErrors.email = requiredMsg;
    if (!formData.phoneNumber) newErrors.phoneNumber = requiredMsg;

    // Logika povinnosti jmen na základě typu
    if (isIndividual) {
      if (!formData.firstName) newErrors.firstName = requiredMsg;
      if (!formData.lastName) newErrors.lastName = requiredMsg;
    } else if (isCompany) {
      if (!formData.companyName) newErrors.companyName = requiredMsg;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setIsSubmitting(true);

    const payload = { ...formData };
    if (isIndividual) {
      payload.companyName = null;
    } else {
      payload.firstName = null;
      payload.lastName = null;
      payload.title = null;
    }

    const isUpdate = !!payload.id;
    const url = isUpdate
      ? `${apiBaseUrl}/taxpayers/taxpayer/${payload.id}`
      : `${apiBaseUrl}/taxpayers/taxpayer`;

    const method = isUpdate ? "PUT" : "POST";
    const defaultErrorMsg = isUpdate
      ? "An error occurred when updating the tax payer"
      : "An error occurred when creating a new tax payer";
    const successMsg = isUpdate
      ? "Tax payer successfully updated."
      : "Tax payer successfully created.";

    try {
      const response = await fetch(url, {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        onSave();
        onClose();
        onShowAlert("success", successMsg); // Úspěšný alert
      } else {
        let errorMsg = defaultErrorMsg;
        try {
          // Zkusíme vytáhnout message ze serveru
          const errorData = await response.json();
          if (errorData && errorData.message) {
            errorMsg = errorData.message;
          }
        } catch (e) {
          // Pokud odpověď není platný JSON, použijeme výchozí zprávu
        }
        onShowAlert("danger", errorMsg); // Chybový alert
      }
    } catch (error) {
      onShowAlert("danger", "Network error occurred.");
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
          {/* Hlavička modálu */}
          <div
            className="modal-header text-white"
            style={{ backgroundColor: "#458ccf" }}
          >
            <h5 className="modal-title fw-bold">Tax payer</h5>
          </div>

          {/* Tělo modálu */}
          <div className="modal-body p-4">
            {/* 1. Řádek: Type, Title, First name, Last name */}
            <div className="row mb-3 align-items-end">
              <div className="col-md-2">
                <label className="form-label">
                  Type
                  <RequiredMark />
                </label>
                <select
                  className="form-select"
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                >
                  <option value="individual">I</option>
                  <option value="company">C</option>
                </select>
              </div>
              <div className="col-md-2">
                <label className="form-label">Title</label>
                <input
                  type="text"
                  className="form-control"
                  name="title"
                  value={formData.title || ""}
                  onChange={handleChange}
                  disabled={isCompany}
                />
              </div>
              <div className="col-md-4">
                <label className="form-label">
                  First name{isIndividual && <RequiredMark />}
                </label>
                <input
                  type="text"
                  className={`form-control ${errors.firstName ? "is-invalid" : ""}`}
                  name="firstName"
                  value={formData.firstName || ""}
                  onChange={handleChange}
                  disabled={isCompany}
                />
                {errors.firstName && (
                  <div className="invalid-feedback">{errors.firstName}</div>
                )}
              </div>
              <div className="col-md-4">
                <label className="form-label">
                  Last name{isIndividual && <RequiredMark />}
                </label>
                <input
                  type="text"
                  className={`form-control ${errors.lastName ? "is-invalid" : ""}`}
                  name="lastName"
                  value={formData.lastName || ""}
                  onChange={handleChange}
                  disabled={isCompany}
                />
                {errors.lastName && (
                  <div className="invalid-feedback">{errors.lastName}</div>
                )}
              </div>
            </div>

            {/* 2. Řádek: Company name, VAT ID */}
            <div className="row mb-3">
              <div className="col-md-6">
                <label className="form-label">
                  Company name{isCompany && <RequiredMark />}
                </label>
                <input
                  type="text"
                  className={`form-control ${errors.companyName ? "is-invalid" : ""}`}
                  name="companyName"
                  value={formData.companyName || ""}
                  onChange={handleChange}
                  disabled={isIndividual}
                />
                {errors.companyName && (
                  <div className="invalid-feedback">{errors.companyName}</div>
                )}
              </div>
              <div className="col-md-6">
                <label className="form-label">
                  VAT ID
                  <RequiredMark />
                </label>
                <input
                  type="text"
                  className={`form-control ${errors.vatId ? "is-invalid" : ""}`}
                  name="vatId"
                  value={formData.vatId || ""}
                  onChange={handleChange}
                />
                {errors.vatId && (
                  <div className="invalid-feedback">{errors.vatId}</div>
                )}
              </div>
            </div>

            {/* 3. Řádek: Street, Desc no., Ref no. */}
            <div className="row mb-3">
              <div className="col-md-6">
                <label className="form-label">
                  Street
                  <RequiredMark />
                </label>
                <input
                  type="text"
                  className={`form-control ${errors.street ? "is-invalid" : ""}`}
                  name="street"
                  value={formData.street || ""}
                  onChange={handleChange}
                />
                {errors.street && (
                  <div className="invalid-feedback">{errors.street}</div>
                )}
              </div>
              <div className="col-md-3">
                <label className="form-label">
                  Desc. no.
                  <RequiredMark />
                </label>
                <input
                  type="text"
                  className={`form-control ${errors.descriptiveNumber ? "is-invalid" : ""}`}
                  name="descriptiveNumber"
                  value={formData.descriptiveNumber || ""}
                  onChange={handleChange}
                />
                {errors.descriptiveNumber && (
                  <div className="invalid-feedback">
                    {errors.descriptiveNumber}
                  </div>
                )}
              </div>
              <div className="col-md-3">
                <label className="form-label">Ref. no.</label>
                <input
                  type="text"
                  className="form-control"
                  name="referenceNumber"
                  value={formData.referenceNumber || ""}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* 4. Řádek: City, Postal code */}
            <div className="row mb-3">
              <div className="col-md-6">
                <label className="form-label">
                  City
                  <RequiredMark />
                </label>
                <input
                  type="text"
                  className={`form-control ${errors.city ? "is-invalid" : ""}`}
                  name="city"
                  value={formData.city || ""}
                  onChange={handleChange}
                />
                {errors.city && (
                  <div className="invalid-feedback">{errors.city}</div>
                )}
              </div>
              <div className="col-md-3">
                <label className="form-label">
                  Postal code
                  <RequiredMark />
                </label>
                <input
                  type="text"
                  className={`form-control ${errors.postalCode ? "is-invalid" : ""}`}
                  name="postalCode"
                  value={formData.postalCode || ""}
                  onChange={handleChange}
                />
                {errors.postalCode && (
                  <div className="invalid-feedback">{errors.postalCode}</div>
                )}
              </div>
            </div>

            {/* 5. Řádek: E-mail, Phone number */}
            <div className="row mb-4">
              <div className="col-md-6">
                <label className="form-label">
                  E-mail
                  <RequiredMark />
                </label>
                <div className="input-group has-validation">
                  <span className="input-group-text bg-light">@</span>
                  <input
                    type="text"
                    className={`form-control ${errors.email ? "is-invalid" : ""}`}
                    name="email"
                    value={formData.email || ""}
                    onChange={handleChange}
                  />
                  {errors.email && (
                    <div className="invalid-feedback">{errors.email}</div>
                  )}
                </div>
              </div>
              <div className="col-md-6">
                <label className="form-label">
                  Phone number
                  <RequiredMark />
                </label>
                <input
                  type="text"
                  className={`form-control ${errors.phoneNumber ? "is-invalid" : ""}`}
                  name="phoneNumber"
                  value={formData.phoneNumber || ""}
                  onChange={handleChange}
                />
                {errors.phoneNumber && (
                  <div className="invalid-feedback">{errors.phoneNumber}</div>
                )}
              </div>
            </div>
          </div>

          {/* Patička s tlačítky */}
          <div className="modal-footer bg-white border-top-0 pt-0">
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
