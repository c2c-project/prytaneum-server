/* eslint-disable @typescript-eslint/indent */
import { Router } from 'express';
import Joi from 'joi';
import { ChatMessage, ChatMessageForm } from 'prytaneum-typings';

import { makeObjectIdValidationObject } from 'utils/validators';
import {
    makeJoiMiddleware,
    makeEndpoint,
    requireLogin,
    RequireLoginLocals,
} from 'middlewares';
import {
    createChatMessage,
    deleteChatMessage,
    getChatMessages,
    moderateMessage,
    updateChatMessage,
} from 'modules/chat';
import requireModerator from 'middlewares/requireModerator';
import { TownhallParams } from '../types';

const router = Router();

/**
 * gets all chat messages
 * TODO: filtering/pagination
 */
router.get<TownhallParams, ChatMessage[], void, void, RequireLoginLocals>(
    '/:townhallId/chat-messages',
    requireLogin(),
    makeEndpoint(async (req, res) => {
        const { townhallId } = req.params;
        const messages = await getChatMessages(townhallId);
        res.status(200).send(messages);
    })
);

/**
 * submit a new chat message
 */
router.post<TownhallParams, void, ChatMessageForm, void, RequireLoginLocals>(
    '/:townhallId/chat-messages',
    requireLogin(),
    makeJoiMiddleware({
        body: Joi.object({
            message: Joi.string().required(),
        }),
    }),
    makeEndpoint(async (req, res) => {
        const { townhallId } = req.params;
        const { message } = req.body;
        const { user } = req.results;
        await createChatMessage(message, townhallId, user);
        res.status(200);
    })
);

type MessageParams = { messageId: string } & TownhallParams;
router.all(
    '/:townhallId/chat-messages/:messageId',
    makeJoiMiddleware({
        params: Joi.object(makeObjectIdValidationObject('messageId')).unknown(
            true
        ),
    })
);
router.all(
    '/:townhallId/chat-messages/:messageId/*',
    makeJoiMiddleware({
        params: Joi.object(makeObjectIdValidationObject('messageId')).unknown(
            true
        ),
    })
);

/**
 * updates a chat message
 */
router.put<MessageParams, void, ChatMessageForm, void, RequireLoginLocals>(
    '/:townhallId/chat-messages/:messageId',
    requireLogin(),
    makeEndpoint(async (req, res) => {
        const { townhallId, messageId } = req.params;
        const { message } = req.body;
        const { user } = req.results;
        await updateChatMessage(message, messageId, townhallId, user);
        res.status(200);
    })
);
/**
 * deletes a chat message
 */
router.delete<MessageParams, void, void, void, RequireLoginLocals>(
    '/:townhallId/chat-messages/:messageId',
    requireLogin(),
    makeEndpoint(async (req, res) => {
        const { townhallId, messageId } = req.params;
        const { user } = req.results;
        await deleteChatMessage(messageId, townhallId, user);
        res.status(200);
    })
);

/**
 * right now this is idempotent in the future it will produce logs
 * and not be idempotent
 * TODO: gen logs
 * probably merge these in the future
 */
router.post<MessageParams, void, void, void, RequireLoginLocals>(
    '/:townhallId/chat-messages/:messageId/hide',
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
    '/:townhallId/chat-messages/:messageId/show',
    requireLogin(),
    requireModerator(),
    makeEndpoint(async (req, res) => {
        const { townhallId, messageId } = req.params;
        await moderateMessage(townhallId, messageId, 'visible');
        res.sendStatus(200);
    })
);

export default router;
