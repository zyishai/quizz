import { ErrorType } from "~/types/errors";

type AppErrorProps = {
  message?: string;
  errType?: ErrorType;
  
}
export class AppError extends Error {
  public readonly originalName;

  constructor({ message, errType = ErrorType.Other }: AppErrorProps) {
    super(message);
    this.originalName = this.name;
    this.name = errType;
  }
}

export function isAppError(error: any): error is AppError {
  return error instanceof AppError;
}
