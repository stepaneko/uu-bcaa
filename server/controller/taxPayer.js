const express = require("express");
const router = express.Router();

const GetAbl = require("../abl/taxPayer/getAbl");
const ListAbl = require("../abl/taxPayer/listAbl");
const CreateAbl = require("../abl/taxPayer/createAbl");
const UpdateAbl = require("../abl/taxPayer/updateAbl");
const DeleteAbl = require("../abl/taxPayer/deleteAbl");

router.get("/taxpayer/:id", GetAbl);
router.get("/", ListAbl);
router.post("/taxpayer/", CreateAbl);
router.put("/taxpayer/:id", UpdateAbl);
router.delete("/taxpayer/:id", DeleteAbl);

module.exports = router;
