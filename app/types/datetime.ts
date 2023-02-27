export interface TimeComponents {
  hour: number;
  minute: number;
}
export interface TimeRange {
  start: TimeComponents;
  end: TimeComponents;
}
export interface DateRange {
  start: string;
  end: string;
}
export enum OffsetUnit {
  MILLISECOND = 'milliseconds',
  SECOND = 'seconds',
  MINUTE = 'minutes',
  HOUR = 'hours',
  DAY = 'days',
  WEEK = 'weeks'
}
