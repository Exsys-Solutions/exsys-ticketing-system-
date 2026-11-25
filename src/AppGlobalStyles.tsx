import { createGlobalStyle } from "styled-components";

/*
 * The page follows the user's language: Arabic / Urdu are laid out RTL.
 *
 * 23-11-2026 (React 19 / antd 6):
 *   OLD    : colours of modals / inputs and the RTL gaps (button icon, modal
 *            close, modal footer, menu icon) were forced here by hand, because
 *            antd v3 had no RTL and no dark theme.
 *   NEW    : removed - antd 6 does them itself (ConfigProvider direction and
 *            darkAlgorithm in App.tsx). Only the page font and colours stay.
 *   BENEFIT: no fight between our CSS and antd's; fewer surprises.
 */
const AppGlobalStyles = createGlobalStyle`
  body {
    margin: 0;
    font-family: Tahoma, "Segoe UI", -apple-system, sans-serif;
    background: ${({ theme }) => theme.colors.background};
    color: ${({ theme }) => theme.colors.bodyText};
  }
`;

export default AppGlobalStyles;
