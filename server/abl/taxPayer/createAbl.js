const Ajv = require("ajv");
const addFormats = require("ajv-formats").default;
const taxPayerDao = require("../../dao/taxPayer-dao.js");
const openApiSchema = require("../../schema/openapi/schema.json");

const ajv = new Ajv();
addFormats(ajv);

// Vytažení schématu přímo z OpenAPI definice
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
        validationError: validate.errors,
      });
    }

    // Odstranění případných bílých znaků z kritických polí
    if (reqParams.vatId) reqParams.vatId = reqParams.vatId.trim();

    // Vytvoření záznamu
    const taxPayer = taxPayerDao.create(reqParams);
    res.status(201).json(taxPayer);
  } catch (e) {
    console.error(e);

    const errorRequestCodes = [
      "duplicateVatId",
      "individualFirstNameMissing",
      "individualLastNameMissing",
      "individualCompanyNameNotAllowed",
      "companyNameMissing",
      "companyFirstNameNotAllowed",
      "companyLastNameNotAllowed"
    ];

    if (errorRequestCodes.includes(e.code)) {
      return res.status(400).json({ code: e.code, message: e.message });
    }
    res.status(500).json({ message: e.message });
  }
}

module.exports = CreateAbl;