import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Request, Response } from 'express';

/**
 * Turns the common Prisma "known request" errors into clean HTTP responses
 * instead of letting them fall through to a generic 500. Anything not mapped
 * here is re-thrown so the AllExceptionsFilter can log + 500 it.
 */
@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('Prisma');

  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Database error';

    switch (exception.code) {
      case 'P2002': {
        status = HttpStatus.CONFLICT;
        const target = (exception.meta?.target as string[] | string | undefined) ?? 'field';
        const field = Array.isArray(target) ? target.join(', ') : target;
        message = `A record with this ${field} already exists`;
        break;
      }
      case 'P2025':
        status = HttpStatus.NOT_FOUND;
        message = (exception.meta?.cause as string | undefined) ?? 'Record not found';
        break;
      case 'P2003':
        status = HttpStatus.BAD_REQUEST;
        message = 'Related record does not exist';
        break;
      case 'P2014':
        status = HttpStatus.BAD_REQUEST;
        message = 'This change would violate a required relation';
        break;
      default:
        this.logger.error(`Unmapped Prisma error ${exception.code}: ${exception.message}`);
        break;
    }

    response.status(status).json({
      statusCode: status,
      path: request.url,
      timestamp: new Date().toISOString(),
      message,
    });
  }
}
