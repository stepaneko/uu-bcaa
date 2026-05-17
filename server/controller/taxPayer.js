const express = require("express");
const router = express.Router();

const GetAbl = require("../abl/taxPayer/getAbl");
const ListAbl = require("../abl/taxPayer/listAbl");
const CreateAbl = require("../abl/taxPayer/createAbl");
const UpdateAbl = require("../abl/taxPayer/updateAbl");
const DeleteAbl = require("../abl/taxPayer/deleteAbl");

router.get("/get", GetAbl);
router.get("/:id", GetAbl);
router.get("/list", ListAbl);
router.post("/create", CreateAbl);
router.post("/update", UpdateAbl);
router.put("/:id", UpdateAbl);
router.post("/delete", DeleteAbl);

module.exports = router;
