import { Router, Request, Response, NextFunction } from 'express';
import { signup } from '../controllers/signupController';
import { login } from '../controllers/loginController';
import { verify } from '../controllers/verifyController';
import { rateCourier } from '../controllers/rateCourierController';
import { googleLogin, googleCallback } from '../controllers/googleAuthController';

const router = Router();

function asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) {
    return function (req: Request, res: Response, next: NextFunction) {
        fn(req, res, next).catch(next);
    };
}

router.post('/signup', asyncHandler(signup));
router.post('/login', asyncHandler(login));
router.get('/verify', asyncHandler(verify));
router.post('/rateCourier', asyncHandler(rateCourier));
router.get('/auth/google/login', googleLogin);
router.get('/auth/google/callback', asyncHandler(googleCallback));

export default router;
