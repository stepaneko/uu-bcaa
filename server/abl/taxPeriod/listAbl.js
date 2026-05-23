const Ajv = require("ajv");
const addFormats = require("ajv-formats").default;
const invoiceDao = require("../../dao/invoice-dao");
const openApiSchema = require("../../schema/openapi/schema.json");

const ajv = new Ajv({ coerceTypes: true, useDefaults: true });
addFormats(ajv);

const pathItem = openApiSchema.paths["/taxperiods"];
const operation = pathItem.get;

const allParameters = [
  ...(pathItem.parameters || []),
  ...(operation.parameters || [])
];

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
  additionalProperties: false
};

const validate = ajv.compile(schema);

async function ListAbl(req, res) {
  try {
    const reqParams = req.query;

    const valid = validate(reqParams);
    if (!valid) {
      return res.status(400).json({
        code: "requestIsNotValid",
        message: "Request is not valid",
        validationError: validate.errors,
      });
    }

    const { taxPayerId, limit, offset = 0, search } = reqParams;

    const { itemList: invoiceList } = invoiceDao.list({taxPayerId});
    const taxPeriodsMap = {};

    invoiceList.forEach(invoice => {
      if (!invoice.taxableDate) return;

      const date = new Date(invoice.taxableDate);
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const periodKey = `${year}-${month}`;

      if (!taxPeriodsMap[periodKey]) {
        taxPeriodsMap[periodKey] = {
          taxPayerId: taxPayerId,
          year: year,
          month: month,
          outputBase: 0,
          outputVat: 0,
          inputBase: 0,
          inputVat: 0,
          totalVat: 0,
          outputBase10k: 0,
          outputVat10k: 0,
          inputBase10k: 0,
          inputVat10k: 0
        };
      }

      const base = invoice.price || 0;
      const vat = invoice.vatValue || 0;
      const totalAmount = base + vat;
      const isUnder10k = totalAmount < 10000;

      if (invoice.type === 'issued') {
        taxPeriodsMap[periodKey].outputBase += base;
        taxPeriodsMap[periodKey].outputVat += vat;
        if (isUnder10k) {
          taxPeriodsMap[periodKey].outputBase10k += base;
          taxPeriodsMap[periodKey].outputVat10k += vat;
        }
      } else {
        taxPeriodsMap[periodKey].inputBase += base;
        taxPeriodsMap[periodKey].inputVat += vat;
        if (isUnder10k) {
          taxPeriodsMap[periodKey].inputBase10k += base;
          taxPeriodsMap[periodKey].inputVat10k += vat;
        }
      }
    });

    let taxPeriodsList = Object.values(taxPeriodsMap);

    taxPeriodsList.forEach(period => {
      period.totalVat = period.outputVat - period.inputVat;
      
      period.outputBase = Number(period.outputBase.toFixed(2));
      period.outputVat = Number(period.outputVat.toFixed(2));
      period.inputBase = Number(period.inputBase.toFixed(2));
      period.inputVat = Number(period.inputVat.toFixed(2));
      period.totalVat = Number(period.totalVat.toFixed(2));
      period.outputBase10k = Number(period.outputBase10k.toFixed(2));
      period.outputVat10k = Number(period.outputVat10k.toFixed(2));
      period.inputBase10k = Number(period.inputBase10k.toFixed(2));
      period.inputVat10k = Number(period.inputVat10k.toFixed(2));
    });

    taxPeriodsList.sort((a, b) => {
      if (b.year !== a.year) {
        return b.year - a.year;
      }
      return b.month - a.month;
    });

    if (search) {
      const searchLower = search.toLowerCase();
      taxPeriodsList = taxPeriodsList.filter((period) => {
        return (
          period.year.toString().includes(searchLower) ||
          period.month.toString().includes(searchLower)
        );
      });
    }

    const totalItems = taxPeriodsList.length;
    const skip = parseInt(offset, 10) || 0;
    const take = limit ? parseInt(limit, 10) : totalItems;

    let pagedList = taxPeriodsList;
    if (skip > 0 || take < totalItems) {
      pagedList = taxPeriodsList.slice(skip, skip + take);
    }

    const totalPages = take > 0 ? Math.ceil(totalItems / take) : 1;
    const currentPage = take > 0 ? Math.floor(skip / take) + 1 : 1;

    return res.status(200).json({
      itemList: pagedList,
      pageInfo: {
        totalItems,
        pageSize: take,
        totalPages,
        currentPage
      }
    });
    
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

module.exports = ListAbl;