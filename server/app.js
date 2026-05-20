const express = require("express");
const swaggerUi = require("swagger-ui-express");

const swaggerDocument = require("./schema/openapi/schema.json");

const app = express();
const port = 8888;

const taxPayerController = require("./controller/taxPayer");
const invoiceController = require("./controller/invoice");
const exportController = require("./controller/export");

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.get("/", (req, res) => {
  res.redirect(301, "/docs");
});

app.use("/taxpayers", taxPayerController);
app.use("/invoices", invoiceController);
app.use("/export", exportController);

app.listen(port, () => {
  console.log(`Server and documentation is running on http://localhost:${port}/docs`);
});
