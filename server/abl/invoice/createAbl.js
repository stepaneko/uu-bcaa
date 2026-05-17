const Ajv = require("ajv");
const addFormats = require("ajv-formats").default;
const ajv = new Ajv({ strict: false, allErrors: true });
addFormats(ajv);

const invoiceDao = require("../../dao/invoice-dao.js");
const taxPayerDao = require("../../dao/taxPayer-dao.js");
const openApiSchema = require("../../schema/openapi/schema.json");

const schema = openApiSchema.components.schemas.Invoice;
const validate = ajv.compile(schema);

async function CreateAbl(req, res) {
  try {
    let invoice = req.body;

    // validate input
    const valid = validate(invoice);
    if (!valid) {
      return res.status(400).json({
        code: "dtoInIsNotValid",
        message: "dtoIn is not valid",
        validationError: validate.errors,
      });
    }

    // check if taxPayerId exists
    const taxPayer = taxPayerDao.get(invoice.taxPayerId);
    if (!taxPayer) {
      return res.status(400).json({
        code: "taxPayerDoesNotExist",
        message: `TaxPayer with id ${invoice.taxPayerId} does not exist`,
      });
    }

    // store invoice to persistent storage
    invoice = invoiceDao.create(invoice);
    invoice.taxPayer = taxPayer; // Připojíme detail poplatníka do odpovědi

    // return properly filled dtoOut
    res.status(201).json(invoice);
  } catch (e) {
    console.error(e);
    // Zachycení chyby duplicity z DAO
    if (e.code === "duplicateInvoice") {
      return res.status(400).json({ code: e.code, message: e.message });
    }
    res.status(500).json({ message: e.message });
  }
}

module.exports = CreateAbl;