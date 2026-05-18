const Ajv = require("ajv");
const addFormats = require("ajv-formats").default;
const invoiceDao = require("../../dao/invoice-dao.js");
const taxPayerDao = require("../../dao/taxPayer-dao.js");
const openApiSchema = require("../../schema/openapi/schema.json");

const ajv = new Ajv();
addFormats(ajv);

const schema = openApiSchema.components.schemas.Invoice;

const validate = ajv.compile(schema);

async function CreateAbl(req, res) {
  try {
    const reqParams = req.body;

    // validate input
    const valid = validate(reqParams);
    if (!valid) {
      return res.status(400).json({
        code: "requestIsNotValid",
        message: "Request is not valid",
        validationError: validate.errors,
      });
    }

    // check if taxPayerId exists
    const taxPayer = taxPayerDao.get(reqParams.taxPayerId);
    if (!taxPayer) {
      return res.status(400).json({
        code: "taxPayerDoesNotExist",
        message: `TaxPayer with id ${reqParams.taxPayerId} does not exist`,
      });
    }

    // store invoice to persistent storage
    const invoice = invoiceDao.create(reqParams);
    invoice.taxPayer = taxPayer; // Připojíme detail poplatníka do odpovědi

    // return properly filled dtoOut
    res.status(201).json(invoice);
  } catch (e) {
    console.error(e);

    const errorRequestCodes = [
      "duplicateInvoice"
    ];

    // Zachycení chyby duplicity z DAO
    if (errorRequestCodes.includes(e.code)) {
      return res.status(400).json({ code: e.code, message: e.message });
    }
    res.status(500).json({ message: e.message });
  }
}

module.exports = CreateAbl;