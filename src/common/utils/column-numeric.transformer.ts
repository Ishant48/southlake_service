import { ValueTransformer } from 'typeorm';

/**
 * Postgres NUMERIC/DECIMAL columns come back from the driver as strings
 * (to avoid float precision loss). This transformer round-trips them as
 * JS numbers on read, unchanged on write.
 */
export class ColumnNumericTransformer implements ValueTransformer {
  to(data: number | null): number | null {
    return data;
  }
  from(data: string | null): number | null {
    return data ? parseFloat(data) : null;
  }
}
