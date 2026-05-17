const Ajv = require("ajv");
const ajv = new Ajv();
const taxPayerDao = require("../../dao/taxPayer-dao.js");
const invoiceDao = require("../../dao/invoice-dao.js"); // Napojení na faktury pro ověření závislostí

const schema = {
  type: "object",
  properties: {
    id: { type: "string" },
  },
  required: ["id"],
  additionalProperties: false,
};

async function DeleteAbl(req, res) {
  try {
    const reqParams = req.params?.id ? req.params : (req.query?.id ? req.query : req.body);

    // validate input
    const valid = ajv.validate(schema, reqParams);
    if (!valid) {
      return res.status(400).json({
        code: "dtoInIsNotValid",
        message: "dtoIn is not valid",
        validationError: ajv.errors,
      });
    }

    // Kontrola referenční integrity: existují faktury propojené s tímto poplatníkem?
    const invoiceList = invoiceDao.listByTaxPayerId(reqParams.id);
    if (invoiceList && invoiceList.length > 0) {
      return res.status(400).json({
        code: "taxPayerHasInvoices",
        message: "TaxPayer has related invoices and cannot be deleted",
      });
    }

    // Ověření existence před smazáním (dobrá praxe pro vracení 404 místo "úspěšného" smazání neexistujícího)
    const existingTaxPayer = taxPayerDao.get(reqParams.id);
    if (!existingTaxPayer) {
      return res.status(404).json({
        code: "taxPayerNotFound",
        message: `TaxPayer with id ${reqParams.id} not found`,
      });
    }

    // Smazání z persistentního úložiště
    taxPayerDao.remove(reqParams.id);

    // Return empty object on successful deletion (nebo status 204)
    res.status(200).json({});
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: e.message });
  }
}

module.exports = DeleteAbl;