/*
 * Language list (23-11-2026, script ETKT_11).
 * The languages are the active rows of ETK_LANGUAGE (same ids as EXSYS.EXSYS01),
 * each one written in its own language, like the language list of Cure+.
 * Used on the login page and in the header.
 */
import React, { useEffect, useRef } from "react";
import { Select, message } from "antd";
import styled from "styled-components";
import { useAppConfig } from "../../store";
import { useLanguages } from "../../labels";
import { useBasicMutation } from "../../hooks";
import Icon from "../icon";

const Wrap = styled.span<{ round?: boolean }>`
  display: inline-flex;
  align-items: center;

  .ant-select-selection {
    border-radius: ${({ round }) => (round ? "18px" : "4px")};
    border-color: ${({ theme }) => theme.colors.desktopNavDivider};
  }
  .language-globe {
    color: ${({ theme }) => theme.colors.primary};
    margin-inline-end: 6px;
  }
`;

interface LanguageSelectProps {
  width?: number;
  round?: boolean;
  size?: "middle" | "small" | "large";
}

const LanguageSelect = ({ width = 140, round, size = "middle" }: LanguageSelectProps) => {
  const { languageId, setLanguageId, authorization, languageChanged, markLanguageSaved } =
    useAppConfig();
  const { languages } = useLanguages();

  // 24-11-2026 NEW    : a language the user picked is saved on him (script ETKT_16).
  //   In the header: at once. On the login page: right after the login, when the
  //   header appears (there is no session before that).
  // REASON : Khaled 24-11-2026 - "keep the language until the user changes it again"
  // BENEFIT: the next login opens in the same language, on any computer
  const { mutate: saveLanguage } = useBasicMutation({
    apiId: "myLanguage",
    flatBody: true,
  });

  const savingRef = useRef(false); // one call at a time

  useEffect(() => {
    if (!authorization || !languageChanged || savingRef.current) {
      return;
    }
    savingRef.current = true;
    const chosen = languageId;
    saveLanguage({ language_id: chosen }).then(({ error }) => {
      if (error) {
        message.error(error);
      }
      // cleared also on error: one try per change, never a loop of calls
      savingRef.current = false;
      markLanguageSaved(chosen, !error);
    });
  }, [authorization, languageChanged, languageId, saveLanguage, markLanguageSaved]);

  return (
    <Wrap round={round}>
      <Select
        size={size}
        value={languageId}
        style={{ width }}
        // OLD: setLanguageId(Number(value))  NEW: true = picked by the user, so it is saved
        onChange={(value: number) => setLanguageId(Number(value), true)}
        popupMatchSelectWidth={false}
      >
        {languages.map((item) => (
          <Select.Option key={item.language_id} value={item.language_id}>
            <Icon type="global" className="language-globe" />
            <span dir={item.direction}>{item.native_name}</span>
          </Select.Option>
        ))}
      </Select>
    </Wrap>
  );
};

export default LanguageSelect;
