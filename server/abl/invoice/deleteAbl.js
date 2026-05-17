const Ajv = require("ajv");
const ajv = new Ajv();

const invoiceDao = require("../../dao/invoice-dao.js");

const schema = {
  type: "object",
  properties: {
    id: { type: "string" },
  },
  required: ["id"],
  additionalProperties: false,
};

async function DeleteAbl(req, res) {
  try {
    // get request query, params or body
    const reqParams = req.params?.id ? req.params : (req.query?.id ? req.query : req.body);

    // validate input
    const valid = ajv.validate(schema, reqParams);
    if (!valid) {
      return res.status(400).json({
        code: "dtoInIsNotValid",
        message: "dtoIn is not valid",
        validationError: ajv.errors,
      });
    }

    // ověříme si, zda faktura reálně existuje
    const invoice = invoiceDao.get(reqParams.id);
    if (!invoice) {
       return res.status(404).json({
         code: "invoiceNotFound",
         message: `Invoice ${reqParams.id} not found`,
       });
    }

    // remove invoice from persistent storage
    invoiceDao.remove(reqParams.id);

    // return properly filled dtoOut
    res.json({});
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: e.message });
  }
}

module.exports = DeleteAbl;