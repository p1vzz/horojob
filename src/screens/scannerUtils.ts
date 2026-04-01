import { ApiError } from '../services/authSession';
import { parseScannerApiError, type ScannerErrorState } from './scannerUtilsCore';

export * from './scannerUtilsCore';

export function parseApiError(error: unknown): ScannerErrorState {
  return parseScannerApiError(
    error,
    (value): value is { status: number; payload: unknown } => value instanceof ApiError
  );
}
