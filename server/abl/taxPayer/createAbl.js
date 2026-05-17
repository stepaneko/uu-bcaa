const Ajv = require("ajv");
const addFormats = require("ajv-formats");
const taxPayerDao = require("../../dao/taxPayer-dao.js");
const openApiSchema = require("../../schema/openapi/schema.json"); // Cesta k vygenerovanému schématu

// Inicializace AJV s podporou pro format: "email", "date" apod. a s tolerancí pro OpenAPI specifika (např. nullable)
const ajv = new Ajv({ strict: false, allErrors: true });
addFormats(ajv);

// Vytažení schématu přímo z OpenAPI definice
const schema = openApiSchema.components.schemas.TaxPayer;
const validate = ajv.compile(schema);

async function CreateAbl(req, res) {
  try {
    const data = req.body;

    // validate input
    const valid = validate(data);
    if (!valid) {
      return res.status(400).json({
        code: "dtoInIsNotValid",
        message: "dtoIn is not valid",
        validationError: validate.errors,
      });
    }

    // Odstranění případných bílých znaků z kritických polí
    if (data.vatId) data.vatId = data.vatId.trim();

    // Vytvoření záznamu
    const taxPayer = taxPayerDao.create(data);
    res.status(201).json(taxPayer);
  } catch (e) {
    console.error(e);
    // Pokud nám DAO vyhodí chybu duplicity (např. existující DIČ), vrátíme 400
    if (e.code === "duplicateVatId") {
      return res.status(400).json({ code: e.code, message: e.message });
    }
    res.status(500).json({ message: e.message });
  }
}

module.exports = CreateAbl;