export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

export class BadRequestError extends AppError {
  constructor(message = "Hatalı İstek") {
    super(message, 400);
  }
}

export class UnAuthorizedError extends AppError {
  constructor(message = "Yetkisiz Erişim") {
    super(message, 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Yasaklanmış Eylem") {
    super(message, 403);
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Kaynak Bulunamadı") {
    super(message, 404);
  }
}

export class ConflictError extends AppError {
  constructor(message = "Kaynak Zaten Mevcut") {
    super(message, 409);
  }
}
