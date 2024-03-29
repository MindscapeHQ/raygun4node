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
  callbacks: Array<Callback<IncomingMessage> | null>;
};

export type BatchState = {
  messages: MessageAndCallback[];
  messageSizeInBytes: number;
};

export const MAX_MESSAGES_IN_BATCH = 100;
export const MAX_BATCH_SIZE_BYTES = 1638400;
const MAX_BATCH_INNER_SIZE_BYTES = MAX_BATCH_SIZE_BYTES - 2; // for the starting and ending byte

export class RaygunBatchTransport {
  private timerId: any | null = null;
  private httpOptions: HTTPOptions;
  private interval: number;
  private batchId: number = 0;

  private batchState: BatchState = { messages: [], messageSizeInBytes: 0 };

  constructor(options: { interval: number; httpOptions: HTTPOptions }) {
    this.interval = options.interval;
    this.httpOptions = options.httpOptions;
  }

  send(options: SendOptions) {
    this.onIncomingMessage({
      serializedMessage: options.message,
      callback: options.callback,
    });

    if (!this.timerId) {
      this.timerId = setTimeout(() => this.processBatch(), 1000);
    }
  }

  stopProcessing() {
    if (this.timerId) {
      debug("batch transport - stopping");
      clearInterval(this.timerId);

      this.timerId = null;
    }
  }

  private onIncomingMessage(messageAndCallback: MessageAndCallback) {
    const { serializedMessage, callback } = messageAndCallback;
    const messageLength = Buffer.byteLength(serializedMessage, "utf-8");

    if (messageLength >= MAX_BATCH_INNER_SIZE_BYTES) {
      const messageSize = Math.ceil(messageLength / 1024);
      const startOfMessage = serializedMessage.slice(0, 1000);

      console.warn(
        `[raygun4node] Error is too large to send to Raygun (${messageSize}kb)\nStart of error: ${startOfMessage}`
      );

      return;
    }

    const messageIsTooLargeToAddToBatch =
      this.batchState.messageSizeInBytes + messageLength >
      MAX_BATCH_INNER_SIZE_BYTES;

    if (messageIsTooLargeToAddToBatch) {
      this.processBatch();
    }

    if (this.batchState.messages.length === 0) {
      this.batchState.messageSizeInBytes += messageLength;
    } else {
      this.batchState.messageSizeInBytes += messageLength + 1; // to account for the commas between items
    }

    this.batchState.messages.push(messageAndCallback);

    const batchIsFull = this.batchState.messages.length === 100;

    if (batchIsFull) {
      this.processBatch();
    }
  }

  private processBatch() {
    const payload = this.batchState.messages
      .map((m) => m.serializedMessage)
      .join(",");

    const batch: PreparedBatch = {
      payload: `[${payload}]`,
      messageCount: this.batchState.messages.length,
      callbacks: this.batchState.messages.map((m) => m.callback),
    };

    this.sendBatch(batch);

    this.batchState = { messages: [], messageSizeInBytes: 0 };

    this.stopProcessing();
  }

  private sendBatch(batch: PreparedBatch) {
    const { payload, messageCount, callbacks } = batch;

    debug(
      `batch transport - processing ( ${messageCount} message(s) in batch)`
    );

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
        if (callback) {
          callVariadicCallback(callback, err, response);
        }
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
  }
}
