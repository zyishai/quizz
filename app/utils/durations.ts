interface Duration {
  label: string;
  value: number;
}

export const durations: Duration[] = [
  { value: 15, label: "רבע שעה" },
  { value: 30, label: "חצי שעה" },
  { value: 45, label: "45 דקות" },
  { value: 60, label: "שעה" },
  { value: 90, label: "שעה וחצי" },
  { value: 120, label: "שעתיים" },
];
