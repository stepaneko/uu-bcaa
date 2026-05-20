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

const pathItem = openApiSchema.paths["/export/dp"];
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

async function ExportDpAbl(req, res) {
  try {
    const reqParams = req.query;

    const valid = validate(reqParams);
    if (!valid) {
      return res.status(400).json({
        code: "requestIsNotValid",
        message: "Request is not valid",
        validationError: validate.errors
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

    let obrat23 = 0; let dan23 = 0; let pln23 = 0; let odp_tuz23_nar = 0;

    invoiceList.forEach((inv) => {
      if (inv.type === "issued") {
        obrat23 += inv.price || 0;
        dan23 += inv.vatValue || 0;
      } else if (inv.type === "received") {
        pln23 += inv.price || 0;
        odp_tuz23_nar += inv.vatValue || 0;
      }
    });

    const dan_zocelk = Math.round(dan23);
    const odp_zocelk = Math.round(odp_tuz23_nar);
    const rozdíl = dan_zocelk - odp_zocelk;
    const dano_da = rozdíl > 0 ? rozdíl : 0;
    const dano_no = rozdíl < 0 ? Math.abs(rozdíl) : 0;

    const typ_ds = taxPayer.type === "individual" ? "F" : "P";
    const dic_numeric = taxPayer.vatId ? taxPayer.vatId.replace(/\D/g, "") : "";

    const xmlString = `<?xml version="1.0" encoding="utf-8"?>
<Pisemnost nazevSW="EasyVAT" verzeSW="1.0.0">
  <DPHDP3 verzePis="01.02">
    <VetaD k_uladis="DPH" dokument="DP3" dapdph_forma="B" rok="${year}" mesic="${parseInt(month)}" d_poddp="${new Date().toLocaleDateString('cs-CZ').replace(/\s/g, "")}" typ_platce="P" trans="A" />
    <VetaP c_ufo="451" dic="${dic_numeric}" typ_ds="${typ_ds}" titul="${taxPayer.title || ""}" jmeno="${taxPayer.firstName || ""}" prijmeni="${taxPayer.lastName || ""}" naz_obce="${taxPayer.city || ""}" ulice="${taxPayer.street || ""}" c_pop="${taxPayer.descriptiveNumber || ""}" c_orient="${taxPayer.referenceNumber || ""}" psc="${taxPayer.postalCode || ""}" stat="ČESKÁ REPUBLIKA" c_telef="${taxPayer.phoneNumber || ""}" email="${taxPayer.email || ""}" sest_jmeno="${taxPayer.firstName || ""}" sest_prijmeni="${taxPayer.lastName || ""}" />
    <Veta1 obrat23="${Math.round(obrat23)}" dan23="${dan_zocelk}" />
    <Veta4 pln23="${Math.round(pln23)}" odp_tuz23_nar="${odp_zocelk}" odp_sum_nar="${odp_zocelk}" />
    <Veta6 dan_zocelk="${dan_zocelk}" odp_zocelk="${odp_zocelk}" dano_da="${dano_da}" dano_no="${dano_no}" />
  </DPHDP3>
</Pisemnost>`;

    const xsdPath = path.join(__dirname, "../../schema/xsd/dphdp3_epo2.xsd");
    const xsdString = fs.readFileSync(xsdPath, "utf8");
    const xmlDoc = libxmljs.parseXml(xmlString);
    const xsdDoc = libxmljs.parseXml(xsdString);

    if (!xmlDoc.validate(xsdDoc)) {
      return res.status(500).json({ code: "xmlValidationFailed", errors: xmlDoc.validationErrors });
    }

    res.set("Content-Type", "application/xml");
    res.status(200).send(xmlString);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

module.exports = ExportDpAbl;