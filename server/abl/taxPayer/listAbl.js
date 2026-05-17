const Ajv = require("ajv");
const taxPayerDao = require("../../dao/taxPayer-dao.js");

// Načtení kompletního OpenAPI schématu
const openApiSchema = require("../../schema/openapi/schema.json");

const ajv = new Ajv({ coerceTypes: true, useDefaults: true });

// 1. Nalezení definice parametrů pro operaci GET na cestě /taxpayers
const operation = openApiSchema.paths["/taxpayers"].get;
const parameters = operation.parameters || [];

// 2. Dynamické sestavení validačního schématu pro query parametry
const properties = {};
const required = [];

parameters.forEach(param => {
  if (param.in === "query") {
    properties[param.name] = param.schema;
    if (param.required) {
      required.push(param.name);
    }
  }
});

const schema = {
  type: "object",
  properties,
  required,
  additionalProperties: false, // Nepovolujeme parametry, které nejsou v OpenAPI schématu
};

const validate = ajv.compile(schema);

async function ListAbl(req, res) {
  try {
    // U operace typu list (GET) validujeme query string
    const filter = req.query;

    // Validace vstupu proti schématu odvozenému z OpenAPI
    const valid = validate(filter);
    if (!valid) {
      return res.status(400).json({
        code: "dtoInIsNotValid",
        message: "dtoIn is not valid",
        validationError: validate.errors,
      });
    }

    // Získání seznamu daňových poplatníků z DAO
    const taxPayerList = taxPayerDao.list();

    // Návrat seznamu se statusem 200 OK (výchozí pro res.json)
    res.status(200).json({ 
      itemList: taxPayerList 
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: e.message });
  }
}

module.exports = ListAbl;