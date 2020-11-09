import { Cursor, ObjectID } from 'mongodb';
import { useCollection } from 'db';
import { User } from 'prytaneum-typings';

type FilteredUser = Pick<User, '_id' | 'email' | 'meta' | 'name' | 'roles'>;
function filterFields(cursor: Cursor<User>) {
    return cursor.project({
        _id: 1,
        email: 1,
        meta: 1,
        name: 1,
        roles: 1,
    });
}

export async function getUsers() {
    return useCollection('Users', (Users) =>
        filterFields(Users.find()).toArray()
    );
}

export async function getUser(userId: string) {
    const user = await useCollection('Users', (Users) =>
        Users.findOne({ _id: new ObjectID(userId) })
    );
    if (!user) throw new Error('User not found');
    
    const filteredUser: FilteredUser = {
        _id: user._id,
        email: user.email,
        meta: user.meta,
        name: user.name,
        roles: user.roles,
    };
    return filteredUser;
}
