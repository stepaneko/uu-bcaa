const Ajv = require("ajv");
const invoiceDao = require("../../dao/invoice-dao.js");
const taxPayerDao = require("../../dao/taxPayer-dao.js");

// Načtení OpenAPI schématu
const openApiSchema = require("../../schema/openapi/schema.json");

const ajv = new Ajv({ coerceTypes: true, useDefaults: true });

// 1. Dynamické sestavení validačního schématu z parametrů operace GET /invoices
const operation = openApiSchema.paths["/invoices"].get;
const parameters = operation.parameters || [];

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
  additionalProperties: false,
};

const validate = ajv.compile(schema);

async function ListAbl(req, res) {
  try {
    // Získání filtrů a parametrů stránkování z query stringu
    const filter = req.query;

    // Validace proti schématu z OpenAPI (limit, offset, search)
    const valid = validate(filter);
    if (!valid) {
      return res.status(400).json({
        code: "dtoInIsNotValid",
        message: "dtoIn is not valid",
        validationError: validate.errors,
      });
    }

    // Získání seznamu faktur (zde by v reálné aplikaci DAO metoda list() 
    // přijímala parametry filter.limit, filter.offset a filter.search)
    const invoiceList = invoiceDao.list();

    // Načtení mapy daňových poplatníků (pro zobrazení názvů firem/jmen u faktur)
    const taxPayerMap = taxPayerDao.getTaxPayerMap();

    // Návrat dat se statusem 200 OK
    res.status(200).json({ 
      itemList: invoiceList, 
      taxPayerMap 
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: e.message });
  }
}

module.exports = ListAbl;