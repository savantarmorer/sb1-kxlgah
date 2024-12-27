/**
 * Circuit Breaker System
 * =====================
 * 
 * Think of this like a safety switch in your home's electrical system. Just as a circuit breaker
 * in your house cuts off electricity when there's a problem to prevent damage, this system
 * protects our application from continuing to try operations that are failing.
 * 
 * Real World Analogy:
 * ------------------
 * Imagine you're trying to enter a password on your phone. If you get it wrong too many times,
 * the phone locks you out for a while before letting you try again. This prevents both
 * accidental and malicious repeated attempts.
 * 
 * How It Works:
 * ------------
 * 1. Normal State ("CLOSED"):
 *    - Everything works normally
 *    - We keep track of any failures that happen
 * 
 * 2. Protection Mode ("OPEN"):
 *    - Activated after too many failures (default: 5 failures)
 *    - Stops all attempts for a cooling period (default: 1 minute)
 *    - Like a timeout when you've tried your password too many times
 * 
 * 3. Testing Mode ("HALF_OPEN"):
 *    - After the timeout, we carefully allow one attempt
 *    - If it works, we go back to normal
 *    - If it fails, we go back to protection mode
 * 
 * When to Use:
 * -----------
 * - Making network calls that might fail
 * - Accessing external services that might be down
 * - Protecting against cascading failures in the system
 * 
 * Benefits:
 * --------
 * 1. Prevents Overload: Stops repeated failing attempts that waste resources
 * 2. Self-Healing: Automatically recovers after a cooling-off period
 * 3. System Protection: Prevents one problem from affecting the whole system
 */

import { Logger, LogLevel } from './logger';

/**
 * CircuitBreaker Class
 * -------------------
 * This is like a smart guard that watches over our system operations.
 * It keeps track of failures and decides when to stop attempts and when to allow them again.
 */
export class CircuitBreaker {
  // Keeps count of how many times something has failed
  private failures = 0;
  
  // Remembers when the last failure happened
  private last_failure_timestamp: number | null = null;
  
  // Current state of the circuit breaker (like a traffic light system)
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';

  /**
   * Setup the Circuit Breaker
   * ------------------------
   * @param MAX_FAILURES - How many failures before we stop trying (default: 5)
   * @param RESET_TIMEOUT - How long to wait before trying again (default: 1 minute)
   * @param COOLDOWN_PERIOD - Short pause between retries (default: 30 seconds)
   */
  constructor(
    private readonly MAX_FAILURES = 5,
    private readonly RESET_TIMEOUT = 60000,     // 1 minute
    private readonly COOLDOWN_PERIOD = 30000    // 30 seconds
  ) {}

  /**
   * Check if an operation should be allowed
   * -------------------------------------
   * Like asking "Is it safe to try this operation?"
   * 
   * Returns:
   * - true: Yes, go ahead and try
   * - false: No, wait a bit before trying again
   */
  is_allowed(): boolean {
    const now = Date.now();

    switch (this.state) {
      case 'CLOSED':  // Normal operation
        return this.failures < this.MAX_FAILURES;
      
      case 'OPEN':    // In protection mode
        if (now - (this.last_failure_timestamp || 0) > this.RESET_TIMEOUT) {
          this.state = 'HALF_OPEN';  // Try again carefully
          return true;
        }
        return false;
      
      case 'HALF_OPEN':  // Testing if it's safe to resume
        return true;
      
      default:
        return true;
    }
  }

  /**
   * Record when something goes wrong
   * ------------------------------
   * Keeps track of failures and decides if we need to enter protection mode
   * 
   * @param context - Where the failure happened
   * @param error - What went wrong
   */
  record_failure(context: string, error: Error) {
    this.failures++;
    this.last_failure_timestamp = Date.now();

    if (this.failures >= this.MAX_FAILURES) {
      this.state = 'OPEN';  // Enter protection mode
      
      // Write down what happened in our system log
      Logger.log({
        timestamp: new Date().toISOString(),
        level: LogLevel.ERROR,
        context: 'CircuitBreaker',
        message: 'Circuit breaker opened due to multiple failures',
        metadata: {
          failure_count: this.failures,
          error: error.message
        },
        errorStack: error.stack
      });
    }
  }

  /**
   * Reset everything back to normal
   * -----------------------------
   * Like pressing the reset button on your circuit breaker at home
   */
  reset_state() {
    this.failures = 0;
    this.last_failure_timestamp = null;
    this.state = 'CLOSED';
  }

  /**
   * Check the current state
   * ----------------------
   * Like checking if the system is running normally,
   * in protection mode, or testing mode
   */
  get_state(): string {
    return this.state;
  }
}
