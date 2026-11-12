import type { Problem } from './types';

/** A failed request, shaped like the full project's HTTP problem details (400, 404, 409). */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly problem: Problem,
  ) {
    super(problem.detail ?? problem.title ?? `Request failed with ${status}`);
  }

  get isStale(): boolean {
    return this.status === 409;
  }

  get isNotFound(): boolean {
    return this.status === 404;
  }
}
