const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const invoiceFolderPath = path.join(__dirname, "storage", "invoiceList");

// if data storage directory does not exist, it is automatically created
if (!fs.existsSync(invoiceFolderPath)) {
  fs.mkdirSync(invoiceFolderPath, { recursive: true });
}

// Duplicity check
function isDuplicate(invoiceList, invoiceToCheck, ignoreId = null) {
  return invoiceList.some((existingInvoice) => {
    // Record being updated is ignored
    if (ignoreId && existingInvoice.id === ignoreId) {
      return false;
    }

    if (invoiceToCheck.type === "issued" && existingInvoice.type === "issued") {
      // issued invoice: taxPayerId and number must be unique
      return (
        existingInvoice.taxPayerId === invoiceToCheck.taxPayerId &&
        existingInvoice.number === invoiceToCheck.number
      );
    } else if (
      invoiceToCheck.type === "received" &&
      existingInvoice.type === "received"
    ) {
      // received invoice: taxPayerId, number and vatId must be unique
      return (
        existingInvoice.taxPayerId === invoiceToCheck.taxPayerId &&
        existingInvoice.number === invoiceToCheck.number &&
        existingInvoice.vatId === invoiceToCheck.vatId
      );
    }
    return false;
  });
}

// Read an invoice from a file
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

// Write an invoice to a file
function create(invoice) {
  try {
    const invoiceList = list();

    // Check duplicity before creation
    if (isDuplicate(invoiceList, invoice)) {
      throw {
        code: "duplicateInvoice",
        message: "Invoice with the given parameters already exists.",
        knownError: true
      };
    }

    invoice.id = crypto.randomBytes(16).toString("hex");
    const filePath = path.join(invoiceFolderPath, `${invoice.id}.json`);
    const fileData = JSON.stringify(invoice, null, 2);
    fs.writeFileSync(filePath, fileData, "utf8");
    return invoice;
  } catch (error) {
    if (error.knownError) throw error;
    throw { code: "failedToCreateInvoice", message: error.message };
  }
}

// Update invoice in a file
function update(invoice) {
  try {
    const currentInvoice = get(invoice.id);
    if (!currentInvoice) return null;

    const newInvoice = { ...currentInvoice, ...invoice };
    const invoiceList = list();

    // Check duplicity before update
    if (isDuplicate(invoiceList, newInvoice, invoice.id)) {
      throw {
        code: "duplicateInvoice",
        message: "Invoice update would result in a duplicate.",
        knownError: true
      };
    }

    const filePath = path.join(invoiceFolderPath, `${invoice.id}.json`);
    const fileData = JSON.stringify(newInvoice, null, 2);
    fs.writeFileSync(filePath, fileData, "utf8");
    return newInvoice;
  } catch (error) {
    if (error.knownError) throw error;
    throw { code: "failedToUpdateInvoice", message: error.message };
  }
}

// Remove an invoice from a file
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

function list(options = {}) {
  try {
    const { limit, offset = 0, search, taxPayerId, month, year } = options;

    const files = fs.readdirSync(invoiceFolderPath);

    const invoiceList = files.map((file) => {
      const fileData = fs.readFileSync(
        path.join(invoiceFolderPath, file),
        "utf8"
      );
      return JSON.parse(fileData);
    });

    // Filter by taxPayerId (if provided)
    if (taxPayerId) {
      invoiceList = invoiceList.filter(
        (invoice) => invoice.taxPayerId === taxPayerId
      );
    }

    // Filter by tax period (if provided)
    if (month && year) {
      invoiceList = invoiceList.filter((invoice) => {
        const date = new Date(invoice.taxableDate);
        // getMonth() returns indices 0-11, therefore 1 is added
        return (
          date.getMonth() + 1 === parseInt(month, 10) &&
          date.getFullYear() === parseInt(year, 10)
        );
      });
    }

    // Search applied (if provided)
    if (search) {
      const searchLower = search.toLowerCase();
      invoiceList = invoiceList.filter((invoice) => {
        return (
          (invoice.number &&
            invoice.number.toLowerCase().includes(searchLower)) ||
          (invoice.name && invoice.name.toLowerCase().includes(searchLower)) ||
          (invoice.vatId &&
            invoice.vatId.toLowerCase().includes(searchLower)) ||
          (invoice.description &&
            invoice.description.toLowerCase().includes(searchLower))
        );
      });
    }

    // Sort result (from newest invoice to the oldest one)
    invoiceList.sort((a, b) => new Date(b.taxableDate) - new Date(a.taxableDate));

    // Paging applied
    const skip = parseInt(offset, 10);
    const take = limit ? parseInt(limit, 10) : invoiceList.length;

    if (skip > 0 || take < invoiceList.length) {
      invoiceList = invoiceList.slice(skip, skip + take);
    }

    return invoiceList;
  } catch (error) {
    if (error.code === "ENOENT") {
      return [];
    }
    throw { code: "failedToReadInvoices", message: error.message };
  }
}

module.exports = {
  get,
  create,
  update,
  remove,
  list
};
