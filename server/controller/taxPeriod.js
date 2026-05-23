const express = require("express");
const router = express.Router();

const ListAbl = require("../abl/taxPeriod/listAbl");

router.get("/", ListAbl);

module.exports = router;