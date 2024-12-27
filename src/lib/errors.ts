export class TournamentError extends Error {
  code?: string;
  details?: Record<string, any>;

  constructor(
    message: string,
    code?: string,
    details?: Record<string, any>
  ) {
    super(message);
    this.name = 'TournamentError';
    this.code = code;
    this.details = details;

    // Ensure proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, TournamentError.prototype);
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      details: this.details
    };
  }
}

export class RateLimitError extends TournamentError {
  constructor(reset_in: number) {
    super(
      'Rate limit exceeded',
      'RATE_LIMITED',
      { reset_in }
    );
    this.name = 'RateLimitError';
    Object.setPrototypeOf(this, RateLimitError.prototype);
  }
}

export class MatchError extends TournamentError {
  constructor(message: string, code?: string) {
    super(message, code);
    this.name = 'MatchError';
    Object.setPrototypeOf(this, MatchError.prototype);
  }
}

export class AuthorizationError extends TournamentError {
  constructor(message: string) {
    super(message, 'UNAUTHORIZED');
    this.name = 'AuthorizationError';
    Object.setPrototypeOf(this, AuthorizationError.prototype);
  }
}

export class ValidationError extends TournamentError {
  constructor(message: string, details?: Record<string, any>) {
    super(message, 'VALIDATION_ERROR', details);
    this.name = 'ValidationError';
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
} 