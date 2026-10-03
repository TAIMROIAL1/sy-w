const express = require("express");

const router = express.Router({mergeParams: true});

const { checkJWT, checkActivatedSubcourse } = require('./../controllers/authController');
const {getNotes, addNote, deleteNote, getAllNotes} = require('./../controllers/notesController');

router.post('/get-notes', checkJWT, checkActivatedSubcourse, getNotes);
router.post('/add-note', checkJWT, checkActivatedSubcourse, addNote);
router.post('/delete-note', checkJWT, checkActivatedSubcourse, deleteNote);
router.get('/all-notes', checkJWT, getAllNotes);

module.exports = router;