export function startTimer(): () => number {
  const startTime = process.hrtime();

  return function stopTimer() {
    const [seconds, nanoseconds] = process.hrtime(startTime);
    return Math.round(seconds * 1000 + nanoseconds / 1e6); // in milliseconds
  };
}
