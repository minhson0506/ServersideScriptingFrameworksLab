import {RowDataPacket} from 'mysql2';
interface User {
  user_id: number;
  user_name: string;
  email: string;
  role: 'user' | 'admin';
  password: string;
}

interface Owner {
  owner_id: number;
  owner_name: string;
}

// TODO: create interface GetUser that extends RowDataPacket and User
interface GetUser extends RowDataPacket, User {}

// TODO create interface PostUser that extends User but without id
type PostUser = Omit<User, 'user_id' | 'role'>;

// TODO create interface PutUser that extends PostUser but all properties are optional
type PutUser = Partial<PostUser>;

export {User, GetUser, PostUser, PutUser, Owner};
