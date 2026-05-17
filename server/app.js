const express = require("express");
const swaggerUi = require("swagger-ui-express");

// 1. Načtení tvého hotového JSON souboru
// V Node.js můžeš JSON soubor načíst přímo přes funkci require()
const swaggerDocument = require("./schema/openapi/schema.json");

const app = express();
const port = 8888;

const taxPayerController = require("./controller/taxPayer");
const invoiceController = require("./controller/invoice");
const exportController = require("./controller/export");

app.use(express.json()); // podpora pro application/json
app.use(express.urlencoded({ extended: true })); // podpora pro application/x-www-form-urlencoded

// 2. Nastavení samotného Swagger UI
// swaggerUi.serve - připraví potřebné CSS a JS pro zobrazení rozhraní
// swaggerUi.setup - vezme tvůj JSON a vykreslí z něj grafickou podobu
app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Tvá existující hlavní cesta s přesměrováním na dokumentaci
app.get("/", (req, res) => {
  res.redirect(301, "/docs");
});

app.use("/taxpayer", taxPayerController);
app.use("/taxpayers", taxPayerController);
app.use("/invoice", invoiceController);
app.use("/export", exportController);

app.listen(port, () => {
  console.log(`Server and documentation is running on http://localhost:${port}/docs`);
});
