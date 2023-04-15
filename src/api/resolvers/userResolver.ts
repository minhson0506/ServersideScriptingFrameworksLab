import {response} from 'express';
import {GraphQLError} from 'graphql';
import {Cat} from '../../interfaces/Cat';
import LoginMessageResponse from '../../interfaces/LoginMessageResponse';
import {User, UserIdWithToken} from '../../interfaces/User';
// TODO: create resolvers based on user.graphql
// note: when updating or deleting a user don't send id to the auth server, it will get it from the token
// note2: when updating or deleting a user as admin, you need to check if the user is an admin by checking the role from the user object

export default {
    Cat: {
        owner: async (parent: Cat) => {
            const response = await fetch(`${process.env.AUTH_URL}/users/${parent.owner}`);
            if (!response.ok) {
                throw new GraphQLError(response.statusText, {extensions: {code: 'NOT_FOUND'}});
            }
            return await response.json() as User;
        },
    },
    Query: {
        // get all users
        users: async () => {
            const response = await fetch(`${process.env.AUTH_URL}/users`);
            if (!response.ok) {
                throw new GraphQLError(response.statusText, {extensions: {code: 'NOT_FOUND'}});
            }
            return await response.json() as User[];
        },
        // get user by id
        userById: async (parent: undefined, args: {id: string}) => {
            const response = await fetch(`${process.env.AUTH_URL}/users/${args.id}`);
            if (!response.ok) {
                throw new GraphQLError(response.statusText, {extensions: {code: 'NOT_FOUND'}});
            }
            return await response.json() as User;
        },
        // check token
        checkToken: async (parent: undefined, args: undefined, user: UserIdWithToken) => {
            const response = await fetch(`${process.env.AUTH_URL}/users/token`, {
                headers: {
                    Authorization: `Bearer ${user.token}`,
                },
            });
            if (!response.ok) {
                throw new GraphQLError(response.statusText, {extensions: {code: 'NOT_FOUND'}});
            }
            return await response.json();
        },
    },
    Mutation: {
        login: async (
            _parent: unknown,
            args: {credentials: {username: string; password: string}}
        ) => {
            console.log(args.credentials);
            const response = await fetch(`${process.env.AUTH_URL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(args.credentials),
            });
            if (!response.ok) {
                throw new GraphQLError(response.statusText, {
                    extensions: {code: 'NOT_FOUND'},
                });
            }
            const user = (await response.json()) as LoginMessageResponse;
            return user;
        },
        register: async (_parent: unknown, args: {user: User}) => {
            const response = await fetch(`${process.env.AUTH_URL}/users`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(args.user),
            });
            if (!response.ok) {
                throw new GraphQLError(response.statusText, {
                    extensions: {code: 'VALIDATION_ERROR'},
                });
            }
            const user = (await response.json()) as LoginMessageResponse;
            return user;
        },
        updateUser: async (
            _parent: unknown,
            args: {user: User},
            user: UserIdWithToken
        ) => {
            if (!user.token) {
                throw new GraphQLError('Not authorized', {
                    extensions: {code: 'NOT_AUTHORIZED'},
                });
            }

            const response = await fetch(`${process.env.AUTH_URL}/users`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${user.token}`,
                },
                body: JSON.stringify(args.user),
            });
            if (!response.ok) {
                throw new GraphQLError(response.statusText, {
                    extensions: {code: 'NOT_FOUND'},
                });
            }
            const userFromPut = (await response.json()) as LoginMessageResponse;
            return userFromPut;
        },
        deleteUser: async (
            _parent: unknown,
            _args: unknown,
            user: UserIdWithToken
        ) => {
            if (!user.token) {
                throw new GraphQLError('Not authorized', {
                    extensions: {code: 'NOT_AUTHORIZED'},
                });
            }

            const response = await fetch(`${process.env.AUTH_URL}/users`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${user.token}`,
                },
            });
            if (!response.ok) {
                throw new GraphQLError(response.statusText, {
                    extensions: {code: 'NOT_FOUND'},
                });
            }
            const userFromDelete = (await response.json()) as LoginMessageResponse;
            return userFromDelete;
        },
        updateUserAsAdmin: async (
            _parent: unknown,
            args: {user: User; id: string},
            user: UserIdWithToken
        ) => {
            if (!user.token) {
                throw new GraphQLError('Unauthorized', {
                    extensions: {
                        code: 'UNAUTHORIZED',
                    },
                });
            }

            if (user.role !== 'admin') {
                throw new GraphQLError('Unauthorized', {
                    extensions: {
                        code: 'UNAUTHORIZED',
                    },
                });
            }

            const response = await fetch(`${process.env.AUTH_URL}/users/${args.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${user.token}`,
                },
                body: JSON.stringify(args.user),
            });
            if (!response.ok) {
                throw new GraphQLError(response.statusText, {
                    extensions: {
                        code: 'NOT_FOUND',
                    },
                });
            }

            return await response.json();
        },
        deleteUserAsAdmin: async (
            _parent: unknown,
            args: {id: string},
            user: UserIdWithToken
        ) => {
            if (!user.token) {
                throw new GraphQLError('Unauthorized', {
                    extensions: {
                        code: 'UNAUTHORIZED',
                    },
                });
            }

            if (user.role !== 'admin') {
                throw new GraphQLError('Unauthorized', {
                    extensions: {
                        code: 'UNAUTHORIZED',
                    },
                });
            }

            const response = await fetch(`${process.env.AUTH_URL}/users/${args.id}`, {
                method: 'DELETE',
                headers: {
                    Authorization: `Bearer ${user.token}`,
                },
            });

            if (!response.ok) {
                throw new GraphQLError(response.statusText, {
                    extensions: {
                        code: 'NOT_FOUND',
                    },
                });
            }

            return await response.json();
        },
    },
};

