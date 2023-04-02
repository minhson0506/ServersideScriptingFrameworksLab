// TODO: Add resolvers for user
// 1. Queries
// 1.1. users
// 1.2. userById
// 2. Mutations
// 2.1. createUser
// 2.2. updateUser
// 2.3. deleteUser

import {Cat} from '../../interfaces/Cat';
import {User} from '../../interfaces/User';
import userModel from '../models/userModel';

export default {
  Cat: {
    owner: async (parent: Cat) => {
      return await userModel.findById(parent.owner);
    },
  },
  Query: {
    users: async () => {
      const users = await userModel.find();
      return users;
    },
    userById: async (parent: undefined, args: User) => {
      const user = await userModel.findById(args.id);
      return user;
    },
  },
  Mutation: {
    createUser: async (parent: undefined, args: User) => {
      const user = new userModel(args);
      return user.save();
    },
    updateUser: async (parent: undefined, args: User) => {
      const user = await userModel.findByIdAndUpdate(args.id, args, {
        new: true,
      });
      return user;
    },
    deleteUser: async (parent: undefined, args: User) => {
      const user = await userModel.findByIdAndDelete(args.id);
      return user;
    },
  },
};
