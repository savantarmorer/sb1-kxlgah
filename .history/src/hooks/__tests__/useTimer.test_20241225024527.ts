import { renderHook, act } from '@testing-library/react-hooks';
import { useTimer } from '../useTimer';

describe('useTimer Hook', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  it('initializes timer with correct duration', () => {
    const { result } = renderHook(() => useTimer(30));
    expect(result.current.timeLeft).toBe(30);
  });

  it('starts countdown when started', () => {
    const { result } = renderHook(() => useTimer(30));

    act(() => {
      result.current.startTimer();
    });

    // Advance timers and update state
    act(() => {
      jest.advanceTimersByTime(1000);
      jest.runOnlyPendingTimers();
    });

    expect(result.current.timeLeft).toBe(29);
  });

  it('pauses countdown when paused', () => {
    const { result } = renderHook(() => useTimer(30));

    act(() => {
      result.current.startTimer();
      jest.advanceTimersByTime(1000);
      jest.runOnlyPendingTimers();
      result.current.pauseTimer();
      jest.advanceTimersByTime(1000);
      jest.runOnlyPendingTimers();
    });

    expect(result.current.timeLeft).toBe(29);
  });

  it('resets timer to initial duration', () => {
    const { result } = renderHook(() => useTimer(30));

    act(() => {
      result.current.startTimer();
      jest.advanceTimersByTime(5000);
      jest.runOnlyPendingTimers();
      result.current.resetTimer();
    });

    expect(result.current.timeLeft).toBe(30);
  });

  it('calls onComplete when time runs out', () => {
    const onComplete = jest.fn();
    const { result } = renderHook(() => useTimer(3, onComplete));

    act(() => {
      result.current.startTimer();
      jest.advanceTimersByTime(3000);
      jest.runOnlyPendingTimers();
    });

    expect(onComplete).toHaveBeenCalled();
    expect(result.current.timeLeft).toBe(0);
  });

  it('updates duration when changed', () => {
    const { result, rerender } = renderHook(
      ({ duration }) => useTimer(duration),
      { initialProps: { duration: 30 } }
    );

    expect(result.current.timeLeft).toBe(30);

    rerender({ duration: 20 });

    expect(result.current.timeLeft).toBe(20);
  });

  it('calculates time bonus correctly', () => {
    const { result } = renderHook(() => useTimer(30));

    act(() => {
      result.current.startTimer();
      jest.advanceTimersByTime(10000);
      jest.runOnlyPendingTimers();
    });

    expect(result.current.getTimeBonus()).toBe(20); // 20 seconds left
  });

  it('handles cleanup on unmount', () => {
    const { result, unmount } = renderHook(() => useTimer(30));

    act(() => {
      result.current.startTimer();
    });

    unmount();

    act(() => {
      jest.advanceTimersByTime(1000);
      jest.runOnlyPendingTimers();
    });

    // Timer should be cleaned up, no errors should occur
  });
}); 