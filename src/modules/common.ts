import { ObjectId } from 'mongodb';
import type { Meta, User } from 'prytaneum-typings';

export function makeUpdatedBy(
    user: User<ObjectId>,
    date?: Date
): Pick<Meta<ObjectId>, 'updatedAt' | 'updatedBy'> {
    return {
        updatedAt: date || new Date(),
        updatedBy: {
            _id: user._id,
            name: user.name,
        },
    };
}

export function makeMeta(user: User<ObjectId>): Meta<ObjectId> {
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
