// TODO: Add resolvers for cat
// 1. Queries
// 1.1. cats
// 1.2. catById
// 1.3. catsByOwner
// 1.4. catsByArea
// 2. Mutations
// 2.1. createCat
// 2.2. updateCat
// 2.3. deleteCat

import {Cat} from '../../interfaces/Cat';
import {locationInput} from '../../interfaces/Location';
import rectangleBounds from '../../utils/rectangleBounds';
import catModel from '../models/catModel';

export default {
  Query: {
    cats: async () => {
      const cats = await catModel.find();
      return cats;
    },
    catById: async (parent: undefined, args: Cat) => {
      const cat = await catModel.findById(args.id);
      return cat;
    },
    catsByOwner: async (parent: undefined, args: Cat) => {
      const cats = await catModel.find({owner: args.id});
      return cats;
    },
    catsByArea: async (parent: undefined, args: locationInput) => {
      const bounds = rectangleBounds(args.topRight, args.bottomLeft);
      return await catModel.find({
        location: {
          $geoWithin: {
            $geometry: bounds,
          },
        },
      });
    },
  },
  Mutation: {
    createCat: async (parent: undefined, args: Cat) => {
      const cat = new catModel(args);
      return cat.save();
    },
    updateCat: async (parent: undefined, args: Cat) => {
      const cat = await catModel.findByIdAndUpdate(args.id, args, {
        new: true,
      });
      return cat;
    },
    deleteCat: async (parent: undefined, args: Cat) => {
      const cat = await catModel.findByIdAndDelete(args.id);
      return cat;
    },
  },
};
