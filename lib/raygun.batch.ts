import { Message, HTTPOptions } from "./types";
import { send } from './raygun.transport';

export type MessageAndCallback = {
  serializedMessage: string;
  callback: Function;
}

const MAX_MESSAGES_IN_BATCH = 100;
const MAX_BATCH_SIZE_BYTES = 1638400;
const MAX_BATCH_INNER_SIZE_BYTES = MAX_BATCH_SIZE_BYTES - 2; // for the starting and ending byte

export class RaygunBatchTransport {
  private messageQueue: MessageAndCallback[] = [];
  private intervalId: any | null = null;
  private httpOptions: HTTPOptions;
  private interval: number;

  constructor(options: {interval: number, httpOptions: HTTPOptions}) {
    this.interval = options.interval;
    this.httpOptions = options.httpOptions;
  }

  send(message: string, callback: Function) {
    this.messageQueue.push({serializedMessage: message, callback});
  }

  startProcessing() {
    this.intervalId = setInterval(this.process.bind(this), this.interval);
  }

  stopProcessing() {
    if (this.intervalId) {
      clearInterval(this.intervalId);

      this.intervalId = null;
    }
  }

  private process() {
    const batch: string[] = [];
    const callbacks: Function[] = [];
    let batchSizeBytes = 0;

    for(let i = 0; i < MAX_MESSAGES_IN_BATCH; i++) {
      if (this.messageQueue.length === 0) {
        break;
      }

      const {serializedMessage, callback} = this.messageQueue[0];

      if (batchSizeBytes + serializedMessage.length > MAX_BATCH_INNER_SIZE_BYTES) {
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

    if (batch.length === 0) { return; }

    const payload = `[${batch.join(',')}]`;
    const runAllCallbacks = <E, R>(err: E, response: R) => {
      for (let callback of callbacks) {
        if (callback.length > 1) {
          callback(err, response);
        } else {
          callback(response);
        }
      }
    }

    send({
      message: payload,
      callback: runAllCallbacks,
      http: this.httpOptions,
      batch: true
    });
  }
}
