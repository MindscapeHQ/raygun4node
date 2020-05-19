import { Message, HTTPOptions } from "./types";
import { send } from "./raygun.transport";

const debug = require("debug")("raygun");

export type MessageAndCallback = {
  serializedMessage: string;
  callback: Function;
};

const MAX_MESSAGES_IN_BATCH = 100;
const MAX_BATCH_SIZE_BYTES = 1638400;
const MAX_BATCH_INNER_SIZE_BYTES = MAX_BATCH_SIZE_BYTES - 2; // for the starting and ending byte

export class RaygunBatchTransport {
  private messageQueue: MessageAndCallback[] = [];
  private intervalId: any | null = null;
  private httpOptions: HTTPOptions;
  private interval: number;
  private batchId: number = 0;

  constructor(options: { interval: number; httpOptions: HTTPOptions }) {
    this.interval = options.interval;
    this.httpOptions = options.httpOptions;
  }

  send(message: string, callback: Function) {
    this.messageQueue.push({ serializedMessage: message, callback });
  }

  startProcessing() {
    debug(
      `batch transport - starting message processor (frequency=${this.interval})`
    );
    this.intervalId = setInterval(this.process.bind(this), this.interval);
  }

  stopProcessing() {
    if (this.intervalId) {
      debug("batch transport - stopping");
      clearInterval(this.intervalId);

      this.intervalId = null;
    }
  }

  private process() {
    const batch: string[] = [];
    const callbacks: Function[] = [];
    let batchSizeBytes = 0;

    debug(
      `batch transport - processing (${this.messageQueue.length} message(s) in queue)`
    );

    for (let i = 0; i < MAX_MESSAGES_IN_BATCH; i++) {
      if (this.messageQueue.length === 0) {
        break;
      }

      const { serializedMessage, callback } = this.messageQueue[0];

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

      this.messageQueue.shift();
    }

    if (batch.length === 0) {
      return;
    }

    const batchId = this.batchId;
    this.batchId++;

    const payload = `[${batch.join(",")}]`;
    const runAllCallbacks = <E, R>(err: E, response: R) => {
      const [seconds, nanoseconds] = process.hrtime(startTime);
      const durationInMs = Math.round(seconds * 1000 + nanoseconds / 1e6);
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
        if (callback.length > 1) {
          callback(err, response);
        } else {
          callback(response);
        }
      }
    };

    debug(
      `batch transport - sending batch (id=${batchId}) (${batch.length} messages, ${payload.length} bytes)`
    );

    const startTime = process.hrtime();
    send({
      message: payload,
      callback: runAllCallbacks,
      http: this.httpOptions,
      batch: true,
    });
  }
}
