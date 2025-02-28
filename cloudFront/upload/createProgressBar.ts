import { SingleBar } from "cli-progress";

export function createProgressBar(
  description: string,
  total: number,
): SingleBar {
  const noTTYOptions = process.env.AWS_EXECUTION_ENV
    ? { noTTYOutput: true, notTTYSchedule: 30_000 }
    : {};
  const bar = new SingleBar({
    format: `⏳ {value}/{total} ${description} | [{bar}] {percentage}% {duration_formatted} | ETA: {eta_formatted} | {currentItem}`,
    barCompleteChar: "=",
    barIncompleteChar: "-",
    hideCursor: true,
    stopOnComplete: true,
    ...noTTYOptions,
  });
  bar.start(total, 0, { currentItem: "" });
  return bar;
}
