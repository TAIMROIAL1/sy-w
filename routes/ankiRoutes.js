const express = require('express');

const router = express.Router();
const { checkJWT, restrictTo } = require('./../controllers/authController');
const {
  createGroup, editGroup, deleteGroup, publishGroup, unpublishGroup, reviewGroup, rateGroup,
  createCard, editCard, deleteCard, getStudyCards, reviewCard, getGroupProgress,
  createOfficialGroup, editOfficialGroup, moveCards, reorderCards, reviewCards
} = require('./../controllers/ankiController');
const uploadImage = require('./../utils/ankiImageUpload');

router.use(checkJWT);

router.post('/groups', createGroup);
router.route('/groups/:groupId')
  .patch(editGroup)
  .delete(deleteGroup);

router.route('/groups/:groupId/publish')
  .post(publishGroup)
  .delete(unpublishGroup);

// official groups (admins), deleted with DELETE /groups/:groupId
router.post('/official', restrictTo('admin'), uploadImage, createOfficialGroup);
router.patch('/official/:groupId', restrictTo('admin'), uploadImage, editOfficialGroup);

router.patch('/groups/:groupId/review', restrictTo('admin'), reviewGroup);
router.post('/groups/:groupId/rate', rateGroup);

router.get('/groups/:groupId/study', getStudyCards);
router.get('/groups/:groupId/progress', getGroupProgress);
router.post('/groups/:groupId/cards', uploadImage, createCard);
router.patch('/groups/:groupId/cards/order', reorderCards);

// body: { cardIds, groupId } (target group)
router.post('/cards/move', moveCards);
// admins: cards added to / moved into published community groups. body: { cardIds, action: approve | reject }
router.patch('/cards/approval', restrictTo('admin'), reviewCards);

router.route('/cards/:cardId')
  .patch(uploadImage, editCard)
  .delete(deleteCard);

router.post('/cards/:cardId/review', reviewCard);

module.exports = router;
