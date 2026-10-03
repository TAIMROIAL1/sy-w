const express = require("express");
const savedVideosController = require("./../controllers/savedVideosController");
const {checkJWT} = require("./../controllers/authController"); // use your own protect middleware

const router = express.Router();

router.post("/:subcourseId/is-saved", checkJWT, savedVideosController.isSaved);
router.post("/:subcourseId/save-video", checkJWT, savedVideosController.saveVideo);
router.post("/:subcourseId/unsave-video", checkJWT, savedVideosController.unsaveVideo);
router.get("/:subcourseId/all-saved", checkJWT, savedVideosController.getAllSaved);

module.exports = router;

// in app.js:
