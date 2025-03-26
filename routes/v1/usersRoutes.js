
import JoiValidator from "../../middleware/joiValidator.js";
import { register,login ,updateUser,getUserProfile,refreshToken} from "../../controllers/userController.js";
import express from "express";
import { createUserValidator,updateUserValidator } from "../../validator/userValidator.js";
import { authenticate } from "../../middleware/auth.js";
const router = express.Router();

//users routes
// unprotected routes
router.post("/register", JoiValidator(createUserValidator), register);
router.post("/login", login);
//protected routes
router.post("/update-profile", authenticate ,JoiValidator(updateUserValidator),updateUser);
router.get("/profile", authenticate ,getUserProfile);


router.get('/refresh-token', refreshToken);

export default router;
