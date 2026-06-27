import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

function toSnakeCase(str: string): string {
  return str.replace(/([A-Z])/g, letter => `_${letter.toLowerCase()}`);
}

function transformKeys(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(transformKeys);
  }
  if (value !== null && typeof value === 'object' && !(value instanceof Date)) {
    const result: Record<string, unknown> = {};
    for (const key of Object.keys(value as object)) {
      result[toSnakeCase(key)] = transformKeys((value as Record<string, unknown>)[key]);
    }
    return result;
  }
  return value;
}

@Injectable()
export class SnakeCaseInterceptor implements NestInterceptor {
  intercept(_ctx: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next.handle().pipe(map(transformKeys));
  }
}
