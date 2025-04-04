import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    
    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string = 'Erreur serveur interne';
    let error: any = 'Internal Server Error';
    
    // Log l'exception avec le niveau approprié
    const logPayload = {
      method: request.method,
      url: request.url,
      query: request.query,
      body: request.body,
      user: (request as any).user,
      ip: request.ip,
      userAgent: request.headers['user-agent'],
    };

    // Gestion spécifique des erreurs d'authentification
    if (exception instanceof UnauthorizedException) {
      status = exception.getStatus();
      message = "Vous n'êtes pas authentifié ou votre session a expiré";
      error = "Unauthorized";
      
      this.logger.warn(`Accès non autorisé: ${request.method} ${request.url}`, logPayload);
    }
    // Gestion spécifique des erreurs d'autorisation
    else if (exception instanceof ForbiddenException) {
      status = exception.getStatus();
      message = "Vous n'avez pas les droits nécessaires pour accéder à cette ressource";
      error = "Forbidden";
      
      this.logger.warn(`Accès interdit: ${request.method} ${request.url}`, logPayload);
    }
    // Gestion des autres exceptions HTTP standard
    else if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      
      if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        message = (exceptionResponse as any)['message'] || exception.message;
        error = exceptionResponse;
      } else {
        message = exception.message;
        error = exceptionResponse;
      }
      
      // Log les erreurs HTTP
      if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
        this.logger.error(`Exception ${status}: ${message}`, { 
          exception: exception.stack,
          ...logPayload 
        });
      } else if (status >= HttpStatus.BAD_REQUEST) {
        this.logger.warn(`Exception ${status}: ${message}`, logPayload);
      } else {
        this.logger.log(`Exception ${status}: ${message}`, logPayload);
      }
    } 
    // Gestion des erreurs Prisma spécifiques
    else if (exception instanceof PrismaClientKnownRequestError) {
      switch (exception.code) {
        case 'P2002': // Violation de contrainte unique
          status = HttpStatus.CONFLICT;
          message = 'La ressource existe déjà (contrainte unique violée)';
          error = {
            fields: exception.meta?.target,
            code: exception.code,
            message: message
          };
          break;
        case 'P2025': // Enregistrement non trouvé
          status = HttpStatus.NOT_FOUND;
          message = 'Ressource non trouvée';
          error = {
            code: exception.code,
            message: message
          };
          break;
        default:
          error = {
            code: exception.code,
            message: exception.message,
            meta: exception.meta
          };
      }
      
      this.logger.error(`Exception Prisma ${exception.code}: ${message}`, {
        exception: exception.stack,
        ...logPayload
      });
    }
    // Autres types d'erreurs
    else if (exception instanceof Error) {
      message = exception.message;
      
      this.logger.error(`Exception non HTTP: ${message}`, {
        exception: exception.stack,
        ...logPayload
      });
    } else {
      this.logger.error('Exception inconnue', {
        exception,
        ...logPayload
      });
    }

    // Créer une réponse d'erreur structurée
    const errorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message: message,
      error: status !== HttpStatus.INTERNAL_SERVER_ERROR ? error : 'Internal Server Error',
    };

    response.status(status).json(errorResponse);
  }
}