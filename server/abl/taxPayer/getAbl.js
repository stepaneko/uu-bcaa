const Ajv = require("ajv");
const addFormats = require("ajv-formats").default;
const taxPayerDao = require("../../dao/taxPayer-dao.js");
const openApiSchema = require("../../schema/openapi/schema.json");

const ajv = new Ajv();
addFormats(ajv);

// 1. Nalezení definice cesty a parametru z OpenAPI schématu
const pathItem = openApiSchema.paths["/taxpayers/taxpayer/{id}"];
const operation = pathItem.get;

const allParameters = [
  ...(pathItem.parameters || []),
  ...(operation.parameters || [])
];

// 2. Dynamické sestavení validačního schématu (JSON Schema) pro parametry požadavku
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
  additionalProperties: false, // Nepovolujeme parametry, které nejsou v OpenAPI schématu
};

const validate = ajv.compile(schema);

async function GetAbl(req, res) {
  try {
    const reqParams = req.params;

    // Validace vstupu proti sestavenému schématu z OpenAPI
    const valid = validate(reqParams);
    if (!valid) {
      return res.status(400).json({
        code: "requestIsNotValid",
        message: "Request is not valid",
        validationError: validate.errors,
      });
    }

    // Načtení detailu poplatníka přes DAO
    const taxPayer = taxPayerDao.get(reqParams.id);
    
    // Pokud poplatník s daným ID neexistuje
    if (!taxPayer) {
      return res.status(404).json({
        code: "taxPayerNotFound",
        message: `Tax payer with id ${reqParams.id} not found`,
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