
//// Imports /////////////////////////////////////////

const express = require("express");
const router = express.Router();

// let folders = __dirname.split('/');
// let folder = folders[folders.length - 2];

//// Implementation //////////////////////////////////

// router.use(`/${folder}`, require('../models').router);
// router.use(`/${folder}/cos`, require('./cos').router);
// router.use(`/${folder}/elastic`, require('./elastic').router);
router.use(`/room`, require('./room').router);

console.log('Routers Finished Initializing');
module.exports = router;
