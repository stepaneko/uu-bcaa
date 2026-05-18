const Ajv = require("ajv");
const addFormats = require("ajv-formats").default;
const invoiceDao = require("../../dao/invoice-dao.js");
const taxPayerDao = require("../../dao/taxPayer-dao.js");
const openApiSchema = require("../../schema/openapi/schema.json");

const ajv = new Ajv();
addFormats(ajv);

// Vytažení schématu z OpenAPI
const baseSchema = openApiSchema.components.schemas.Invoice;

// 2. Nalezení definice cesty a konkrétní operace
const pathItem = openApiSchema.paths["/invoices/invoice/{id}"];
const operation = pathItem.put;

// 3. Bezpečné sloučení parametrů z úrovně cesty (např. {id}) a z úrovně operace
const allParameters = [
  ...(pathItem.parameters || []),
  ...(operation.parameters || []),
];

// 4. Příprava základních vlastností z request body
const properties = { ...baseSchema.properties };
const required = [...(baseSchema.required || [])];

// 5. Dynamické přidání všech parametrů z definice cesty a operace do schématu
allParameters.forEach((param) => {
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

    // check if new taxPayerId exists
    const taxPayer = taxPayerDao.get(reqParams.taxPayerId);
    if (!taxPayer) {
      return res.status(400).json({
        code: "taxPayerDoesNotExist",
        message: `Tax payer with id ${reqParams.taxPayerId} does not exist`,
      });
    }

    // update invoice in database
    const updatedInvoice = invoiceDao.update(reqParams);

    if (!updatedInvoice) {
      return res.status(404).json({
        code: "invoiceNotFound",
        message: `Invoice with id ${reqParams.id} not found`,
      });
    }

    // return properly filled dtoOut
    updatedInvoice.taxPayer = taxPayer;
    res.json(updatedInvoice);
  } catch (e) {
    console.error(e);

    const errorRequestCodes = [
      "duplicateInvoice"
    ];

    if (errorRequestCodes.includes(e.code)) {
      return res.status(400).json({ code: e.code, message: e.message });
    }
    res.status(500).json({ message: e.message });
  }
}

module.exports = UpdateAbl;
