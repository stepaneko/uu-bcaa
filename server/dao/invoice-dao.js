const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const invoiceFolderPath = path.join(__dirname, "storage", "invoiceList");

// Optimalizace: Zajištění existence složky pro ukládání dat při startu
if (!fs.existsSync(invoiceFolderPath)) {
  fs.mkdirSync(invoiceFolderPath, { recursive: true });
}

// Pomocná funkce pro kontrolu duplicity
function isDuplicate(invoiceList, invoiceToCheck, ignoreId = null) {
  return invoiceList.some((existingInvoice) => {
    // Při aktualizaci ignorujeme záznam, který právě upravujeme
    if (ignoreId && existingInvoice.id === ignoreId) {
      return false;
    }

    if (invoiceToCheck.type === "issued" && existingInvoice.type === "issued") {
      // Pro vydané faktury: shoda na taxPayerId a number
      return (
        existingInvoice.taxPayerId === invoiceToCheck.taxPayerId &&
        existingInvoice.number === invoiceToCheck.number
      );
    } else if (invoiceToCheck.type === "received" && existingInvoice.type === "received") {
      // Pro přijaté faktury: shoda na taxPayerId, number a vatId
      return (
        existingInvoice.taxPayerId === invoiceToCheck.taxPayerId &&
        existingInvoice.number === invoiceToCheck.number &&
        existingInvoice.vatId === invoiceToCheck.vatId
      );
    }
    
    return false;
  });
}

// Method to read an invoice from a file
function get(invoiceId) {
  try {
    const filePath = path.join(invoiceFolderPath, `${invoiceId}.json`);
    const fileData = fs.readFileSync(filePath, "utf8");
    return JSON.parse(fileData);
  } catch (error) {
    if (error.code === "ENOENT") return null;
    throw { code: "failedToReadInvoice", message: error.message };
  }
}

// Method to write an invoice to a file
function create(invoice) {
  try {
    const invoiceList = list();

    // Kontrola duplicity před vytvořením
    if (isDuplicate(invoiceList, invoice)) {
      throw {
        code: "duplicateInvoice",
        message: "Invoice with the given parameters already exists.",
      };
    }

    invoice.id = crypto.randomBytes(16).toString("hex");
    const filePath = path.join(invoiceFolderPath, `${invoice.id}.json`);
    const fileData = JSON.stringify(invoice, null, 2);
    fs.writeFileSync(filePath, fileData, "utf8");
    return invoice;
  } catch (error) {
    // Propustíme naši vlastní chybu pro duplicitu
    if (error.code === "duplicateInvoice") throw error;
    throw { code: "failedToCreateInvoice", message: error.message };
  }
}

// Method to update invoice in a file
function update(invoice) {
  try {
    const currentInvoice = get(invoice.id);
    if (!currentInvoice) return null;

    const newInvoice = { ...currentInvoice, ...invoice };
    const invoiceList = list();

    // Kontrola duplicity před aktualizací (ignorujeme ID aktuální faktury)
    if (isDuplicate(invoiceList, newInvoice, invoice.id)) {
      throw {
        code: "duplicateInvoice",
        message: "Invoice update would result in a duplicate.",
      };
    }

    const filePath = path.join(invoiceFolderPath, `${invoice.id}.json`);
    const fileData = JSON.stringify(newInvoice, null, 2);
    fs.writeFileSync(filePath, fileData, "utf8");
    return newInvoice;
  } catch (error) {
    if (error.code === "duplicateInvoice") throw error;
    throw { code: "failedToUpdateInvoice", message: error.message };
  }
}

// Method to remove an invoice from a file
function remove(invoiceId) {
  try {
    const filePath = path.join(invoiceFolderPath, `${invoiceId}.json`);
    fs.unlinkSync(filePath);
    return {};
  } catch (error) {
    if (error.code === "ENOENT") return {};
    throw { code: "failedToRemoveInvoice", message: error.message };
  }
}

// Method to list invoices in a folder
function list() {
  try {
    const files = fs.readdirSync(invoiceFolderPath);
    const invoiceList = files.map((file) => {
      const fileData = fs.readFileSync(
        path.join(invoiceFolderPath, file),
        "utf8"
      );
      return JSON.parse(fileData);
    });
    return invoiceList;
  } catch (error) {
    throw { code: "failedToListInvoices", message: error.message };
  }
}

// Method to list invoices by taxPayerId
function listByTaxPayerId(taxPayerId) {
  const invoiceList = list();
  return invoiceList.filter((item) => item.taxPayerId === taxPayerId);
}

// DOPLNĚNÁ FUNKCE: List invoices by taxPayerId and tax period (month and year)
function listByTaxPayerIdAndTaxPeriod(taxPayerId, month, year) {
  const invoiceList = list();
  return invoiceList.filter((item) => {
    const date = new Date(item.taxableDate);
    return (
      item.taxPayerId === taxPayerId &&
      date.getMonth() + 1 === parseInt(month) &&
      date.getFullYear() === parseInt(year)
    );
  });
}

module.exports = {
  get,
  create,
  update,
  remove,
  list,
  listByTaxPayerId,
  listByTaxPayerIdAndTaxPeriod,
};