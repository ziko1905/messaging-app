const { Router } = require("express");
const userController = require("../controllers/userController");
const router = Router();
const CloudinaryImageManager = require("../utils/CloudinaryImageManager");

router.get(
  "/profile-picture/:username",
  userController.getProfilePictureByUsername(CloudinaryImageManager)
);
router.get("*", userController.getUsers);
router.put("/update", userController.putUser(CloudinaryImageManager));

module.exports = router;
