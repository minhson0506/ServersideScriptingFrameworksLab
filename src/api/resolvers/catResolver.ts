import {GraphQLError} from 'graphql';
import {Cat} from '../../interfaces/Cat';
import {LocationInput} from '../../interfaces/Location';
import {UserIdWithToken} from '../../interfaces/User';
import rectangleBounds from '../../utils/rectangleBounds';
import catModel from '../models/catModel';
import {Types} from 'mongoose';

// TODO: create resolvers based on cat.graphql
// note: when updating or deleting a cat, you need to check if the user is the owner of the cat
// note2: when updating or deleting a cat as admin, you need to check if the user is an admin by checking the role from the user object

export default {
    Query: {
        // get all cats
        cats: async () => {
            return await catModel.find();
        },
        // get cat by id
        catById: async (parent: undefined, args: {id: string}) => {
            return await catModel.findById(args.id);
        },
        catsByArea: async (
            parent: undefined,
            args: LocationInput
        ) => {
            const bounds = rectangleBounds(args.topRight, args.bottomLeft);
            return await catModel.find({
                location: {
                    $geoWithin: {
                        $geometry: bounds,
                    },
                },
            });
        },
        catsByOwner: async (
            parent: undefined,
            args: UserIdWithToken
        ) => {
            return await catModel.find({owner: args.id});
        },
    },
    Mutation: {
        // create a cat
        createCat: async (
            parent: undefined,
            args: Cat,
            user: UserIdWithToken
        ) => {
            if (!user.token) {
                throw new GraphQLError('Not authorized', { extensions: { code: 'UNAUTHORIZED' } });
            }
            const newCat = new catModel({...args, owner: new Types.ObjectId(user.id)});
            return await newCat.save();
        },
        // update a cat
        updateCat: async (
            parent: undefined,
            args: Cat,
            user: UserIdWithToken
        ) => {
            if (!user.token) {
                throw new GraphQLError('Not authorized', { extensions: { code: 'UNAUTHORIZED' } });
            }

            const cat = await catModel.findById(args.id);
            if(!cat) {
                throw new GraphQLError('Cat not found', { extensions: { code: 'NOT_FOUND' } });
            }

            if (cat.owner._id.toString() !== user.id.toString()) {
                throw new GraphQLError('Not authorized', { extensions: { code: 'UNAUTHORIZED' } });
            }

            return await catModel.findByIdAndUpdate(args.id, args, {new: true});
        },
        deleteCat: async (
            parent: undefined,
            args: {id: string},
            user: UserIdWithToken
        ) => {
            const cat = await catModel.findById(args.id);

            if (!user.token) {
                throw new GraphQLError('Not authorized', { extensions: { code: 'UNAUTHORIZED' } });
            }

            if(!cat) {
                throw new GraphQLError('Cat not found', { extensions: { code: 'NOT_FOUND' } });
            }

            if (cat.owner._id.toString() !== user.id.toString()) {
                throw new GraphQLError('Not authorized', { extensions: { code: 'UNAUTHORIZED' } });
            }

            return await catModel.findByIdAndDelete(args.id);
        },

        // admin functions
        updateCatAsAdmin: async (
            parent: undefined,
            args: Cat,
            user: UserIdWithToken
        ) => {
            if (!user.token) {
                throw new GraphQLError('Not authorized', { extensions: { code: 'UNAUTHORIZED' } });
            }

            if(user.role !== 'admin') {
                throw new GraphQLError('Not authorized as admin', { extensions: { code: 'UNAUTHORIZED' } });
            }

            return await catModel.findByIdAndUpdate(args.id, args, {new: true});
        },
        deleteCatAsAdmin: async (
            parent: undefined,
            args: {id: string},
            user: UserIdWithToken
        ) => {
            if (!user.token) {
                throw new GraphQLError('Not authorized', { extensions: { code: 'UNAUTHORIZED' } });
            }

            if(user.role !== 'admin') {
                throw new GraphQLError('Not authorized as admin', { extensions: { code: 'UNAUTHORIZED' } });
            }

            return await catModel.findByIdAndDelete(args.id);
        }
    },
}