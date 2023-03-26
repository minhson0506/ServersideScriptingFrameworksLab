import express from 'express';
import {
    checkToken,
    userDeleteCurrent,
    userGet,
    userListGet,
    userPost,
    userPutCurrent,
} from '../controllers/userController';
import passport from '../../passport';
import {body} from 'express-validator';

const router = express.Router();

// TODO: add validation

router
    .route('/')
    .get(userListGet)
    .post(
        body('user_name').notEmpty().escape(),
        body('email').isEmail().escape(),
        body('password').notEmpty().escape(),
        userPost
    )
    .put(passport.authenticate('jwt', {session: false}), userPutCurrent)
    .delete(passport.authenticate('jwt', {session: false}), userDeleteCurrent);

router.get(
    '/token',
    passport.authenticate('jwt', {session: false}),
    checkToken
);

router.route('/:id').get(userGet);

export default router;