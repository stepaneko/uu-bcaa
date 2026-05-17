const Ajv = require("ajv");
const taxPayerDao = require("../../dao/taxPayer-dao.js");

// Načtení kompletního OpenAPI schématu
const openApiSchema = require("../../schema/openapi/schema.json");

const ajv = new Ajv();

// 1. Nalezení definice cesty a parametru z OpenAPI schématu
const pathItem = openApiSchema.paths["/taxpayers/{id}"];
const idParameter = pathItem.parameters.find(param => param.name === "id");

// 2. Dynamické sestavení validačního schématu (JSON Schema) pro parametry požadavku
const schema = {
  type: "object",
  properties: {
    [idParameter.name]: idParameter.schema
  },
  // Pokud OpenAPI říká, že je parametr required, přidáme ho do required pole
  required: idParameter.required ? [idParameter.name] : [],
  additionalProperties: false,
};

const validate = ajv.compile(schema);

async function GetAbl(req, res) {
  try {
    // Získání parametrů (primárně z req.params, fallback pro testování/flexibilitu na query či body)
    const reqParams = req.params?.id ? req.params : (req.query?.id ? req.query : req.body);

    // Validace vstupu proti sestavenému schématu z OpenAPI
    const valid = validate(reqParams);
    if (!valid) {
      return res.status(400).json({
        code: "dtoInIsNotValid",
        message: "dtoIn is not valid",
        validationError: validate.errors,
      });
    }

    // Načtení detailu poplatníka přes DAO
    const taxPayer = taxPayerDao.get(reqParams.id);
    
    // Pokud poplatník s daným ID neexistuje
    if (!taxPayer) {
      return res.status(404).json({
        code: "taxPayerNotFound",
        message: `TaxPayer with id ${reqParams.id} not found`,
      });
    }

    // Vrácení úspěšného výsledku
    res.json(taxPayer);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: e.message });
  }
}

module.exports = GetAbl;