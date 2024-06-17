import { sendBatch } from "./raygun.transport";
import { startTimer } from "./timer";
import type { IncomingMessage } from "http";
import { HTTPOptions, SendOptions } from "./types";

const debug = require("debug")("raygun");

export type MessageAndCallback = {
  serializedMessage: string;
  resolve: (message: IncomingMessage) => void;
  reject: (error: Error) => void;
};

export type PreparedBatch = {
  payload: string;
  messageCount: number;
  resolves: Array<(message: IncomingMessage) => void>;
  rejects: Array<(error: Error) => void>;
};

export type BatchState = {
  messages: MessageAndCallback[];
  messageSizeInBytes: number;
};

export const MAX_MESSAGES_IN_BATCH = 100;
export const MAX_BATCH_SIZE_BYTES = 1638400;
const MAX_BATCH_INNER_SIZE_BYTES = MAX_BATCH_SIZE_BYTES - 2; // for the starting and ending byte

export class RaygunBatchTransport {
  private timerId: NodeJS.Timeout | null = null;

  private httpOptions: HTTPOptions;

  private interval: number;

  private batchId: number = 0;

  private batchState: BatchState = { messages: [], messageSizeInBytes: 0 };

  constructor(options: { interval: number; httpOptions: HTTPOptions }) {
    this.interval = options.interval;
    this.httpOptions = options.httpOptions;
  }

  /**
   * Enqueues send request to batch processor.
   * @param options send options without callback
   * @return Promise with response or error if rejected
   */
  send(options: SendOptions): Promise<IncomingMessage> {
    const promise = this.onIncomingMessage(options.message);

    if (!this.timerId) {
      this.timerId = setTimeout(() => this.processBatch(), 1000);
    }

    return promise;
  }

  stopProcessing() {
    if (this.timerId) {
      debug("[raygun.batch.ts] Batch transport - stopping");
      clearInterval(this.timerId);

      this.timerId = null;
    }
  }

  private onIncomingMessage(
    serializedMessage: string,
  ): Promise<IncomingMessage> {
    const messageLength = Buffer.byteLength(serializedMessage, "utf-8");

    if (messageLength >= MAX_BATCH_INNER_SIZE_BYTES) {
      const messageSize = Math.ceil(messageLength / 1024);
      const startOfMessage = serializedMessage.slice(0, 1000);

      const errorMessage = `Error is too large to send to Raygun (${messageSize}kb)\nStart of error: ${startOfMessage}`;
      console.error(`[Raygun4Node] ${errorMessage}`);
      throw Error(errorMessage);
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

    const promise = new Promise<IncomingMessage>((resolve, reject) => {
      this.batchState.messages.push({ serializedMessage, resolve, reject });
    });

    const batchIsFull = this.batchState.messages.length === 100;

    if (batchIsFull) {
      this.processBatch();
    }

    return promise;
  }

  private processBatch() {
    const payload = this.batchState.messages
      .map((m) => m.serializedMessage)
      .join(",");

    const batch: PreparedBatch = {
      payload: `[${payload}]`,
      messageCount: this.batchState.messages.length,
      resolves: this.batchState.messages.map((m) => m.resolve),
      rejects: this.batchState.messages.map((m) => m.reject),
    };

    this.sendBatch(batch);

    this.batchState = { messages: [], messageSizeInBytes: 0 };

    this.stopProcessing();
  }

  private sendBatch(batch: PreparedBatch) {
    const { payload, messageCount, resolves, rejects } = batch;

    debug(
      `[raygun.batch.ts] Batch transport - processing (${messageCount} message(s) in batch)`,
    );

    const batchId = this.batchId;

    this.batchId++;

    const runAllCallbacks = (
      err: Error | null,
      response: IncomingMessage | null,
    ) => {
      const durationInMs = stopTimer();
      if (err) {
        debug(
          `[raygun.batch.ts] Batch transport - error sending batch (id=${batchId}, duration=${durationInMs}ms): ${err}`,
        );
        for (const reject of rejects) {
          reject(err);
        }
      } else {
        debug(
          `[raygun.batch.ts] Batch transport - successfully sent batch (id=${batchId}, duration=${durationInMs}ms)`,
        );
        if (response) {
          for (const resolve of resolves) {
            resolve(response);
          }
        }
      }
    };

    debug(
      `[raygun.batch.ts] Batch transport - sending batch (id=${batchId}, ${messageCount} messages, ${payload.length} bytes)`,
    );

    const stopTimer = startTimer();

    sendBatch({
      message: payload,
      http: this.httpOptions,
    })
      .then((response) => {
        // Call to original callbacks for success
        runAllCallbacks(null, response);
      })
      .catch((error) => {
        // Call to original callbacks for error
        runAllCallbacks(error, null);
      });
  }
}
