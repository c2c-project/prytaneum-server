import { Meta, User } from 'prytaneum-typings';

export function makeUpdatedBy(
    user: User,
    date?: Date
): Pick<Meta, 'updatedAt' | 'updatedBy'> {
    return {
        updatedAt: date || new Date(),
        updatedBy: {
            _id: user._id,
            name: user.name,
        },
    };
}

export function makeMeta(user: User): Meta {
    const date = new Date();
    const byField = {
        _id: user._id,
        name: user.name,
    };
    return {
        createdAt: date,
        createdBy: byField,
        ...makeUpdatedBy(user, date),
    };
}
