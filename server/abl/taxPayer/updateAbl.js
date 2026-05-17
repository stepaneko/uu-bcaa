const Ajv = require("ajv");
const addFormats = require("ajv-formats");
const taxPayerDao = require("../../dao/taxPayer-dao.js");
const openApiSchema = require("../../schema/openapi/schema.json");

const ajv = new Ajv({ strict: false, allErrors: true });
addFormats(ajv);

// Vytažení schématu z OpenAPI
const baseSchema = openApiSchema.components.schemas.TaxPayer;

// Pro update vyžadujeme k původním requirements ještě 'id'
const schema = {
  ...baseSchema,
  required: [...baseSchema.required, "id"]
};
const validate = ajv.compile(schema);

async function UpdateAbl(req, res) {
  try {
    const data = req.body;

    // Získání parametru id (primárně z req.params, fallback pro testování/flexibilitu na query či body)
    data.id = req.params?.id ? req.params.id : (req.query?.id ? req.query.id : req.body.id);

    // validate input
    const valid = validate(data);
    if (!valid) {
      return res.status(400).json({
        code: "dtoInIsNotValid",
        message: "dtoIn is not valid",
        validationError: validate.errors,
      });
    }

    // Aktualizace v persistentním úložišti
    const updatedTaxPayer = taxPayerDao.update(data);
    
    if (!updatedTaxPayer) {
      return res.status(404).json({
        code: "taxPayerNotFound",
        message: `TaxPayer with id ${data.id} not found`,
      });
    }

    res.json(updatedTaxPayer);
  } catch (e) {
    console.error(e);
    // Zpracování DAO chyb (např. kolize DIČ s jiným uživatelem)
    if (e.code === "duplicateVatId") {
      return res.status(400).json({ code: e.code, message: e.message });
    }
    res.status(500).json({ message: e.message });
  }
}

module.exports = UpdateAbl;