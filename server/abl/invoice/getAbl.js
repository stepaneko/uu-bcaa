const Ajv = require("ajv");
const addFormats = require("ajv-formats");
const invoiceDao = require("../../dao/invoice-dao.js");
const taxPayerDao = require("../../dao/taxPayer-dao.js");
const openApiSchema = require("../../schema/openapi/schema.json");

const ajv = new Ajv();
addFormats(ajv);

// 1. Extrakce definice parametru 'id' pro cestu /invoices/{id}
const pathItem = openApiSchema.paths["/invoices/invoice/{id}"];
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
    // Získání ID z parametrů cesty (req.params)
    const reqParams = req.params;

    // Validace vstupu
    const valid = validate(reqParams);
    if (!valid) {
      return res.status(400).json({
        code: "requestIsNotValid",
        message: "Request is not valid",
        validationError: validate.errors,
      });
    }

    // Načtení faktury
    const invoice = invoiceDao.get(reqParams.id);
    if (!invoice) {
      return res.status(404).json({
        code: "invoiceNotFound",
        message: `Invoice with id ${reqParams.id} not found`,
      });
    }

    // Načtení souvisejícího daňového poplatníka a jeho připojení k faktuře
    const taxPayer = taxPayerDao.get(invoice.taxPayerId);
    invoice.taxPayer = taxPayer;

    // Návrat detailu faktury se statusem 200 OK
    res.status(200).json(invoice);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: e.message });
  }
}

module.exports = GetAbl;