const Ajv = require("ajv");
const invoiceDao = require("../../dao/invoice-dao.js");
const taxPayerDao = require("../../dao/taxPayer-dao.js");

// Načtení OpenAPI schématu
const openApiSchema = require("../../schema/openapi/schema.json");

const ajv = new Ajv();

// 1. Extrakce definice parametru 'id' pro cestu /invoices/{id}
const pathItem = openApiSchema.paths["/invoices/{id}"];
const idParameter = pathItem.parameters.find(param => param.name === "id");

// 2. Sestavení validačního schématu
const schema = {
  type: "object",
  properties: {
    [idParameter.name]: idParameter.schema
  },
  required: idParameter.required ? [idParameter.name] : [],
  additionalProperties: false,
};

const validate = ajv.compile(schema);

async function GetAbl(req, res) {
  try {
    // Získání ID z parametrů cesty (req.params)
    const reqParams = req.params?.id ? req.params : (req.query?.id ? req.query : req.body);

    // Validace vstupu
    const valid = validate(reqParams);
    if (!valid) {
      return res.status(400).json({
        code: "dtoInIsNotValid",
        message: "dtoIn is not valid",
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