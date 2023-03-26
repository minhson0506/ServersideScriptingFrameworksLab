import {Point} from 'geojson';
import mongoose from 'mongoose';
import {User} from './User';

// TODO: cat interface
interface Cat extends Document {
    _id: mongoose.Schema.Types.ObjectId;
    cat_name: string;
    weight: number;
    filename: string;
    birthdate: string;
    coords: Point;
    owner: User;
}

interface CatPut {
    cat_name: string;
    weight: number;
    filename: string;
    birthdate: string;
    coords: Point;
}

export {Cat, CatPut};