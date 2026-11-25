import React, { useEffect } from "react";
import { BrowserRouter } from "react-router-dom";
import { ConfigProvider, theme as antdTheme } from "antd";
import type { Locale } from "antd/es/locale";
import arEG from "antd/es/locale/ar_EG";
import enUS from "antd/es/locale/en_US";
import frFR from "antd/es/locale/fr_FR";
import urPK from "antd/es/locale/ur_PK";
import esES from "antd/es/locale/es_ES";
import deDE from "antd/es/locale/de_DE";
import itIT from "antd/es/locale/it_IT";
import ptPT from "antd/es/locale/pt_PT";
import trTR from "antd/es/locale/tr_TR";
import kuIQ from "antd/es/locale/ku_IQ";
import { StyleSheetManager } from "styled-components";
import isPropValid from "@emotion/is-prop-valid";
import AppThemeProvider, { useThemeMode } from "./theme";
import { useBasicQuery } from "./hooks";
import { CurrentUserType, useAppConfig } from "./store";
import AppGlobalStyles from "./AppGlobalStyles";
import { AppConfigProvider, useMakeSelectCurrentLanguageId } from "./store";
import { LabelsProvider, useLanguages } from "./labels";
import {
  ContractStatusProvider,
  LookupsProvider,
  RequestRightsProvider,
} from "./hooks";
import AppRoutes from "./routes";

/* antd texts (date picker, "No data", pager ...) in the user's language */
const ANTD_LOCALES: { [code: string]: Locale } = {
  ar: arEG, en: enUS, fr: frFR, ur: urPK, es: esES, de: deDE, it: itIT, pt: ptPT, tr: trTR, ckb: kuIQ,
};

/*
 * The page direction follows the language.
 * 23-11-2026 (React 19 / antd 6):
 *   OLD    : antd v3 had no direction prop, so only <html dir> was set and the
 *            RTL gaps were fixed by hand in AppGlobalStyles.
 *   NEW    : <html dir> stays (for our own styled parts) AND antd gets
 *            ConfigProvider direction + locale + the EXSYS blue + dark mode.
 *   BENEFIT: antd lays itself out in RTL; the hand-made fixes were removed.
 * 23-11-2026 OLD: rtl only for planguageid = 2
 *            NEW: rtl for every right-to-left language of ETK_LANGUAGE (Arabic, Urdu, Kurdish)
 *            REASON: many languages (script ETKT_11)
 */
const DirectionGate = ({ children }: { children: React.ReactNode }) => {
  const languageId = useMakeSelectCurrentLanguageId();
  const { current, isRtl } = useLanguages();

  useEffect(() => {
    document.documentElement.setAttribute("dir", isRtl ? "rtl" : "ltr");
    document.documentElement.setAttribute(
      "lang",
      current ? current.language_code : languageId === 2 ? "ar" : "en",
    );
  }, [languageId, current, isRtl]);

  const { isDark } = useThemeMode();
  const code = current ? current.language_code : languageId === 2 ? "ar" : "en";

  return (
    <ConfigProvider
      direction={isRtl ? "rtl" : "ltr"}
      locale={ANTD_LOCALES[code] || enUS}
      theme={{
        algorithm: isDark ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
        token: {
          colorPrimary: "#006FBB",
          // 24-11-2026 (v2.2.2) NEW: rounder inputs / buttons / dialogs, like Cure+
          borderRadius: 8,
          fontFamily: 'Tahoma, "Segoe UI", -apple-system, sans-serif',
        },
      }}
    >
      {children}
    </ConfigProvider>
  );
};

/*
 * 23-11-2026 (styled-components 6): v6 no longer drops our own props
 * (gap, column, round ...) before they reach the HTML element; this filter
 * does what v5 did, so React does not warn about unknown attributes.
 */
/* our layout props that are also HTML attribute names, never sent to the DOM */
const LAYOUT_PROPS = ["wrap", "column", "gap", "align", "justify", "flex", "round", "margin", "padding"];
const shouldForwardProp = (prop: string, target: unknown) =>
  typeof target === "string" ? isPropValid(prop) && LAYOUT_PROPS.indexOf(prop) < 0 : true;

/*
 * 23-11-2026 NEW: LanguageRemount
 *   OLD    : changing the language changed the screen texts only; the lists
 *            (lookups) and the data already on the page (status, team, module
 *            names) stayed in the old language until the page was reloaded.
 *   NEW    : the providers and the routes below are mounted again with the new
 *            planguageid, so every list and every page asks the server again.
 *   REASON : review of v1.1.0 (23-11-2026).
 *   BENEFIT: one place fixes every screen; no screen needs its own code.
 *   Note   : a form being typed is cleared when the language changes.
 */
const LanguageRemount = ({ children }: { children: React.ReactNode }) => {
  const languageId = useMakeSelectCurrentLanguageId();
  return <React.Fragment key={languageId}>{children}</React.Fragment>;
};

/*
 * 23-11-2026 NEW (review of v2.0.0 live): UserLanguageSync
 *   OLD    : the user's name in the header and footer stayed in the language of
 *            the login (an English login showed "Nagy Tharwat" on the Arabic screens).
 *   NEW    : after a language change (LanguageRemount mounts this again) the user
 *            is read again from etk_security_pkg/me_data in the new language.
 *   BENEFIT: every text on the screen follows the chosen language.
 */
const UserLanguageSync = () => {
  const { authorization, setUser } = useAppConfig();
  useBasicQuery({
    apiId: "me",
    callOnFirstRender: !!authorization,
    onResponse: ({ apiValues, error }) => {
      const next = !error && apiValues ? ((apiValues.data || [])[0] as CurrentUserType) : null;
      if (next) {
        setUser(next);
      }
    },
  });
  return null;
};

const App = () => (
  <StyleSheetManager shouldForwardProp={shouldForwardProp}>
  <AppConfigProvider>
    <AppThemeProvider>
      <AppGlobalStyles />
      {/* 23-11-2026: LabelsProvider now outside DirectionGate - the gate reads the language direction from it */}
      <LabelsProvider>
        <DirectionGate>
          {/* 23-11-2026 NEW: LanguageRemount - see the comment on it above */}
          <LanguageRemount>
          <UserLanguageSync />
          <LookupsProvider>
            <ContractStatusProvider>
              <RequestRightsProvider>
                <BrowserRouter>
                  <AppRoutes />
                </BrowserRouter>
              </RequestRightsProvider>
            </ContractStatusProvider>
          </LookupsProvider>
          </LanguageRemount>
        </DirectionGate>
      </LabelsProvider>
    </AppThemeProvider>
  </AppConfigProvider>
  </StyleSheetManager>
);

export default App;
