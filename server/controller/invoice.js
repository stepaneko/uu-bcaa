const express = require("express");
const router = express.Router();

const GetAbl = require("../abl/invoice/getAbl");
const ListAbl = require("../abl/invoice/listAbl");
const CreateAbl = require("../abl/invoice/createAbl");
const UpdateAbl = require("../abl/invoice/updateAbl");
const DeleteAbl = require("../abl/invoice/deleteAbl");

router.get("/get", GetAbl);
router.get("/list", ListAbl);
router.post("/create", CreateAbl);
router.post("/update", UpdateAbl);
router.post("/delete", DeleteAbl);

module.exports = router;
