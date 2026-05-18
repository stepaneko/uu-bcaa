const Ajv = require("ajv");
const addFormats = require("ajv-formats").default;
const taxPayerDao = require("../../dao/taxPayer-dao.js");
const openApiSchema = require("../../schema/openapi/schema.json");

const ajv = new Ajv();
addFormats(ajv);

// 1. Nalezení definice parametrů pro operaci GET na cestě /taxpayers
const pathItem = openApiSchema.paths["/taxpayers"];
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

async function ListAbl(req, res) {
  try {
    // U operace typu list (GET) validujeme query string
    const reqParams = req.query;

    // Validace vstupu proti schématu odvozenému z OpenAPI
    const valid = validate(reqParams);
    if (!valid) {
      return res.status(400).json({
        code: "requestIsNotValid",
        message: "Request is not valid",
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