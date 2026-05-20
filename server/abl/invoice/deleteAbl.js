const Ajv = require("ajv");
const addFormats = require("ajv-formats").default;
const invoiceDao = require("../../dao/invoice-dao.js");
const openApiSchema = require("../../schema/openapi/schema.json");

const ajv = new Ajv();
addFormats(ajv);

const pathItem = openApiSchema.paths["/invoices/invoice/{id}"];
const operation = pathItem.delete;

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

async function DeleteAbl(req, res) {
  try {
    const reqParams = req.params;

    // validate input
    const valid = validate(reqParams);
    if (!valid) {
      return res.status(400).json({
        code: "dtoInIsNotValid",
        message: "dtoIn is not valid",
        validationError: ajv.errors,
      });
    }

    // ověříme si, zda faktura reálně existuje
    const invoice = invoiceDao.get(reqParams.id);
    if (!invoice) {
       return res.status(404).json({
         code: "invoiceNotFound",
         message: `Invoice with id ${reqParams.id} not found`,
       });
    }

    // remove invoice from persistent storage
    invoiceDao.remove(reqParams.id);

    // return properly filled dtoOut
    res.json({});
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
}

module.exports = DeleteAbl;