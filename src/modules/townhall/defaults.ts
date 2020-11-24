/* eslint-disable import/prefer-default-export */
import { TownhallSettings } from 'prytaneum-typings';

export const defaultSettings: TownhallSettings = {
    waitingRoom: {
        enabled: false,
        scheduled: null,
    },
    chat: {
        enabled: false,
        automated: false,
    },
    questionQueue: {
        transparent: false,
        automated: false,
    },
    credits: {
        enabled: false,
        list: [],
    },
    attachments: {
        enabled: false,
        list: [],
    },
    moderators: {
        list: [],
        primary: '',
    },
    speakers: {
        list: [],
    },
    registration: {
        reminders: {
            enabled: false,
            customTimes: [],
        },
        registrants: [],
    },
};
