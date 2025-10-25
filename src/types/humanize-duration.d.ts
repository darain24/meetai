declare module 'humanize-duration' {
  interface HumanizeDurationOptions {
    largest?: number;
    round?: boolean;
    units?: string[];
  }
  
  function humanizeDuration(milliseconds: number, options?: HumanizeDurationOptions): string;
  export = humanizeDuration;
}
