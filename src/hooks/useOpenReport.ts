/*
 * 24-11-2026 CHANGED (script ETKT_16)
 *   OLD    : window.open(link) - the link carried ?authorization=<token>
 *   NEW    : a hidden HTML form is posted to a new tab (POST handler of ETKT_16);
 *            the token travels in the form body, never in a link
 *   REASON : a token in a link stays in the browser history and the server logs
 *   BENEFIT: same report, same rights and language, no token in any address
 *
 * 24-11-2026 NEW (script ETKT_15): useOpenReport
 *   Opens a report of etk_report_pkg in a new browser tab:
 *     output H = the page to print (Print button on it), X = the Excel file (download).
 *   The link carries authorization and planguageid like every GET of the app, so
 *   the report has the user's rights and language. Nothing is fetched here.
 */
import { useCallback } from "react";
import { ApiIdType, RecordType } from "../api";
import { buildUrl } from "../api/refetch";
import { useAppConfig } from "../store";

export type ReportOutput = "H" | "X";

const useOpenReport = () => {
  const { authorization, languageId } = useAppConfig();
  return useCallback(
    (apiId: ApiIdType, params: RecordType, output: ReportOutput) => {
      const fields: RecordType = {
        ...params,
        authorization,
        planguageid: languageId,
        output,
      };
      const form = document.createElement("form");
      form.method = "POST";
      form.action = buildUrl(apiId); // the address only, no parameters
      form.target = "_blank";
      form.rel = "noopener";
      form.style.display = "none";
      Object.keys(fields).forEach((name) => {
        const value = fields[name];
        if (value !== undefined && value !== null && value !== "") {
          const input = document.createElement("input");
          input.type = "hidden";
          input.name = name;
          input.value = String(value);
          form.appendChild(input);
        }
      });
      document.body.appendChild(form);
      form.submit();
      document.body.removeChild(form);
    },
    [authorization, languageId],
  );
};

export default useOpenReport;
