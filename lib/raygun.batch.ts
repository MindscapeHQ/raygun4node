import { sendBatch } from "./raygun.transport";
import { startTimer } from "./timer";
import type { IncomingMessage } from "http";
import {
  callVariadicCallback,
  Callback,
  Message,
  HTTPOptions,
  SendOptions,
} from "./types";

const debug = require("debug")("raygun");

export type MessageAndCallback = {
  serializedMessage: string;
  callback: Callback<IncomingMessage> | null;
};

export type PreparedBatch = {
  payload: string;
  messageCount: number;
  callbacks: Callback<IncomingMessage>[];
};

export const MAX_MESSAGES_IN_BATCH = 100;
export const MAX_BATCH_SIZE_BYTES = 1638400;
const MAX_BATCH_INNER_SIZE_BYTES = MAX_BATCH_SIZE_BYTES - 2; // for the starting and ending byte

export class RaygunBatchTransport {
  private messageQueue: MessageAndCallback[] = [];
  private timerId: any | null = null;
  private httpOptions: HTTPOptions;
  private interval: number;
  private batchId: number = 0;

  constructor(options: { interval: number; httpOptions: HTTPOptions }) {
    this.interval = options.interval;
    this.httpOptions = options.httpOptions;
  }

  send(options: SendOptions) {
    this.messageQueue.push({
      serializedMessage: options.message,
      callback: options.callback,
    });

    if (!this.timerId) {
      this.timerId = setTimeout(this.process.bind(this), 1);
    }
  }

  stopProcessing() {
    if (this.timerId) {
      debug("batch transport - stopping");
      clearInterval(this.timerId);

      this.timerId = null;
    }
  }

  private process() {
    debug(
      `batch transport - processing (${this.messageQueue.length} message(s) in queue)`
    );

    const { payload, messageCount, callbacks } = prepareBatch(
      this.messageQueue
    );

    if (messageCount === 0) {
      return;
    }

    const batchId = this.batchId;
    this.batchId++;

    const runAllCallbacks = (
      err: Error | null,
      response: IncomingMessage | null
    ) => {
      const durationInMs = stopTimer();
      if (err) {
        debug(
          `batch transport - error sending batch (id=${batchId}, duration=${durationInMs}ms): ${err}`
        );
      } else {
        debug(
          `batch transport - successfully sent batch (id=${batchId}, duration=${durationInMs}ms)`
        );
      }
      for (const callback of callbacks) {
        callVariadicCallback(callback, err, response);
      }
    };

    debug(
      `batch transport - sending batch (id=${batchId}) (${messageCount} messages, ${payload.length} bytes)`
    );

    const stopTimer = startTimer();

    sendBatch({
      message: payload,
      callback: runAllCallbacks,
      http: this.httpOptions,
    });

    if (this.messageQueue.length > 0) {
      this.timerId = setTimeout(this.process.bind(this), 1000);
    } else {
      this.timerId = null;
    }
  }
}

export function prepareBatch(
  messageQueue: MessageAndCallback[]
): PreparedBatch {
  const batch: string[] = [];
  const callbacks: Callback<IncomingMessage>[] = [];
  let batchSizeBytes = 0;

  for (let i = 0; i < MAX_MESSAGES_IN_BATCH; i++) {
    if (messageQueue.length === 0) {
      break;
    }

    const { serializedMessage, callback } = messageQueue[0];

    if (serializedMessage.length >= MAX_BATCH_INNER_SIZE_BYTES) {
      const messageSize = Math.ceil(serializedMessage.length / 1024);
      const startOfMessage = serializedMessage.slice(0, 1000);

      console.warn(
        `[raygun4node] Error is too large to send to Raygun (${messageSize}kb)\nStart of error: ${startOfMessage}`
      );

      messageQueue.shift();
      continue;
    }

    if (
      batchSizeBytes + serializedMessage.length >
      MAX_BATCH_INNER_SIZE_BYTES
    ) {
      break;
    }

    batch.push(serializedMessage);

    if (callback) {
      callbacks.push(callback);
    }

    if (i === 0) {
      batchSizeBytes += serializedMessage.length;
    } else {
      batchSizeBytes += serializedMessage.length + 1; // to account for the commas between items
    }

    messageQueue.shift();
  }

  return {
    payload: `[${batch.join(",")}]`,
    messageCount: batch.length,
    callbacks,
  };
}
