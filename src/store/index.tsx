/*
 * App config store.
 *
 * cure-plus-fe keeps the session (authorization, language, current user) in
 * redux and reads it with `useMakeSelectAuthorization` / `useMakeSelectCurrentLanguageId`.
 * This app is one standalone screen set, so the same values live in a React
 * context, but the selector names are kept identical so code moves between the
 * two repos unchanged.
 */
import { clearSessionFilters } from "../hooks/useSessionState";
import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

export interface CurrentUserType {
  user_id: number;
  user_name: string;
  full_name: string;
  email?: string;
  /* S = staff, C = client user */
  user_kind: "S" | "C";
  /* MGT | SUP | AGT | DEV | CLA | CLU */
  role: string;
  management_flag: "Y" | "N";
  kb_approver_flag: "Y" | "N";
  must_change_pwd_flag: "Y" | "N";
  language_id: number;
  team_id?: number;
  team_name?: string;
  function_code?: string;
  client_id?: number;
  client_name?: string;
  env_type?: string;
  branch_id?: number;
  branch_name?: string;
}

interface SessionType {
  authorization: string;
  user?: CurrentUserType;
  languageId: number;
  // 24-11-2026 NEW: true = the user picked a language that is not saved on him yet
  languageChanged?: boolean;
}

const STORAGE_KEY = "etkt-session";

const readStoredSession = (): SessionType => {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw) as SessionType;
    }
  } catch (error) {
    /* a damaged value just means "not signed in" */
  }
  return {
    authorization: "",
    languageId: Number(import.meta.env.REACT_APP_DEFAULT_LANGUAGE_ID || 2),
  };
};

interface AppConfigContextProps extends SessionType {
  setSession: (authorization: string, user: CurrentUserType) => void;
  setUser: (user: CurrentUserType) => void;
  // 24-11-2026: changed = true when the USER picked it (it is then saved on him)
  setLanguageId: (languageId: number, changed?: boolean) => void;
  // 24-11-2026 NEW: the picked language reached the server (saved = it was stored on the user)
  markLanguageSaved: (languageId: number, saved: boolean) => void;
  clearSession: () => void;
}

const AppConfigContext = createContext<AppConfigContextProps>(
  {} as AppConfigContextProps,
);

export const AppConfigProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [session, setSessionState] = useState<SessionType>(readStoredSession);

  const persist = useCallback((next: SessionType) => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    setSessionState(next);
  }, []);

  /*
   * 24-11-2026 CHANGED AGAIN
   *   OLD    : the language of the login page always won, even when the user never
   *            touched it (default Arabic), so his saved language was lost.
   *   NEW    : picked on the login page -> that one (and it is saved on him by
   *            LanguageSelect); not picked -> the language saved on the user.
   *   REASON : Khaled 24-11-2026 - "keep the user's language until he changes it again".
   *   BENEFIT: every login opens in the user's own language.
   *
   * 23-11-2026 CHANGED
   *   OLD    : languageId = user.language_id (the language saved on the user);
   *            a user who chose English on the login page found Arabic inside.
   *   NEW    : the language chosen on the login page is kept; the saved one is
   *            used only when none was chosen (no language in the session).
   *   REASON : Khaled - "logged in in English, found Arabic inside".
   *   BENEFIT: the system opens in the language the user just picked.
   */
  const setSession = useCallback(
    (authorization: string, user: CurrentUserType) =>
      persist({
        authorization,
        user,
        // OLD: languageId: session.languageId || user.language_id || 2
        languageId: session.languageChanged
          ? session.languageId
          : user.language_id || session.languageId || 2,
        languageChanged: !!session.languageChanged,
      }),
    [persist, session.languageId, session.languageChanged],
  );

  const setUser = useCallback(
    (user: CurrentUserType) =>
      setSessionState((previous) => {
        const next = { ...previous, user };
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        return next;
      }),
    [],
  );

  const setLanguageId = useCallback(
    (languageId: number, changed?: boolean) =>
      setSessionState((previous) => {
        // OLD: const next = { ...previous, languageId };
        const next = {
          ...previous,
          languageId,
          languageChanged: changed ? true : previous.languageChanged,
        };
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        return next;
      }),
    [],
  );

  // 24-11-2026 NEW: called by LanguageSelect when the save call came back
  const markLanguageSaved = useCallback(
    (languageId: number, saved: boolean) =>
      setSessionState((previous) => {
        const next = {
          ...previous,
          languageChanged: false,
          user:
            saved && previous.user
              ? { ...previous.user, language_id: languageId }
              : previous.user,
        };
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        return next;
      }),
    [],
  );

  const clearSession = useCallback(() => {
    window.localStorage.removeItem(STORAGE_KEY);
    // 24-11-2026 NEW: the screen filters of this user are not kept for the next user
    clearSessionFilters();
    setSessionState({
      authorization: "",
      languageId: Number(import.meta.env.REACT_APP_DEFAULT_LANGUAGE_ID || 2),
    });
  }, []);

  const value = useMemo(
    () => ({
      ...session,
      setSession,
      setUser,
      setLanguageId,
      markLanguageSaved,
      clearSession,
    }),
    [session, setSession, setUser, setLanguageId, markLanguageSaved, clearSession],
  );

  return (
    <AppConfigContext.Provider value={value}>
      {children}
    </AppConfigContext.Provider>
  );
};

export const useAppConfig = () => useContext(AppConfigContext);
export const useMakeSelectAuthorization = () => useAppConfig().authorization;
export const useMakeSelectCurrentLanguageId = () => useAppConfig().languageId;
export const useMakeSelectCurrentUser = () => useAppConfig().user;

/* the four groups the screens branch on */
export const isStaffUser = (user?: CurrentUserType) => user?.user_kind === "S";
export const isManagement = (user?: CurrentUserType) => user?.role === "MGT";
export const isSupervisor = (user?: CurrentUserType) => user?.role === "SUP";
