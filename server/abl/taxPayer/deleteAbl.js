const Ajv = require("ajv");
const addFormats = require("ajv-formats").default;
const taxPayerDao = require("../../dao/taxPayer-dao.js");
const invoiceDao = require("../../dao/invoice-dao.js"); // Napojení na faktury pro ověření závislostí
const openApiSchema = require("../../schema/openapi/schema.json");

const ajv = new Ajv();
addFormats(ajv);

// 1. Nalezení definice cesty a parametru z OpenAPI schématu
const pathItem = openApiSchema.paths["/taxpayers/taxpayer/{id}"];
const operation = pathItem.delete;

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

async function DeleteAbl(req, res) {
  try {
    const reqParams = req.params;

    // validate input
    const valid = validate(reqParams);
    if (!valid) {
      return res.status(400).json({
        code: "requestIsNotValid",
        message: "Request is not valid",
        validationError: ajv.errors,
      });
    }

    // Kontrola referenční integrity: existují faktury propojené s tímto poplatníkem?
    const invoiceList = invoiceDao.listByTaxPayerId(reqParams.id);
    if (invoiceList && invoiceList.length > 0) {
      return res.status(400).json({
        code: "taxPayerHasInvoices",
        message: "Tax payer has related invoices and cannot be deleted",
      });
    }

    // Ověření existence před smazáním (dobrá praxe pro vracení 404 místo "úspěšného" smazání neexistujícího)
    const existingTaxPayer = taxPayerDao.get(reqParams.id);
    if (!existingTaxPayer) {
      return res.status(404).json({
        code: "taxPayerNotFound",
        message: `Tax payer with id ${reqParams.id} not found`,
      });
    }

    // Smazání z persistentního úložiště
    taxPayerDao.remove(reqParams.id);

    // Return empty object on successful deletion (nebo status 204)
    res.status(200).json({});
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: e.message });
  }
}

module.exports = DeleteAbl;