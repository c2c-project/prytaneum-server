/* eslint-disable import/prefer-default-export */
import type { TownhallSettings } from 'prytaneum-typings';

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
