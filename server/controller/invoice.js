const express = require("express");
const router = express.Router();

const GetAbl = require("../abl/invoice/getAbl");
const ListAbl = require("../abl/invoice/listAbl");
const CreateAbl = require("../abl/invoice/createAbl");
const UpdateAbl = require("../abl/invoice/updateAbl");
const DeleteAbl = require("../abl/invoice/deleteAbl");

router.get("/invoice/:id", GetAbl);
router.get("/", ListAbl);
router.post("/invoice", CreateAbl);
router.put("/invoice/:id", UpdateAbl);
router.delete("/invoice/:id", DeleteAbl);

module.exports = router;
