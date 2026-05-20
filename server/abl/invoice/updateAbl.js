const Ajv = require("ajv");
const addFormats = require("ajv-formats").default;
const invoiceDao = require("../../dao/invoice-dao.js");
const taxPayerDao = require("../../dao/taxPayer-dao.js");
const openApiSchema = require("../../schema/openapi/schema.json");

const ajv = new Ajv();
addFormats(ajv);

const baseSchema = openApiSchema.components.schemas.Invoice;

const pathItem = openApiSchema.paths["/invoices/invoice/{id}"];
const operation = pathItem.put;

const allParameters = [
  ...(pathItem.parameters || []),
  ...(operation.parameters || [])
];

const properties = { ...baseSchema.properties };
const required = [...(baseSchema.required || [])];

allParameters.forEach((param) => {
  properties[param.name] = param.schema;

  if (param.required && !required.includes(param.name)) {
    required.push(param.name);
  }
});


const schema = {
  type: "object",
  properties,
  required,
  additionalProperties: false
};

const validate = ajv.compile(schema);

async function UpdateAbl(req, res) {
  try {
    const reqParams = req.body;
    reqParams.id = req.params.id;

    const valid = validate(reqParams);
    if (!valid) {
      return res.status(400).json({
        code: "requestIsNotValid",
        message: "Request is not valid",
        validationError: validate.errors
      });
    }

    // check if new taxPayerId exists
    const taxPayer = taxPayerDao.get(reqParams.taxPayerId);
    if (!taxPayer) {
      return res.status(400).json({
        code: "taxPayerDoesNotExist",
        message: `Tax payer with id ${reqParams.taxPayerId} does not exist`
      });
    }

    const updatedInvoice = invoiceDao.update(reqParams);

    if (!updatedInvoice) {
      return res.status(404).json({
        code: "invoiceNotFound",
        message: `Invoice with id ${reqParams.id} not found`
      });
    }

    updatedInvoice.taxPayer = taxPayer;
    res.json(updatedInvoice);
  } catch (error) {
    console.error(error);

    const errorCodes = [
      "duplicateInvoice"
    ];

    if (errorCodes.includes(error.code)) {
      return res.status(400).json({ code: error.code, message: error.message });
    }
    res.status(500).json({ message: error.message });
  }
}

module.exports = UpdateAbl;
