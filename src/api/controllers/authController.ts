import {Request, Response, NextFunction} from 'express';
import jwt from 'jsonwebtoken';
import passport from '../../passport';
import CustomError from '../../classes/CustomError';
import {LoginUser, User, UserOutput} from '../../interfaces/User';

const login = (req: Request, res: Response, next: NextFunction) => {
    passport.authenticate(
        'local',
        {session: false},
        (err: Error, inputUser: User) => {
            if (err || !inputUser) {
                next(new CustomError('Invalid username/password', 200));
                return;
            }

            req.login(inputUser, {session: false}, (error) => {
                if (error) {
                    next(new CustomError('Login error', 400));
                    return;
                }
                const user: UserOutput = {
                    _id: inputUser._id,
                    user_name: inputUser.user_name,
                    email: inputUser.email,
                };

                const token = jwt.sign(user, 'asdf');
                return res.json({user, token});
            });
        }
    )(req, res, next);
};

export {login};