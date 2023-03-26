// TODO: create the following functions:
// - userGet - get user by id
// - userListGet - get all users
// - userPost - create new user. Remember to hash password
// - userPutCurrent - update current user
// - userDeleteCurrent - delete current user
// - checkToken - check if current user token is valid: return data from req.user. No need for database query

import {Request, Response, NextFunction} from 'express';
import {validationResult} from 'express-validator';
import CustomError from '../../classes/CustomError';
import DBMessageResponse from '../../interfaces/DBMessageResponse';
import {User, UserOutput} from '../../interfaces/User';
import rectangleBounds from '../../utils/rectangleBounds';
import catModel from '../models/catModel';
import bcrypt from 'bcryptjs';
import userModel from '../models/userModel';

const salt = bcrypt.genSaltSync(12);

const userListGet = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const users = await userModel.find().select('-password -__v -role');
        if (!users) {
            next(new CustomError('No users found', 404));
            return;
        }
        res.json(users);
    } catch (err) {
        next(new CustomError((err as Error).message, 500));
    }
};

const userGet = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const user = await userModel
            .findById(req.params.id)
            .select('-password -__v -role');
        if (!user) {
            next(new CustomError('No user found', 404));
            return;
        }
        res.json(user);
    } catch (err) {
        next(new CustomError((err as Error).message, 500));
    }
};

const userPost = async (
    req: Request<{}, {}, User>,
    res: Response,
    next: NextFunction
) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            const messages = errors
                .array()
                .map((error) => `${error.msg}: ${error.param}`)
                .join(',');
            throw new CustomError(messages, 400);
        }

        const {user_name, email, role = 'user', password} = req.body;
        const hashedPassword = bcrypt.hashSync(password, salt);
        const user = await userModel.create({
            user_name,
            email,
            role,
            password: hashedPassword,
        });

        const output: DBMessageResponse = {
            message: 'User created',
            data: {
                _id: user._id,
                user_name: user.user_name,
                email: user.email,
            },
        };
        res.json(output);
    } catch (err) {
        next(new CustomError((err as Error).message, 500));
    }
};

const userPutCurrent = async (
    req: Request<{}, {}, User>,
    res: Response,
    next: NextFunction
) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            const messages = errors
                .array()
                .map((error) => `${error.msg}: ${error.param}`)
                .join(',');
            throw new CustomError(messages, 400);
        }

        const updatedUser = {
            user_name: req.body.user_name
                ? req.body.user_name
                : (req.user as User).user_name,
            email: req.body.email ? req.body.email : (req.user as User).email,
            password:
                req.body.password !== undefined
                    ? bcrypt.hashSync(req.body.password, salt)
                    : (req.user as User).password,
        };

        const user = await userModel.findByIdAndUpdate(
            (req.user as User)._id,
            updatedUser,
            {new: true}
        );

        if (!user) {
            next(new CustomError('No user found', 404));
            return;
        }

        const output: DBMessageResponse = {
            message: 'User updated',
            data: {
                _id: user._id,
                user_name: user.user_name,
                email: user.email,
            },
        };
        res.json(output);
    } catch (err) {
        next(new CustomError((err as Error).message, 500));
    }
};

const userDeleteCurrent = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            const messages = errors
                .array()
                .map((error) => `${error.msg}: ${error.param}`)
                .join(',');
            throw new CustomError(messages, 400);
        }

        const user = await userModel.findByIdAndDelete((req.user as User)._id);
        if (!user) {
            next(new CustomError('No user found', 404));
            return;
        }
        const output: DBMessageResponse = {
            message: 'User deleted',
            data: {
                _id: user._id,
                user_name: user.user_name,
                email: user.email,
            },
        };
        res.json(output);
    } catch (err) {
        next(new CustomError((err as Error).message, 500));
    }
};

const checkToken = (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
        next(new CustomError('No user found', 404));
        return;
    }
    const output: DBMessageResponse = {
        message: 'Token valid',
        data: {
            _id: (req.user as User)._id,
            user_name: (req.user as User).user_name,
            email: (req.user as User).email,
        },
    };
    return res.json(output);
};

export {
    userListGet,
    userGet,
    userPost,
    userPutCurrent,
    userDeleteCurrent,
    checkToken,
};