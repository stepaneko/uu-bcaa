const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const taxPayerFolderPath = path.join(__dirname, "storage", "taxPayerList");

// if data storage directory does not exist, it is automatically created
if (!fs.existsSync(taxPayerFolderPath)) {
  fs.mkdirSync(taxPayerFolderPath, { recursive: true });
}

// Duplicity check
function validateTaxPayer(taxPayer) {
  if (taxPayer.type === "individual" && !taxPayer.firstName) {
    return {
      code: "individualFirstNameMissing",
      message: "First name is missing for individual tax payer",
      knownError: true
    };
  }
  if (taxPayer.type === "individual" && !taxPayer.lastName) {
    return {
      code: "individualLastNameMissing",
      message: "Last name is missing for individual tax payer",
      knownError: true
    };
  }
  if (taxPayer.type === "individual" && taxPayer.companyName) {
    return {
      code: "individualCompanyNameNotAllowed",
      message: "Company name is not allowed for individual tax payer",
      knownError: true
    };
  }
  if (taxPayer.type === "company" && !taxPayer.companyName) {
    return {
      code: "companyNameMissing",
      message: "Company name is missing for company tax payer",
      knownError: true
    };
  }
  if (taxPayer.type === "company" && taxPayer.firstName) {
    return {
      code: "companyFirstNameNotAllowed",
      message: "First name is not allowed for company tax payer",
      knownError: true
    };
  }
  if (taxPayer.type === "company" && taxPayer.lastName) {
    return {
      code: "companyLastNameNotAllowed",
      message: "Last name is not allowed for company tax payer",
      knownError: true
    };
  }

  // No error, null is returned
  return null;
}

// Read a tax payer from a file
function get(taxPayerId) {
  try {
    const filePath = path.join(taxPayerFolderPath, `${taxPayerId}.json`);
    const fileData = fs.readFileSync(filePath, "utf8");
    return JSON.parse(fileData);
  } catch (error) {
    if (error.code === "ENOENT") return null;
    throw { code: "failedToReadTaxPayer", message: error.message };
  }
}

// Write a tax payer to a file
function create(taxPayer) {
  try {
    const taxPayerList = list();
    // vatId must be unique
    if (taxPayerList.some((item) => item.vatId === taxPayer.vatId)) {
      throw {
        code: "duplicateVatId",
        message: "Tax payer with the given vatId already exists",
        knownError: true
      };
    }

    const validationError = validateTaxPayer(taxPayer);
    if (validationError) {
      throw { code: validationError.code, message: validationError.message };
    }

    taxPayer.id = crypto.randomBytes(16).toString("hex");
    const filePath = path.join(taxPayerFolderPath, `${taxPayer.id}.json`);
    const fileData = JSON.stringify(taxPayer, null, 2);
    fs.writeFileSync(filePath, fileData, "utf8");
    return taxPayer;
  } catch (error) {
    if (error.knownError) throw error;
    throw { code: "failedToCreateTaxPayer", message: error.message };
  }
}

// Update a tax payer in a file
function update(taxPayer) {
  try {
    const currentTaxPayer = get(taxPayer.id);
    if (!currentTaxPayer) return null;

    // vatId must be unique
    if (taxPayer.vatId && taxPayer.vatId !== currentTaxPayer.vatId) {
      const taxPayerList = list();
      if (taxPayerList.some((item) => item.vatId === taxPayer.vatId)) {
        throw {
          code: "duplicateVatId",
          message: "TaxPayer with the given vatId already exists",
          knownError: true
        };
      }
    }

    const validationError = validateTaxPayer(taxPayer);
    if (validationError) {
      throw { code: validationError.code, message: validationError.message };
    }

    const newTaxPayer = { ...taxPayer, id: currentTaxPayer.id };
    const filePath = path.join(taxPayerFolderPath, `${taxPayer.id}.json`);
    const fileData = JSON.stringify(newTaxPayer, null, 2);
    fs.writeFileSync(filePath, fileData, "utf8");
    return newTaxPayer;
  } catch (error) {
    if (error.knownError) throw error;
    throw { code: "failedToUpdateTaxPayer", message: error.message };
  }
}

// Remove a tax payer from a file
function remove(taxPayerId) {
  try {
    const filePath = path.join(taxPayerFolderPath, `${taxPayerId}.json`);
    fs.unlinkSync(filePath);
    return {};
  } catch (error) {
    if (error.code === "ENOENT") {
      return {};
    }
    throw { code: "failedToRemoveTaxPayer", message: error.message };
  }
}

// List tax payers from files
function list(options = {}) {
  try {
    const { limit, offset = 0, search } = options;

    const files = fs.readdirSync(taxPayerFolderPath);

    const taxPayerList = files.map((file) => {
      const filePath = path.join(taxPayerFolderPath, file);
      const fileData = fs.readFileSync(filePath, "utf8");
      return JSON.parse(fileData);
    });

    // apply paging
    const skip = parseInt(offset, 10);
    const take = limit ? parseInt(limit, 10) : taxPayerList.length;

    if (skip > 0 || take < taxPayerList.length) {
      taxPayerList = taxPayerList.slice(skip, skip + take);
    }

    return taxPayerList;
  } catch (error) {
    if (error.code === "ENOENT") {
      return [];
    }
    throw { code: "failedToListTaxPayers", message: error.message };
  }
}

// Get tax payer map
function getTaxPayerMap() {
  const taxPayerMap = {};
  const taxPayerList = list();
  taxPayerList.forEach((taxPayer) => {
    taxPayerMap[taxPayer.id] = taxPayer;
  });
  return taxPayerMap;
}

module.exports = {
  get,
  create,
  update,
  remove,
  list,
  getTaxPayerMap,
};
