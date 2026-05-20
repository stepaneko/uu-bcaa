const fs = require("fs");
const path = require("path");
const Ajv = require("ajv");
const addFormats = require("ajv-formats").default;
const libxmljs = require("libxmljs2");
const taxPayerDao = require("../../dao/taxPayer-dao.js");
const invoiceDao = require("../../dao/invoice-dao.js");

const openApiSchema = require("../../schema/openapi/schema.json");

const ajv = new Ajv();
addFormats(ajv);

const pathItem = openApiSchema.paths["/export/kh"];
const operation = pathItem.get;

const allParameters = [
  ...(pathItem.parameters || []),
  ...(operation.parameters || []),
];

const properties = {};
const required = [];

allParameters.forEach((param) => {
  properties[param.name] = param.schema;
  if (param.required && !required.includes(param.name)) {
    required.push(param.name);
  }
});

const schema = {
  type: "object",
  properties,
  required,
  additionalProperties: false,
};

const validate = ajv.compile(schema);

function formatDate(dateString) {
  const d = new Date(dateString);
  return `${d.getDate()}.${d.getMonth() + 1}.${d.getFullYear()}`;
}

async function ExportKhAbl(req, res) {
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

    const { taxPayerId, month, year } = reqParams;

    const taxPayer = taxPayerDao.get(taxPayerId);
    if (!taxPayer) {
      return res.status(404).json({
        code: "taxPayerNotFound",
        message: `Tax payer with id ${taxPayerId} not found`,
      });
    }

    const invoiceList = invoiceDao.list({ taxPayerId, month, year });

    let vetaA2Xml = "";
    let vetaB2Xml = "";
    let obrat23 = 0;
    let dan23 = 0;
    let pln23 = 0;
    let odp_tuz23_nar = 0;

    invoiceList.forEach((inv) => {
      const dppd = formatDate(inv.taxableDate);
      const base = inv.price || 0;
      const vat = inv.vatValue || 0;
      if (inv.type === "issued") {
        obrat23 += base;
        dan23 += vat;
        vetaA2Xml += `\n    <VetaA2 dic_odb="${inv.vatId || ""}" c_evid_dd="${inv.number || ""}" dppd="${dppd}" zakl_dane1="${base.toFixed(2)}" dan1="${vat.toFixed(2)}" />`;
      } else {
        pln23 += base;
        odp_tuz23_nar += vat;
        vetaB2Xml += `\n    <VetaB2 dic_dod="${inv.vatId || ""}" c_evid_dd="${inv.number || ""}" dppd="${dppd}" zakl_dane1="${base.toFixed(2)}" dan1="${vat.toFixed(2)}" />`;
      }
    });

    const dic_numeric = taxPayer.vatId ? taxPayer.vatId.replace(/\D/g, "") : "";

    const xmlString = `<?xml version="1.0" encoding="utf-8"?>
<Pisemnost nazevSW="EasyVAT" verzeSW="1.0.0">
  <DPHKH1>
    <VetaD k_uladis="DPH" dokument="KH1" rok="${year}" mesic="${parseInt(month)}" d_poddp="${formatDate(new Date())}" />
    <VetaP c_ufo="451" dic="${dic_numeric}" jmeno="${taxPayer.firstName || ""}" prijmeni="${taxPayer.lastName || ""}" naz_obce="${taxPayer.city || ""}" ulice="${taxPayer.street || ""}" c_pop="${taxPayer.descriptiveNumber || ""}" c_orient="${taxPayer.referenceNumber || ""}" psc="${taxPayer.postalCode || ""}" stat="ČESKÁ REPUBLIKA" c_telef="${taxPayer.phoneNumber || ""}" email="${taxPayer.email || ""}" sest_jmeno="${taxPayer.firstName || ""}" sest_prijmeni="${taxPayer.lastName || ""}" />${vetaA2Xml}${vetaB2Xml}
    <VetaC obrat23="${obrat23.toFixed(2)}" dan23="${dan23.toFixed(2)}" pln23="${pln23.toFixed(2)}" odp_tuz23_nar="${odp_tuz23_nar.toFixed(2)}" />
  </DPHKH1>
</Pisemnost>`;

    const xsdPath = path.join(__dirname, "../../schema/xsd/dphkh1_epo2.xsd");
    const xsdString = fs.readFileSync(xsdPath, "utf8");
    const xmlDoc = libxmljs.parseXml(xmlString);
    const xsdDoc = libxmljs.parseXml(xsdString);

    if (!xmlDoc.validate(xsdDoc)) {
      return res
        .status(500)
        .json({ code: "xmlValidationFailed", errors: xmlDoc.validationErrors });
    }

    res.set("Content-Type", "application/xml");
    res.status(200).send(xmlString);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

module.exports = ExportKhAbl;