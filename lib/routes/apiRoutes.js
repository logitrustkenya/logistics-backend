"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const signupController_1 = require("../controllers/signupController");
const loginController_1 = require("../controllers/loginController");
const verifyController_1 = require("../controllers/verifyController");
const rateCourierController_1 = require("../controllers/rateCourierController");
const googleAuthController_1 = require("../controllers/googleAuthController");
const router = (0, express_1.Router)();
function asyncHandler(fn) {
    return function (req, res, next) {
        fn(req, res, next).catch(next);
    };
}
router.post('/signup', asyncHandler(signupController_1.signup));
router.post('/login', asyncHandler(loginController_1.login));
router.get('/verify', asyncHandler(verifyController_1.verify));
router.post('/rateCourier', asyncHandler(rateCourierController_1.rateCourier));
router.get('/auth/google/login', googleAuthController_1.googleLogin);
router.get('/auth/google/callback', asyncHandler(googleAuthController_1.googleCallback));
exports.default = router;
