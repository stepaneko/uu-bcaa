const Ajv = require("ajv");
const addFormats = require("ajv-formats").default;
const taxPayerDao = require("../../dao/taxPayer-dao.js");
const openApiSchema = require("../../schema/openapi/schema.json");

const ajv = new Ajv();
addFormats(ajv);

const baseSchema = openApiSchema.components.schemas.TaxPayer;

const pathItem = openApiSchema.paths["/taxpayers/taxpayer/{id}"];
const operation = pathItem.put;

const allParameters = [
  ...(pathItem.parameters || []),
  ...(operation.parameters || []),
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
  additionalProperties: false,
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
        validationError: validate.errors,
      });
    }

    const existingTaxPayer = taxPayerDao.get(reqParams.id);
    if (!existingTaxPayer) {
      return res.status(404).json({
        code: "taxPayerNotFound",
        message: `Tax payer with id ${reqParams.id} not found`,
      });
    }

    // Remove whitespace characters
    if (reqParams.vatId) reqParams.vatId = reqParams.vatId.trim();

    const updatedTaxPayer = taxPayerDao.update(reqParams);

    if (!updatedTaxPayer) {
      return res.status(404).json({
        code: "taxPayerNotFound",
        message: `Tax payer with id ${reqParams.id} not found`,
      });
    }

    res.json(updatedTaxPayer);
  } catch (error) {
    console.error(error);

    const errorCodes = [
      "duplicateVatId",
      "individualFirstNameMissing",
      "individualLastNameMissing",
      "individualCompanyNameNotAllowed",
      "companyNameMissing",
      "companyFirstNameNotAllowed",
      "companyLastNameNotAllowed",
    ];

    if (errorCodes.includes(error.code)) {
      return res.status(400).json({ code: error.code, message: error.message });
    }
    res.status(500).json({ message: error.message });
  }
}

module.exports = UpdateAbl;
