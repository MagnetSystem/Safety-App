import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP');

  use(req: Request, _res: Response, next: NextFunction) {
    const { method, originalUrl, query, body } = req;

    this.logger.log(`▶ ${method} ${originalUrl}`);

    if (Object.keys(query).length > 0) {
      this.logger.debug(`  Query  : ${JSON.stringify(query)}`);
    }

    if (body && Object.keys(body).length > 0) {
      // Mask sensitive fields so passwords don't appear in plain text
      const safeBody = { ...body };
      for (const key of ['password', 'newPassword', 'confirmPassword', 'token', 'secret']) {
        if (safeBody[key]) safeBody[key] = '***';
      }
      this.logger.debug(`  Body   : ${JSON.stringify(safeBody)}`);
    }

    next();
  }
}
