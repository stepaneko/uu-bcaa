const Ajv = require("ajv");
const addFormats = require("ajv-formats").default;
const taxPayerDao = require("../../dao/taxPayer-dao.js");
const openApiSchema = require("../../schema/openapi/schema.json");

const ajv = new Ajv({ coerceTypes: true, useDefaults: true });
addFormats(ajv);

const pathItem = openApiSchema.paths["/taxpayers"];
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

    const { itemList, pageInfo } = taxPayerDao.list(reqParams);

    res.status(200).json({ 
      itemList,
      pageInfo
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
}

module.exports = ListAbl;