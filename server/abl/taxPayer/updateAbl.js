const Ajv = require("ajv");
const addFormats = require("ajv-formats").default;
const taxPayerDao = require("../../dao/taxPayer-dao.js");
const openApiSchema = require("../../schema/openapi/schema.json");

const ajv = new Ajv();
addFormats(ajv);

// Vytažení schématu z OpenAPI
const baseSchema = openApiSchema.components.schemas.TaxPayer;

// 2. Nalezení definice cesty a konkrétní operace
const pathItem = openApiSchema.paths["/taxpayers/taxpayer/{id}"];
const operation = pathItem.put;

// 3. Bezpečné sloučení parametrů z úrovně cesty (např. {id}) a z úrovně operace
const allParameters = [
  ...(pathItem.parameters || []),
  ...(operation.parameters || [])
];

// 4. Příprava základních vlastností z request body
const properties = { ...baseSchema.properties };
const required = [ ...(baseSchema.required || []) ];

// 5. Dynamické přidání všech parametrů z definice cesty a operace do schématu
allParameters.forEach(param => {
  properties[param.name] = param.schema;
  
  // Pokud je parametr v OpenAPI required a ještě ho nemáme v poli, přidáme ho
  if (param.required && !required.includes(param.name)) {
    required.push(param.name);
  }
});

// 6. Finální validační schéma
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

    // Získání parametru id z URL
    reqParams.id = req.params.id;

    // validate input
    const valid = validate(reqParams);
    if (!valid) {
      return res.status(400).json({
        code: "requestIsNotValid",
        message: "Request is not valid",
        validationError: validate.errors,
      });
    }

    // Aktualizace v persistentním úložišti
    const updatedTaxPayer = taxPayerDao.update(reqParams);
    
    if (!updatedTaxPayer) {
      return res.status(404).json({
        code: "taxPayerNotFound",
        message: `Tax payer with id ${reqParams.id} not found`,
      });
    }

    res.json(updatedTaxPayer);
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

module.exports = UpdateAbl;