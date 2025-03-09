import { Module } from '@nestjs/common';
import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';

@Module({
  imports: [
    WinstonModule.forRoot({
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.colorize(),
            winston.format.printf(({ level, message, timestamp, context }) => {
              let emoji = '🔹';
              if (level.includes('error')) emoji = '❌';
              else if (level.includes('warn')) emoji = '⚠️';
              else if (level.includes('info')) emoji = 'ℹ️';
              else if (level.includes('debug')) emoji = '🐛';
              
              const ctx = context ? `[${context}]` : '';
              
              let enhancedMessage = message;
              if (typeof message === 'string') {
                if (message.includes('Starting')) enhancedMessage = `🚀 ${message}`;
                else if (message.includes('initialized')) enhancedMessage = `🔄 ${message}`;
                else if (message.includes('Mapped')) enhancedMessage = `🔗 ${message}`;
                else if (message.includes('database')) enhancedMessage = `🗃️  ${message}`;
                else if (message.includes('started')) enhancedMessage = `✅ ${message}`;
              }
              
              return `${timestamp} ${level}: ${emoji} ${enhancedMessage} ${ctx}`;
            })
          ),
          handleExceptions: true,
        }),
      ],
    }),
  ],
  exports: [WinstonModule],
})
export class LoggerModule {}