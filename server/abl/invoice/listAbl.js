const Ajv = require("ajv");
const addFormats = require("ajv-formats").default;
const invoiceDao = require("../../dao/invoice-dao.js");
const taxPayerDao = require("../../dao/taxPayer-dao.js");
const openApiSchema = require("../../schema/openapi/schema.json");

const ajv = new Ajv();
addFormats(ajv);

// 1. Nalezení definice parametrů pro operaci GET na cestě /taxpayers
const pathItem = openApiSchema.paths["/invoices"];
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
    // Získání filtrů a parametrů stránkování z query stringu
    const reqParams = req.query;

    // Validace proti schématu z OpenAPI (limit, offset, search)
    const valid = validate(reqParams);
    if (!valid) {
      return res.status(400).json({
        code: "requestIsNotValid",
        message: "Request is not valid",
        validationError: validate.errors,
      });
    }

    // Získání seznamu faktur (zde by v reálné aplikaci DAO metoda list() 
    // přijímala parametry reqParams.limit, reqParams.offset a reqParams.search)
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