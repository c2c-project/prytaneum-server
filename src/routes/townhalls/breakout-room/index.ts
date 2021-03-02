/* eslint-disable @typescript-eslint/indent */
import { Router } from 'express';
import Joi from 'joi';
import type { ChatMessage, ChatMessageForm, BreakoutForm } from 'prytaneum-typings';
import { ObjectId } from 'mongodb';

import { makeObjectIdValidationObject } from 'utils/validators';
import { makeJoiMiddleware, makeEndpoint, requireLogin, RequireLoginLocals, requireModerator } from 'middlewares';
import {
    createChatMessage,
    deleteChatMessage,
    getBreakoutRooms,
    getChatMessages,
    moderateMessage,
    updateChatMessage,
    startBreakout,
    endBreakout,
    findMyBreakout,
    changeBreakoutRoom,
} from 'modules/chat';
import { breakoutNamespace } from 'socket-io/breakout';
import { getClients } from 'socket-io/utils';
import { TownhallParams } from '../types';

const router = Router();

router.get<TownhallParams>(
    '/:townhallId/breakout-rooms',
    makeEndpoint(async (req, res) => {
        const { townhallId } = req.params;
        const rooms = await getBreakoutRooms(townhallId);
        res.status(200).send(rooms);
    })
);

router.get<TownhallParams, { attendees: number }, void, void, RequireLoginLocals>(
    '/:townhallId/breakout-rooms/attendees',
    requireLogin(),
    requireModerator(),
    makeEndpoint((req, res) => {
        const { townhallId } = req.params;
        const clients = getClients(breakoutNamespace, townhallId);
        res.status(200).send({ attendees: clients.length });
    })
);

/**
 * start breakout rooms in townhall
 */
router.post<TownhallParams, void, BreakoutForm, void, RequireLoginLocals>(
    '/:townhallId/breakout-rooms/start',
    requireLogin(),
    requireModerator(),
    makeJoiMiddleware({
        body: Joi.object({
            numRooms: Joi.number().required(),
        }),
    }),
    makeEndpoint((req, res) => {
        const { numRooms } = req.body;
        const { townhallId } = req.params;
        startBreakout(townhallId, numRooms);
        res.sendStatus(200);
    })
);

/**
 * ends breakout room in townhall
 */
router.post<TownhallParams, void, void, void, RequireLoginLocals>(
    '/:townhallId/breakout-rooms/end',
    requireLogin(),
    requireModerator(),
    makeEndpoint((req, res) => {
        const { townhallId } = req.params;
        endBreakout(townhallId);
        res.sendStatus(200);
    })
);

/**
 * change breakout rooms
 */
router.post<TownhallParams, void, { from: string; to: string }, void, RequireLoginLocals>(
    '/:townhallId/breakout-rooms/change',
    requireLogin(),
    requireModerator(),
    makeJoiMiddleware({
        body: Joi.object({
            ...makeObjectIdValidationObject('from'),
            ...makeObjectIdValidationObject('to'),
        }),
    }),
    makeEndpoint((req, res) => {
        const { from, to } = req.body;
        const { townhallId } = req.params;
        changeBreakoutRoom(townhallId, from, to, req.results.user);
        res.sendStatus(200);
    })
);

/**
 * gets my assigned breakout room
 */
router.get<TownhallParams, { breakoutId: string }, void, void, RequireLoginLocals>(
    '/:townhallId/breakout-rooms/me',
    requireLogin(),
    makeEndpoint(async (req, res) => {
        const { townhallId } = req.params;
        const { user } = req.results;
        const roomId = await findMyBreakout(townhallId, user._id);
        res.status(200).send({ breakoutId: roomId.toHexString() });
    })
);

router.all(
    '/:townhallId/breakout-rooms/:breakoutId/chat-messages/:messageId',
    makeJoiMiddleware({
        params: Joi.object(makeObjectIdValidationObject('breakoutId')).unknown(true),
    })
);

interface BreakoutParams extends TownhallParams {
    breakoutId: string;
    [index: string]: string;
}

/**
 * gets all chat messages
 * TODO: filtering/pagination
 */
router.get<BreakoutParams, ChatMessage<ObjectId>[], void, void, RequireLoginLocals>(
    '/:townhallId/breakout-rooms/:breakoutId/chat-messages',
    makeEndpoint(async (req, res) => {
        const { townhallId, breakoutId } = req.params;
        const messages = await getChatMessages(townhallId, breakoutId);
        res.status(200).send(messages);
    })
);

/**
 * submit a new chat message
 * TODO: if the event is private then I will have to make sure the user was invited to this event
 */
router.post<BreakoutParams, void, ChatMessageForm, void, RequireLoginLocals>(
    '/:townhallId/breakout-rooms/:breakoutId/chat-messages',
    requireLogin(),
    makeJoiMiddleware({
        body: Joi.object({
            message: Joi.string().required(),
        }),
    }),
    makeEndpoint(async (req, res) => {
        const { townhallId, breakoutId } = req.params;
        const { message } = req.body;
        const { user } = req.results;
        await createChatMessage(message, townhallId, breakoutId, user);
        res.sendStatus(200);
    })
);

type MessageParams = { messageId: string } & BreakoutParams;
router.all(
    '/:townhallId/breakout-rooms/:breakoutId/chat-messages/:messageId',
    makeJoiMiddleware({
        params: Joi.object(makeObjectIdValidationObject('messageId')).unknown(true),
    })
);
router.all(
    '/:townhallId/breakout-rooms/:breakoutId/chat-messages/:messageId/*',
    makeJoiMiddleware({
        params: Joi.object(makeObjectIdValidationObject('messageId')).unknown(true),
    })
);

/**
 * updates a chat message
 */
router.put<MessageParams, void, ChatMessageForm, void, RequireLoginLocals>(
    '/:townhallId/breakout-rooms/:breakoutId/chat-messages/:messageId',
    requireLogin(),
    makeEndpoint(async (req, res) => {
        const { townhallId, messageId, breakoutId } = req.params;
        const { message } = req.body;
        const { user } = req.results;
        await updateChatMessage(message, messageId, townhallId, breakoutId, user);
        res.sendStatus(200);
    })
);
/**
 * deletes a chat message
 */
router.delete<MessageParams, void, void, void, RequireLoginLocals>(
    '/:townhallId/breakout-rooms/:breakoutId/chat-messages/:messageId',
    requireLogin(),
    makeEndpoint(async (req, res) => {
        const { townhallId, messageId, breakoutId } = req.params;
        const { user } = req.results;
        await deleteChatMessage(messageId, townhallId, breakoutId, user);
        res.sendStatus(200);
    })
);

/**
 * right now this is idempotent in the future it will produce logs
 * and not be idempotent
 * TODO: gen logs
 * probably merge these in the future
 */
router.post<MessageParams, void, void, void, RequireLoginLocals>(
    '/:townhallId/breakout-rooms/:breakoutId/chat-messages/:messageId/hide',
    requireLogin(),
    requireModerator(),
    makeEndpoint(async (req, res) => {
        const { townhallId, messageId } = req.params;
        await moderateMessage(townhallId, messageId, 'hidden');
        res.sendStatus(200);
    })
);

/**
 * right now this is idempotent in the future it will produce logs
 * and not be idempotent
 * TODO: gen logs
 */
router.post<MessageParams, void, void, void, RequireLoginLocals>(
    '/:townhallId/breakout-rooms/:breakoutId/chat-messages/:messageId/show',
    requireLogin(),
    requireModerator(),
    makeEndpoint(async (req, res) => {
        const { townhallId, messageId } = req.params;
        await moderateMessage(townhallId, messageId, 'visible');
        res.sendStatus(200);
    })
);

export default router;
