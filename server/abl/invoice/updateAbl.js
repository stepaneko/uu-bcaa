const Ajv = require("ajv");
const addFormats = require("ajv-formats").default;
const ajv = new Ajv({ strict: false, allErrors: true });
addFormats(ajv);

const invoiceDao = require("../../dao/invoice-dao.js");
const taxPayerDao = require("../../dao/taxPayer-dao.js");
const openApiSchema = require("../../schema/openapi/schema.json");

const baseSchema = openApiSchema.components.schemas.Invoice;
const schema = {
  ...baseSchema,
  required: [...baseSchema.required, "id"]
};
const validate = ajv.compile(schema);

async function UpdateAbl(req, res) {
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

    // check if new taxPayerId exists
    const taxPayer = taxPayerDao.get(invoice.taxPayerId);
    if (!taxPayer) {
      return res.status(400).json({
        code: "taxPayerDoesNotExist",
        message: `TaxPayer with id ${invoice.taxPayerId} does not exist`,
      });
    }

    // update invoice in database
    const updatedInvoice = invoiceDao.update(invoice);
    if (!updatedInvoice) {
      return res.status(404).json({
        code: "invoiceNotFound",
        message: `Invoice ${invoice.id} not found`,
      });
    }

    // return properly filled dtoOut
    updatedInvoice.taxPayer = taxPayer;
    res.json(updatedInvoice);
  } catch (e) {
    console.error(e);
    if (e.code === "duplicateInvoice") {
      return res.status(400).json({ code: e.code, message: e.message });
    }
    res.status(500).json({ message: e.message });
  }
}

module.exports = UpdateAbl;