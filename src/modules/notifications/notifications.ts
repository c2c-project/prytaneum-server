import { useCollection } from 'db';
// eslint-disable-next-line import/no-extraneous-dependencies
import { NotificationMetaData } from 'prytaneum-typings/dist/notifications';
import createHttpError from 'http-errors';

/**
 * @description fetches the relevant up to date unsubscribed list from the database
 * @param {string} region region that relates to the data
 * @return {Promise<Array<string>>} A Promise that resolves to an array of strings
 * @throws Error: if no document is found
 */
const getUnsubList = async (region: string): Promise<Array<string>> => {
    const doc = await useCollection('Notifications', (Notifications) => {
        return Notifications.findOne({ region });
    });
    if (!doc) throw createHttpError(404, 'Region doc not found');
    return doc.unsubscribeList;
};

/**
 * @description fetches the relevant up to date subscribed list from the database
 * @param {string} region region that relates to the data
 * @return {Promise<Array<string>>} A Promise that resolves to an array of strings
 * @throws Error: if no document is found
 */
const getSubList = async (region: string): Promise<Array<string>> => {
    const doc = await useCollection('Notifications', (Notifications) => {
        return Notifications.findOne({ region });
    });
    if (!doc) throw createHttpError(404, 'Region doc not found');
    return doc.subscribeList;
};

/**
 * @description adds an email to the relevant unsubscribed list in the database
 * @param {string} email email to be added to the list
 * @param {string} region region that relates to the data
 * @return {Promise<void>}
 */
const addToUnsubList = async (
    email: string,
    region: string
): Promise<void> => {
    const { value } = await useCollection('Notifications', (Notifications) => {
        return Notifications.findOneAndUpdate(
            { region },
            {
                $addToSet: { unsubscribeList: email }
            }
        );
    });
    if (!value) throw createHttpError(404, 'Region doc not found');
};

/**
 * @descritpion removes an email from the relevant unsubscribed list in the database
 * @param {string} email email to be added to the list
 * @param {string} region region that relates to the data
 * @return {Proise<void>}
 */
const removeFromUnsubList = async (
    email: string,
    region: string
): Promise<void> => {
    const { value } = await useCollection('Notifications', (Notifications) => {
        return Notifications.findOneAndUpdate({ region },
            { $pull: { unsubscribeList: email } }
        );
    });
    if (!value) throw createHttpError(404, 'Region doc not found');
};

/**
 * @description subscribes user to receive notifications
 * @param {string} email email to be added to the list
 * @param {string} region region that relates to the data
 * @return {Promise<void>}
 */
const addToSubList = async (
    email: string,
    region: string
): Promise<void> => {
    const { value } = await useCollection('Notifications', (Notifications) => {
        return Notifications.findOneAndUpdate(
            { region },
            { $addToSet: { subscribeList: email } }
        );
    });
    if (!value) throw createHttpError(404, 'Region doc not found');
};

/**
 * @descritpion removes an email from the relevant subscribed list in the database
 * @param {string} email email to be added to the list
 * @param {string} region region that relates to the data
 * @return {Proise<void>}
 */
const removeFromSubList = async (
    email: string,
    region: string
): Promise<void> => {
    const { value } = await useCollection('Notifications', (Notifications) => {
        return Notifications.findOneAndUpdate(
            { region },
            { $pull: { subscribeList: email } }
        );
    });
    if (!value) throw createHttpError(404, 'Region doc not found');
};

/**
 * @descritpion Checks if a given email is in the relevant subscribe list
 * @param {string} email email to be added to the list
 * @param {string} region region that relates to the data
 * @return {Promise<boolean>} Promise that resolves to a boolean
 * @throws Error: if no document is found
 */
const isSubscribed = async (
    email: string,
    region: string
): Promise<boolean> => {
    // const query = { subscribeList: { $elemMatch: email } };
    // const emailHash = uuidv5(email, uuidv5.URL);
    const doc = await useCollection('Notifications', (Notifications) => {
        return Notifications.findOne({ region });
    });
    if (!doc) throw createHttpError(404, 'Region doc not found');
    const { subscribeList } = doc;
    return subscribeList.includes(email);
};

/**
 * @descritpion Checks if a given email is in the relevant unsubscribe list
 * @param {string} email email to be added to the list
 * @param {string} region region that relates to the data
 * @return {Promise<boolean>} Promise that resolves to a boolean
 * @throws Error: if no document is found
 */
const isUnsubscribed = async (
    email: string,
    region: string
): Promise<boolean> => {
    const doc = await useCollection('Notifications', (Notifications) => {
        return Notifications.findOne({ region });
    });
    if (!doc) throw createHttpError(404, 'Region doc not found');
    const { unsubscribeList } = doc;
    return unsubscribeList.includes(email);
};

/**
 * @description adds invite metadata to invite history
 * @param {NotificationMetaData} metadata  invite metadata
 * @param {string} region region region that relates to the data
 * @returns {Promise<void>}
 */
const addToInviteHistory = async (
    metadata: NotificationMetaData,
    region: string
): Promise<void> => {
    const { value } = await useCollection('Notifications', (Notifications) => {
        return Notifications.findOneAndUpdate(
            { region },
            { $addToSet: { inviteHistory: metadata } }
        );
    });
    if (!value) throw createHttpError(404, 'Region doc not found');
};

export default {
    getUnsubList,
    getSubList,
    addToUnsubList,
    removeFromUnsubList,
    addToSubList,
    removeFromSubList,
    isSubscribed,
    isUnsubscribed,
    addToInviteHistory,
};
