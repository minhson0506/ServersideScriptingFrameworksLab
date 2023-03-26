import mongoose from 'mongoose';
// TODO: user interface
enum Role {
    admin = 'admin',
    user = 'user',
}

interface User extends Document {
    _id: mongoose.Schema.Types.ObjectId;
    user_name: string;
    email: string;
    role: Role;
    password: string;
}

interface UserOutput {
    _id: mongoose.Schema.Types.ObjectId;
    user_name: string;
    email: string;
}

interface LoginUser {
    _id: mongoose.Schema.Types.ObjectId;
    username: string;
    password: string;
}

interface UserTest {
    user_name: string;
    email: string;
    password: string;
}

export {Role, User, UserOutput, LoginUser, UserTest};