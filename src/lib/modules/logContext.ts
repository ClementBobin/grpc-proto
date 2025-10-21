import { AsyncLocalStorage } from 'async_hooks';

interface LogContextData {
  callId?: string;
  methodName?: string;
}

export const logContext = new AsyncLocalStorage<LogContextData>();

export function setLogContext(data: LogContextData): void {
  logContext.enterWith(data);
}

export function getLogContext(): LogContextData | undefined {
  return logContext.getStore();
}

export function getCallId(): string | undefined {
  return logContext.getStore()?.callId;
}

export function getMethodName(): string | undefined {
  return logContext.getStore()?.methodName;
}
