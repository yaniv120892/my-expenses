"use strict";
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const chatService_1 = __importDefault(require("../services/chatService"));
const logger_1 = __importDefault(require("../utils/logger"));
class ChatController {
    constructor() {
        /**
         * Streams the assistant's reply as Server-Sent Events.
         *
         * This writes to the response directly instead of going through
         * handleRequest(), which always terminates with res.json() and cannot stream.
         */
        this.handleChatMessage = async (req, res) => {
            var _a, e_1, _b, _c;
            var _d, _e;
            const messages = (_d = req.body) === null || _d === void 0 ? void 0 : _d.messages;
            const userId = (_e = req.userId) !== null && _e !== void 0 ? _e : '';
            if (!messages || !Array.isArray(messages) || messages.length === 0) {
                res.status(400).json({ error: 'At least one message is required.' });
                return;
            }
            logger_1.default.debug('Start handle chat message', { userId });
            res.setHeader('Content-Type', 'text/event-stream');
            res.setHeader('Cache-Control', 'no-cache');
            res.setHeader('Connection', 'keep-alive');
            res.flushHeaders();
            // Stop the agent when the client disconnects, so closing the chat dialog
            // does not leave a model run and its tool calls going.
            const controller = new AbortController();
            req.on('close', () => controller.abort());
            try {
                const textStream = await chatService_1.default.streamChatResponse(messages, userId, controller.signal);
                try {
                    for (var _f = true, textStream_1 = __asyncValues(textStream), textStream_1_1; textStream_1_1 = await textStream_1.next(), _a = textStream_1_1.done, !_a; _f = true) {
                        _c = textStream_1_1.value;
                        _f = false;
                        const delta = _c;
                        this.send(res, { type: 'delta', value: delta });
                    }
                }
                catch (e_1_1) { e_1 = { error: e_1_1 }; }
                finally {
                    try {
                        if (!_f && !_a && (_b = textStream_1.return)) await _b.call(textStream_1);
                    }
                    finally { if (e_1) throw e_1.error; }
                }
                this.send(res, { type: 'done' });
                logger_1.default.debug('Done handle chat message', { userId });
            }
            catch (error) {
                logger_1.default.error('Failed to handle chat message', { error });
                // Headers are already sent, so the error middleware cannot set a status
                // code here — the failure has to travel as a stream event instead.
                this.send(res, {
                    type: 'error',
                    message: "I'm sorry, something went wrong while I was trying to answer that. Please try again.",
                });
            }
            finally {
                res.end();
            }
        };
    }
    send(res, payload) {
        res.write(`data: ${JSON.stringify(payload)}\n\n`);
    }
}
exports.default = new ChatController();
