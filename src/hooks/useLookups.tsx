/*
 * useLookups: every list the screens need in ONE call (lookups_data), fetched
 * once after sign-in and shared through a context, so no screen fires its own
 * lookup requests.
 */
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import useBasicQuery from "./useBasicQuery";
import { useAppConfig } from "../store";

export interface KeyValueType {
  key: string | number;
  value: string;
  [extra: string]: any;
}

export interface LookupsType {
  statuses: KeyValueType[];
  status_next: {
    from_status: string;
    to_status: string;
    client_ticket_only_flag: string;
    actor: string;
  }[];
  status_fields: {
    status_code: string;
    field: string;
    label: string;
    input_type: string;
    client_visible_flag: string;
  }[];
  types: KeyValueType[];
  priorities: KeyValueType[];
  modules: KeyValueType[];
  os: KeyValueType[];
  branches: KeyValueType[];
  teams: KeyValueType[];
  staff: KeyValueType[];
  root_causes: KeyValueType[];
  canned_replies: KeyValueType[];
}

const EMPTY: LookupsType = {
  statuses: [],
  status_next: [],
  status_fields: [],
  types: [],
  priorities: [],
  modules: [],
  os: [],
  branches: [],
  teams: [],
  staff: [],
  root_causes: [],
  canned_replies: [],
};

const LookupsContext = createContext<{
  lookups: LookupsType;
  loading: boolean;
  reload: () => void;
}>({ lookups: EMPTY, loading: false, reload: () => undefined });

export const LookupsProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  // 24-11-2026 OLD: only the authorization  NEW: also the forced password flag and the language
  const { authorization, user, languageId } = useAppConfig();
  const mustChange = user?.must_change_pwd_flag === "Y";
  const [lookups, setLookups] = useState<LookupsType>(EMPTY);

  const { loading, runQuery } = useBasicQuery<Partial<LookupsType>>({
    apiId: "lookups",
    // OLD: callOnFirstRender: !!authorization,
    // NEW: no first-render call; the effect below loads the lists for every new sign-in.
    // REASON: the lists were loaded once only, so after signing out of a staff account and
    //         into a client account the client kept the staff lists (no branches, all modules).
    // BENEFIT: every user always gets his own lists (branch field shows for a client admin).
    callOnFirstRender: false,
    onResponse: ({ apiValues, error }) => {
      if (!error && apiValues) {
        setLookups({ ...EMPTY, ...apiValues });
      }
    },
  });

  // NEW: reload the lists whenever the signed-in user changes; clear them on sign-out
  // 24-11-2026 CHANGED
  //   OLD    : loaded once per sign-in, even before the forced first password change
  //   NEW    : not loaded while the password must change; loaded again when it is changed
  //            and when the user changes the language
  //   REASON : (1) the call failed with -20803 before the change and was never repeated, so a
  //            new user had empty lists (teams, statuses, priorities) until he refreshed the page;
  //            (2) after a language change the lists kept the old language
  //   BENEFIT: the lists are always there and always in the screen language
  useEffect(() => {
    if (!authorization || mustChange) {
      setLookups(EMPTY);
      return;
    }
    runQuery();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authorization, mustChange, languageId]);

  const reload = useCallback(() => {
    runQuery();
  }, [runQuery]);

  return (
    <LookupsContext.Provider value={{ lookups, loading, reload }}>
      {children}
    </LookupsContext.Provider>
  );
};

export const useLookups = () => useContext(LookupsContext);

/* the label of a key inside one of the lists */
export const lookupValue = (
  list: KeyValueType[],
  key?: string | number,
): string => {
  if (key === undefined || key === null) {
    return "";
  }
  const found = list.find((item) => String(item.key) === String(key));
  return found ? found.value : String(key);
};
