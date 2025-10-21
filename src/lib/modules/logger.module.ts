/* eslint-disable no-unused-vars */
import winston from 'winston';
import { v4 as uuidv4 } from 'uuid';
import DailyRotateFile from 'winston-daily-rotate-file';
import { loadServerConfig } from '../config';
import type { StatusObject } from '@grpc/grpc-js';
import { getCallId, getMethodName } from '../logContext';

// ==== Custom Colors and Levels ====
const customColors = {
  trace: 'blue',
  debug: 'cyan',
  info: 'green',
  warn: 'yellow',
  error: 'magenta',
  crit: 'black',
  fatal: 'red'
};

const logLevels = {
  trace: 6,
  debug: 5,
  info: 4,
  warn: 3,
  error: 2,
  crit: 1,
  fatal: 0
} as const;

// ==== Load Config ====
const logConfig = loadServerConfig();

const logger = winston.createLogger({ levels: logLevels });
const logFileEnabled = logConfig.logFileEnabled ?? false;
const logLevel = logConfig.logLevel ?? 'info';
const logDirectory = logConfig.logDirectory ?? './logs';
const storageDateFormat = logConfig.storageDateFormat ?? 'YYYY-MM-DD';
const keepLogsFor = logConfig.keepLogsFor ?? 90;
const dateFormat = logConfig.dateFormat ?? 'YYYY-MM-DD HH:mm:ss';
const unixFormat = logConfig.unixFormat ?? false;
const nodeEnv = logConfig.nodeEnv ?? 'development';

// ==== Console Transport ====
logger.add(new winston.transports.Console({
  level: logLevel,
  format: winston.format.combine(
    winston.format.colorize(),
    winston.format.timestamp({ format: dateFormat }),
    winston.format.printf(({ timestamp, level, message }) => {
      const callId = getCallId();
      const methodName = getMethodName();
      const context = callId ? `[${methodName || 'unknown'} | CallID:${callId}] ` : '';
      const unixTime = unixFormat ? ` ${Math.floor(new Date(timestamp as string).getTime() / 1000)}` : '';
      return `[${timestamp}${unixTime}] ${level}: ${context}${message}`;
    })
  ),
}));

// ==== File Rotation Transport ====
if (logFileEnabled && logConfig.nodeEnv !== 'production') {
  logger.add(new DailyRotateFile({
    level: logLevel,
    dirname: logDirectory,
    filename: '%DATE%.log',
    datePattern: storageDateFormat,
    zippedArchive: true,
    maxFiles: `${keepLogsFor}`,
    format: winston.format.combine(
      winston.format.timestamp({ format: dateFormat }),
      winston.format.printf(({ timestamp, level, message }) => {
        const callId = getCallId();
        const methodName = getMethodName();
        const context = callId ? `[${methodName || 'unknown'} | CallID:${callId}] ` : '';
        const unixTime = unixFormat ? ` ${Math.floor(new Date(timestamp as string).getTime() / 1000)}` : '';
        return `[${timestamp}${unixTime}] ${level}: ${context}${message}`;
      })
    ),
  }));
}

winston.addColors(customColors);

// ==== Extend Winston Interface ====
declare module 'winston' {
  interface Logger {
    logWithErrorHandling(msg: any, error: any, hasSecret?: boolean, level?: string): void;
    trackOperationTime<T>(operation: Promise<T>, operationName: string): Promise<T>;
    grpcCallStart(call: any, methodName: string): string;
    grpcCallEnd(status: StatusObject, durationInMs: number): void;
  }
}

// ==== gRPC-specific Start/End Methods ====

// Logs the beginning of a gRPC call with metadata
logger.grpcCallStart = function (call: any, methodName: string): string {
  const callId = uuidv4();
  (call as any).callId = callId;

  const metadata = call.metadata?.getMap ? call.metadata.getMap() : {};
  const client = call.getPeer?.() || 'unknown-client';
  const requestData = call.request ? JSON.stringify(call.request) : '{}';

  logger.info(`🛰️  gRPC CALL START [${methodName}] - Call ID: ${callId}, Client: ${client}, Metadata: ${JSON.stringify(metadata)}, Request: ${requestData}`);

  return callId;
};

// Logs the end of a gRPC call with duration and status
logger.grpcCallEnd = function (status: StatusObject, durationInMs: number): void {
  const code = status.code;
  const details = status.details || 'OK';
  const trailers = (status.metadata && status.metadata.getMap) ? status.metadata.getMap() : {};

  logger.info(`✅ gRPC CALL END, Status: ${code} (${details}), Duration: ${durationInMs}ms, Trailers: ${JSON.stringify(trailers)}`);
};

// ==== Error Handler ====
logger.logWithErrorHandling = function (msg: any, error: any, hasSecret = false, level = 'error'): void {
  if (hasSecret && nodeEnv !== 'development') return;

  if (error instanceof Error) {
    this.log(level, `${msg}: ${error.stack}`);
  } else {
    this.log(level, `${msg}: ${JSON.stringify(error)}`);
  }
};

// ==== Operation Time Tracker ====
logger.trackOperationTime = async function <T>(operation: Promise<T>, operationName: string): Promise<T> {
  const start = process.hrtime();
  const stack = new Error().stack || '';
  const stackLines = stack.split('\n');
  const callerLine = stackLines[2] || '';
  const match = callerLine.match(/at\s+([^(]+)\s+\(([^:]+):(\d+):(\d+)\)/);
  const functionName = match ? match[1] : 'unknownFunction';
  const fileName = match ? match[2] : 'unknownFile';

  const result = await operation;
  const end = process.hrtime();
  const durationInMs = (end[0] * 1e9 + end[1] - (start[0] * 1e9 + start[1])) / 1e6;

  logger.info(`${operationName} took ${durationInMs}ms, called from ${functionName} in ${fileName}`);
  return result;
};

export default logger;
