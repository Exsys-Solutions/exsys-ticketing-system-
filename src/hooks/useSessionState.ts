/*
 * 24-11-2026 NEW: useSessionState / useSessionRange
 *   OLD    : a screen filter (period, branch, scope) was plain useState, so a
 *            language change (LanguageRemount mounts the screens again) put every
 *            filter back to its default.
 *   NEW    : the filter is kept in sessionStorage under "etkt-f-<key>" and read
 *            back when the screen mounts again.
 *   REASON : review of v2.1.0 (Khaled 23-11-2026).
 *   BENEFIT: the user keeps his filters when he changes the language. The keys
 *            are removed at sign-out (store clearSession), so the next user
 *            starts with the defaults.
 */
import { useEffect, useState } from "react";
import dayjs, { Dayjs } from "dayjs";

export const SESSION_FILTER_PREFIX = "etkt-f-";

const read = <T,>(key: string): T | undefined => {
  try {
    const text = window.sessionStorage.getItem(SESSION_FILTER_PREFIX + key);
    return text === null ? undefined : (JSON.parse(text) as T);
  } catch (error) {
    return undefined;
  }
};

const write = (key: string, value: unknown) => {
  try {
    if (value === undefined) {
      window.sessionStorage.removeItem(SESSION_FILTER_PREFIX + key);
    } else {
      window.sessionStorage.setItem(SESSION_FILTER_PREFIX + key, JSON.stringify(value));
    }
  } catch (error) {
    // storage full or blocked: the filter simply is not kept
  }
};

/* the filters of the signed-out user must not reach the next user */
export const clearSessionFilters = () => {
  try {
    Object.keys(window.sessionStorage)
      .filter((key) => key.indexOf(SESSION_FILTER_PREFIX) === 0)
      .forEach((key) => window.sessionStorage.removeItem(key));
  } catch (error) {
    // nothing to clear
  }
};

export const useSessionState = <T,>(key: string, initial: T | (() => T)) => {
  const [value, setValue] = useState<T>(() => {
    const stored = read<T>(key);
    if (stored !== undefined) {
      return stored;
    }
    return typeof initial === "function" ? (initial as () => T)() : initial;
  });

  useEffect(() => {
    write(key, value);
  }, [key, value]);

  return [value, setValue] as const;
};

/* a date range is kept as two YYYY-MM-DD texts */
export const useSessionRange = (key: string, initial: () => [Dayjs, Dayjs]) => {
  const [text, setText] = useSessionState<[string, string]>(key, () => {
    const r = initial();
    return [r[0].format("YYYY-MM-DD"), r[1].format("YYYY-MM-DD")];
  });
  const range: [Dayjs, Dayjs] = [dayjs(text[0]), dayjs(text[1])];
  const setRange = (next: [Dayjs, Dayjs]) =>
    setText([next[0].format("YYYY-MM-DD"), next[1].format("YYYY-MM-DD")]);
  return [range, setRange] as const;
};
