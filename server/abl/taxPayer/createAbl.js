const Ajv = require("ajv");
const addFormats = require("ajv-formats").default;
const taxPayerDao = require("../../dao/taxPayer-dao.js");
const openApiSchema = require("../../schema/openapi/schema.json");

const ajv = new Ajv();
addFormats(ajv);

const schema = openApiSchema.components.schemas.TaxPayer;

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

    // Remove whitespace characters
    if (reqParams.vatId) reqParams.vatId = reqParams.vatId.trim();

    const taxPayer = await taxPayerDao.create(reqParams);
    res.status(201).json(taxPayer);
  } catch (error) {
    console.error(error);

    const errorCodes = [
      "duplicateVatId",
      "individualFirstNameMissing",
      "individualLastNameMissing",
      "individualCompanyNameNotAllowed",
      "companyNameMissing",
      "companyFirstNameNotAllowed",
      "companyLastNameNotAllowed"
    ];

    if (errorCodes.includes(error.code)) {
      return res.status(400).json({ code: error.code, message: error.message });
    }
    res.status(500).json({ message: error.message });
  }
}

module.exports = CreateAbl;