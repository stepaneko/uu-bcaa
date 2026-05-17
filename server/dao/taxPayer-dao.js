const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const taxPayerFolderPath = path.join(__dirname, "storage", "taxPayerList");

// Optimalizace: Zajištění existence složky pro ukládání dat při startu
if (!fs.existsSync(taxPayerFolderPath)) {
  fs.mkdirSync(taxPayerFolderPath, { recursive: true });
}

// Method to read a taxpayer from a file
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

// Method to write a taxpayer to a file
function create(taxPayer) {
  try {
    const taxPayerList = list();
    // U daňových poplatníků dává smysl kontrolovat unikátní DIČ (vatId)
    if (taxPayerList.some((item) => item.vatId === taxPayer.vatId)) {
      throw {
        code: "duplicateVatId",
        message: "TaxPayer with the given vatId already exists",
      };
    }
    
    taxPayer.id = crypto.randomBytes(16).toString("hex");
    const filePath = path.join(taxPayerFolderPath, `${taxPayer.id}.json`);
    const fileData = JSON.stringify(taxPayer, null, 2); // Optimalizace: formátovaný JSON pro lepší čitelnost
    fs.writeFileSync(filePath, fileData, "utf8");
    return taxPayer;
  } catch (error) {
    // Optimalizace: Pokud jde o naši custom chybu z try bloku, propustíme ji
    if (error.code === "duplicateVatId") throw error;
    throw { code: "failedToCreateTaxPayer", message: error.message };
  }
}

// Method to update taxpayer in a file
function update(taxPayer) {
  try {
    const currentTaxPayer = get(taxPayer.id);
    if (!currentTaxPayer) return null;

    // Pokud se mění vatId, ověříme, že nové vatId ještě neexistuje u někoho jiného
    if (taxPayer.vatId && taxPayer.vatId !== currentTaxPayer.vatId) {
      const taxPayerList = list();
      if (taxPayerList.some((item) => item.vatId === taxPayer.vatId)) {
        throw {
          code: "duplicateVatId",
          message: "TaxPayer with the given vatId already exists",
        };
      }
    }

    const newTaxPayer = { ...currentTaxPayer, ...taxPayer };
    const filePath = path.join(taxPayerFolderPath, `${taxPayer.id}.json`);
    const fileData = JSON.stringify(newTaxPayer, null, 2);
    fs.writeFileSync(filePath, fileData, "utf8");
    return newTaxPayer;
  } catch (error) {
    if (error.code === "duplicateVatId") throw error;
    throw { code: "failedToUpdateTaxPayer", message: error.message };
  }
}

// Method to remove a taxpayer from a file
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

// Method to list taxpayers in a folder
function list() {
  try {
    const files = fs.readdirSync(taxPayerFolderPath);
    const taxPayerList = files.map((file) => {
      const filePath = path.join(taxPayerFolderPath, file);
      const fileData = fs.readFileSync(filePath, "utf8");
      return JSON.parse(fileData);
    });
    return taxPayerList;
  } catch (error) {
    throw { code: "failedToListTaxPayers", message: error.message };
  }
}

// Get taxPayerMap
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