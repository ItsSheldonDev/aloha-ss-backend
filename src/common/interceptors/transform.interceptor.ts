import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { Request, Response } from 'express';

export interface ResponseFormat<T> {
  data: T;
  statusCode: number;
  timestamp: string;
  path: string;
  method: string;
  executionTimeMs?: number;
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, ResponseFormat<T>> {
  private readonly logger = new Logger(TransformInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<ResponseFormat<T>> {
    const req = context.switchToHttp().getRequest<Request>();
    const res = context.switchToHttp().getResponse<Response>();
    const now = Date.now();
    
    return next.handle().pipe(
      tap(() => {
        const executionTime = Date.now() - now;
        
        // Ajouté pour Winston - on laisse le logger standard faire son travail
        // mais on ajoute quelques métadonnées
        this.logger.log({
          message: 'Request processed',
          req: {
            method: req.method,
            url: req.url,
            query: req.query,
            body: req.method !== 'GET' ? req.body : undefined,
          },
          res: {
            statusCode: res.statusCode,
          },
          responseTime: executionTime,
          context: req.url?.split('/')[1] || 'API',
        });
      }),
      map((data) => ({
        data,
        statusCode: res.statusCode,
        timestamp: new Date().toISOString(),
        path: req.url,
        method: req.method,
        executionTimeMs: Date.now() - now,
      })),
    );
  }
}