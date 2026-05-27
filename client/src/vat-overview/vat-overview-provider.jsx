import React, { createContext, useState, useContext } from "react";

const VatOverviewContext = createContext();

const API_BASE_URL = "http://localhost:8888";

export function VatOverviewProvider({ children }) {

  const [selectedTaxPayer, setSelectedTaxPayer] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState(null);

  const [showTaxPayerModal, setShowTaxPayerModal] = useState(false);
  const [taxPayerModalData, setTaxPayerModalData] = useState(null);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [invoiceModalData, setInvoiceModalData] = useState(null);

  const [refreshTaxPayersTrigger, setRefreshTaxPayersTrigger] = useState(0);
  const [refreshInvoicesTrigger, setRefreshInvoicesTrigger] = useState(0);
  const [refreshPeriodsTrigger, setRefreshPeriodsTrigger] = useState(0);

  const [alertData, setAlertData] = useState({
    show: false,
    type: "",
    message: "",
  });

  const [deleteTaxPayerData, setDeleteTaxPayerData] = useState(null);
  const [deleteInvoiceData, setDeleteInvoiceData] = useState(null);

  const handleShowAlert = (type, message) => {
    setAlertData({ show: true, type, message });
    setTimeout(() => {
      setAlertData({ show: false, type: "", message: "" });
    }, 5000);
  };

  const handleTaxPayerSelect = (tp) => {
    setSelectedTaxPayer(tp);
    setSelectedPeriod(null);
  };

  const handleOpenCreateTaxPayerModal = () => {
    setTaxPayerModalData(null);
    setShowTaxPayerModal(true);
  };
  const handleOpenEditTaxPayerModal = (tp) => {
    setTaxPayerModalData(tp);
    setShowTaxPayerModal(true);
  };
  const handleTaxPayerModalSave = () => {
    setRefreshTaxPayersTrigger((prev) => prev + 1);
  };

  const handleOpenCreateInvoiceModal = () => {
    setInvoiceModalData(null);
    setShowInvoiceModal(true);
  };
  const handleOpenEditInvoiceModal = (inv) => {
    setInvoiceModalData(inv);
    setShowInvoiceModal(true);
  };
  const handleInvoiceModalSave = () => {
    setRefreshInvoicesTrigger((prev) => prev + 1);
    setRefreshPeriodsTrigger((prev) => prev + 1);
  };

  const handleExecuteDeleteTaxPayer = async () => {
    if (!deleteTaxPayerData) return;
    const url = `${API_BASE_URL}/taxpayers/taxpayer/${deleteTaxPayerData.id}`;
    try {
      const response = await fetch(url, { method: "DELETE" });
      if (response.ok) {
        if (selectedTaxPayer?.id === deleteTaxPayerData.id) {
          setSelectedTaxPayer(null);
          setSelectedPeriod(null);
        }
        setRefreshTaxPayersTrigger((prev) => prev + 1);
        handleShowAlert("success", "Tax payer has been deleted");
      } else {
        const data = await response.json().catch(() => ({}));
        handleShowAlert(
          "danger",
          data.message || "An error occurred when deleting the tax payer",
        );
      }
    } catch (err) {
      handleShowAlert(
        "danger",
        "An error occurred when deleting the tax payer",
      );
    } finally {
      setDeleteTaxPayerData(null);
    }
  };

  const handleExecuteDeleteInvoice = async () => {
    if (!deleteInvoiceData) return;
    const url = `${API_BASE_URL}/invoices/invoice/${deleteInvoiceData.id}`;
    try {
      const response = await fetch(url, { method: "DELETE" });
      if (response.ok) {
        setRefreshInvoicesTrigger((prev) => prev + 1);
        setRefreshPeriodsTrigger((prev) => prev + 1);
        handleShowAlert("success", "Invoice has been deleted");
      } else {
        const data = await response.json().catch(() => ({}));
        handleShowAlert(
          "danger",
          data.message || "An error occurred when deleting the invoice",
        );
      }
    } catch (err) {
      handleShowAlert("danger", "An error occurred when deleting the invoice");
    } finally {
      setDeleteInvoiceData(null);
    }
  };

  const handleExportClick = async (period) => {
    if (!selectedTaxPayer) return;
    if (!window.showDirectoryPicker) {
      handleShowAlert(
        "danger",
        "Your browser does not support directory selection.",
      );
      return;
    }

    try {
      const dirHandle = await window.showDirectoryPicker({ mode: "readwrite" });
      const m = String(period.month).padStart(2, "0");
      const dpFileName = `dp_${selectedTaxPayer.vatId}_${period.year}${m}.xml`;
      const khFileName = `kh_${selectedTaxPayer.vatId}_${period.year}${m}.xml`;

      const dpUrl = `${API_BASE_URL}/export/dp?taxPayerId=${selectedTaxPayer.id}&month=${period.month}&year=${period.year}`;
      const khUrl = `${API_BASE_URL}/export/kh?taxPayerId=${selectedTaxPayer.id}&month=${period.month}&year=${period.year}`;

      const exportSingleFile = async (url, fileName) => {
        const response = await fetch(url);
        if (!response.ok) {
          let errorMsg = "An error occurred when exporting files";
          try {
            const errorData = await response.json();
            if (errorData && errorData.message) errorMsg = errorData.message;
          } catch (e) {}
          throw new Error(errorMsg);
        }
        const textData = await response.text();
        const fileHandle = await dirHandle.getFileHandle(fileName, {
          create: true,
        });
        const writable = await fileHandle.createWritable();
        await writable.write(textData);
        await writable.close();
      };

      await Promise.all([
        exportSingleFile(dpUrl, dpFileName),
        exportSingleFile(khUrl, khFileName),
      ]);
      handleShowAlert("success", "Files have been exported");
    } catch (error) {
      if (error.name === "AbortError") return;
      handleShowAlert(
        "danger",
        error.message || "An error occurred when exporting files",
      );
    }
  };

  const value = {
    API_BASE_URL,
    selectedTaxPayer,
    selectedPeriod,
    setSelectedPeriod,
    showTaxPayerModal,
    setShowTaxPayerModal,
    taxPayerModalData,
    showInvoiceModal,
    setShowInvoiceModal,
    invoiceModalData,
    refreshTaxPayersTrigger,
    refreshInvoicesTrigger,
    refreshPeriodsTrigger,
    alertData,
    setAlertData,
    deleteTaxPayerData,
    setDeleteTaxPayerData,
    deleteInvoiceData,
    setDeleteInvoiceData,
    handleTaxPayerSelect,
    handleShowAlert,
    handleOpenCreateTaxPayerModal,
    handleOpenEditTaxPayerModal,
    handleTaxPayerModalSave,
    handleOpenCreateInvoiceModal,
    handleOpenEditInvoiceModal,
    handleInvoiceModalSave,
    handleExecuteDeleteTaxPayer,
    handleExecuteDeleteInvoice,
    handleExportClick,
  };

  return (
    <VatOverviewContext.Provider value={value}>
      {children}
    </VatOverviewContext.Provider>
  );
}

export const useVatOverview = () => useContext(VatOverviewContext);
