const express = require("express");
const router = express.Router();

const DpAbl = require("../abl/export/dpAbl");
const KhAbl = require("../abl/export/khAbl");

router.get("/dp", DpAbl);
router.get("/kh", KhAbl);

module.exports = router;