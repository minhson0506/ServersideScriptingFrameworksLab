import {Request, Response, NextFunction} from 'express';
import {validationResult} from 'express-validator';
import CustomError from '../../classes/CustomError';
import {Cat, CatPut} from '../../interfaces/Cat';
import DBMessageResponse from '../../interfaces/DBMessageResponse';
import {User} from '../../interfaces/User';
import rectangleBounds from '../../utils/rectangleBounds';
import catModel from '../models/catModel';
import userModel from '../models/userModel';
// TODO: create following functions:
// - catGetByUser - get all cats by current user id
// - catGetByBoundingBox - get all cats by bounding box coordinates (getJSON)
// - catPutAdmin - only admin can change cat owner
// - catDeleteAdmin - only admin can delete cat
// - catDelete - only owner can delete cat
// - catPut - only owner can update cat
// - catGet - get cat by id
// - catListGet - get all cats
// - catPost - create new cat

const catListGet = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const cats = await catModel.find().populate('owner', '_id user_name email');
        if (!cats) {
            next(new CustomError('No cats found', 404));
            return;
        }
        res.json(cats);
    } catch (err) {
        next(new CustomError((err as Error).message, 500));
    }
};

const catGet = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const cat = await catModel
            .findById(req.params.id)
            .populate('owner', '_id user_name email');
        if (!cat) {
            next(new CustomError('No cat found', 404));
            return;
        }
        res.json(cat);
    } catch (err) {
        next(new CustomError((err as Error).message, 500));
    }
};

const catGetByUser = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const cats = await catModel
            .find({owner: (req.user as User)._id})
            .populate('owner', '_id user_name email');
        if (!cats) {
            next(new CustomError('No cats found', 404));
            return;
        }
        res.json(cats);
    } catch (err) {
        next(new CustomError((err as Error).message, 500));
    }
};

const catGetByBoundingBox = async (
    req: Request<{}, {}, {}, {topRight: string; bottomLeft: string}>,
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

        const {topRight, bottomLeft} = req.query;
        const [trLat, trLng] = topRight.split(',');
        const [blLat, blLng] = bottomLeft.split(',');
        const bounds = rectangleBounds(
            {lat: trLat, lng: trLng},
            {lat: blLat, lng: blLng}
        );

        const cats = await catModel.find({
            coords: {
                $geoWithin: {
                    $geometry: bounds,
                },
            },
        });

        if (!cats) {
            next(new CustomError('No cats found', 404));
            return;
        }
        res.json(cats);
    } catch (error) {
        next(new CustomError((error as Error).message, 500));
    }
};

const catPost = async (
    req: Request<{}, {}, Cat>,
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

        const cat = await catModel.create({
            ...req.body,
            owner: {
                _id: (req.user as User)._id,
                user_name: (req.user as User).user_name,
                email: (req.user as User).email,
            },
            filename: req.file!.filename,
            coords: {
                type: 'Point',
                coordinates: [
                    res.locals.coords.coordinates[0],
                    res.locals.coords.coordinates[1],
                ],
            },
        });
        await cat.populate('owner', '_id user_name email');

        const output: DBMessageResponse = {
            message: 'Cat created',
            data: cat,
        };
        //console.log('Cat output', output);
        res.json(output);
    } catch (err) {
        console.log('Cat error', err);
        next(new CustomError((err as Error).message, 500));
    }
};

const catPutBaseFunc = async (id: string, data: CatPut) => {
    try {
        const cat = await catModel.findByIdAndUpdate(id, data, {new: true});

        if (!cat) {
            throw new CustomError('No cat found', 404);
        }
        await cat.populate('owner', '_id user_name email');

        return cat;
    } catch (err) {
        throw new CustomError((err as Error).message, 500);
    }
};

const catPut = async (
    req: Request<{id: string}, {}, CatPut>,
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

        const cat = await catModel.findById(req.params.id);

        if (!cat) {
            next(new CustomError('No cat found', 404));
            return;
        }

        if (cat.owner._id.toString() !== (req.user as User)._id.toString()) {
            next(new CustomError('Unauthorized', 401));
            return;
        }

        const data: CatPut = {
            cat_name: req.body.cat_name ? req.body.cat_name : cat.cat_name,
            weight: req.body.weight ? req.body.weight : cat.weight,
            filename: req.file ? req.file.filename : cat.filename,
            birthdate: req.body.birthdate ? req.body.birthdate : cat.birthdate,
            coords: req.body.coords ? req.body.coords : cat.coords,
        };
        //console.log('Cat data', data);
        const output = await catPutBaseFunc(req.params.id, data);
        const outputMessage: DBMessageResponse = {
            message: 'Cat updated',
            data: output,
        };
        res.json(outputMessage);
    } catch (err) {
        next(new CustomError((err as Error).message, 500));
    }
};

const catPutAdmin = async (
    req: Request<{id: string}, {}, Cat>,
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

        const currentUser = await userModel.findById((req.user as User)._id);
        if (!currentUser) {
            next(new CustomError('No user found', 404));
            return;
        }

        if (currentUser.role !== 'admin') {
            next(new CustomError('Unauthorized', 401));
            return;
        }

        const cat = await catModel.findById(req.params.id);
        if (!cat) {
            next(new CustomError('No cat found', 404));
            return;
        }

        const data: CatPut = {
            cat_name: req.body.cat_name ? req.body.cat_name : cat.cat_name,
            weight: req.body.weight ? req.body.weight : cat.weight,
            filename: req.file ? req.file.filename : cat.filename,
            birthdate: req.body.birthdate ? req.body.birthdate : cat.birthdate,
            coords: req.body.coords ? req.body.coords : cat.coords,
        };

        const output = await catPutBaseFunc(req.params.id, data);
        const outputMessage: DBMessageResponse = {
            message: 'Cat updated',
            data: output,
        };
        res.json(outputMessage);
    } catch (err) {
        next(new CustomError((err as Error).message, 500));
    }
};

const catDeleteBaseFunc = async (id: string) => {
    try {
        const cat = await catModel
            .findByIdAndDelete(id)
            .populate('owner', '_id user_name email');
        if (!cat) {
            throw new CustomError('No cat found', 404);
        }

        return cat;
    } catch (err) {
        throw new CustomError((err as Error).message, 500);
    }
};

const catDelete = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            const messages = errors
                .array()
                .map((error) => `${error.msg}: ${error.param}`)
                .join(',');
            throw new CustomError(messages, 400);
        }

        const cat = await catModel.findById(req.params.id);
        if (!cat) {
            next(new CustomError('No cat found', 404));
            return;
        }

        if (cat.owner._id.toString() !== (req.user as User)._id.toString()) {
            next(new CustomError('Unauthorized', 401));
            return;
        }

        const output = await catDeleteBaseFunc(req.params.id);
        const outputMessage: DBMessageResponse = {
            message: 'Cat deleted',
            data: output,
        };
        res.json(outputMessage);
    } catch (err) {
        next(new CustomError((err as Error).message, 500));
    }
};

const catDeleteAdmin = async (
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

        const currentUser = await userModel.findById((req.user as User)._id);
        if (!currentUser) {
            next(new CustomError('No user found', 404));
            return;
        }
        if (currentUser.role !== 'admin') {
            next(new CustomError('Unauthorized', 401));
            return;
        }

        const output = await catDeleteBaseFunc(req.params.id);
        const outputMessage: DBMessageResponse = {
            message: 'Cat deleted',
            data: output,
        };
        res.json(outputMessage);
    } catch (err) {
        next(new CustomError((err as Error).message, 500));
    }
};

export {
    catListGet,
    catGet,
    catGetByUser,
    catGetByBoundingBox,
    catPost,
    catPut,
    catPutAdmin,
    catDelete,
    catDeleteAdmin,
};