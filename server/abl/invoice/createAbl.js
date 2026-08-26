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
        validationError: validate.errors
      });
    }

    // check if taxPayerId exists
    const taxPayer = await taxPayerDao.get(reqParams.taxPayerId);
    if (!taxPayer) {
      return res.status(400).json({
        code: "taxPayerDoesNotExist",
        message: `TaxPayer with id ${reqParams.taxPayerId} does not exist`
      });
    }

    // store invoice to persistent storage
    const invoice = await invoiceDao.create(reqParams);
    invoice.taxPayer = taxPayer; // Add tax payer data to the response

    // return properly filled output
    res.status(201).json(invoice);
  } catch (error) {
    console.error(error);

    const errorRequestCodes = [
      "duplicateInvoice"
    ];

    // Catch duplicity error from DAO
    if (errorRequestCodes.includes(error.code)) {
      return res.status(400).json({ code: error.code, message: error.message });
    }
    res.status(500).json({ message: error.message });
  }
}

module.exports = CreateAbl;