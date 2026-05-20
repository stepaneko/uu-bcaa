const Ajv = require("ajv");
const addFormats = require("ajv-formats").default;
const invoiceDao = require("../../dao/invoice-dao.js");
const taxPayerDao = require("../../dao/taxPayer-dao.js");
const openApiSchema = require("../../schema/openapi/schema.json");

const ajv = new Ajv();
addFormats(ajv);

const pathItem = openApiSchema.paths["/invoices"];
const operation = pathItem.get;

const allParameters = [
  ...(pathItem.parameters || []),
  ...(operation.parameters || [])
];

const properties = {};
const required = [];

allParameters.forEach(param => {
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

async function ListAbl(req, res) {
  try {
    const reqParams = req.query;

    const valid = validate(reqParams);
    if (!valid) {
      return res.status(400).json({
        code: "requestIsNotValid",
        message: "Request is not valid",
        validationError: validate.errors
      });
    }

    const invoiceList = invoiceDao.list(reqParams);

    // Get tax payer map to display tax payer name in invoice data
    const taxPayerMap = taxPayerDao.getTaxPayerMap();

    res.status(200).json({ 
      itemList: invoiceList, 
      taxPayerMap 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
}

module.exports = ListAbl;