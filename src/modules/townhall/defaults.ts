/* eslint-disable import/prefer-default-export */
import { ObjectId } from 'mongodb';
import type { TownhallSettings, TownhallState } from 'prytaneum-typings';

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
    video: {
        url: '',
    },
    rating: {
        enabled: false,
    },
};

export const defaultState: TownhallState<ObjectId> = {
    active: false,
    start: null,
    end: null,
    attendees: {
        current: 0,
        max: 0,
    },
    playlist: {
        position: {
            current: -1,
            timestamps: [],
        },
        queue: [],
        list: [],
    },
};
