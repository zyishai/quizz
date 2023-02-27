export type OmitDeep<T, K extends string> = K extends `${infer Top}.${infer Rest}` ? Top extends keyof T ? { [P in Top]: OmitDeep<T[Top], Rest>} & Omit<T, Top> : Omit<T, Top> : Omit<T, K>;
export type Replace<T, K extends keyof T, V> = Omit<T, K> & (Pick<T, K> extends Required<Pick<T, K>> ? { [P in K]: V } : { [P in K]?: V });
export type IsPropertyRequired<T extends Object, K extends keyof T> = Pick<T, K> extends Required<Pick<T, K>> ? true : false;
export type InclusiveRange<N1 extends number, N2 extends number, I extends any[] = []> = `${N1}` extends `-${infer _}`
  ? never
  : `${N2}` extends `-${infer _}`
    ? never
    : N1 extends I['length']
      ? N1 | InclusiveRange<N1, N2, [1, ...I]>
      : N2 extends I['length']
        ? N2
        : 1 extends I[0]
          ? I['length'] | InclusiveRange<N1, N2, [1, ...I]> // we're in range, print I[length] and continue
          : InclusiveRange<N1, N2, [0, ...I]>; // we're not in range continue

export type EntityBase = {
  id: string;
  createdAt: DateTimeString;
  lastUpdatedAt?: DateTimeString;
}
export type DatabaseResponse<T extends Record<string, unknown>, K extends keyof T = keyof T> = {
  [P in K as true extends IsPropertyRequired<T, P> ? P : never]: T[P] extends Date
    ? string
    : T[P] extends Date[]
      ? string[]
      : T[P] extends Record<string, unknown>
        ? DatabaseResponse<T[P]>
        : T[P];
} & {
  [P in K as true extends IsPropertyRequired<T, P> ? never : P]?: T[P] extends Date | any
  ? string
  : T[P] extends Date[]
    ? string[]
    : T[P] extends Record<string, unknown>
      ? DatabaseResponse<T[P]>
      : T[P];
};
export type DateTimeString = string;
