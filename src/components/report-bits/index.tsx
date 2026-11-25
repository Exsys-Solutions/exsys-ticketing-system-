/*
 * 24-11-2026 NEW (script ETKT_15): ExportExcelButton
 *   The "Export to Excel" button of the tickets lists. It sends the filters of
 *   the list (not the page offset) to etk_report_pkg/tickets_report with
 *   output X, so the file has EVERY row of the filter, not only the page shown.
 */
import React from "react";
import { Button, Tooltip } from "antd";
import { RecordType } from "../../api";
import useOpenReport from "../../hooks/useOpenReport";
import { useLabels } from "../../labels";
import Icon from "../icon";

export const ExportExcelButton = ({ filters }: { filters: RecordType }) => {
  const labels = useLabels();
  const openReport = useOpenReport();
  return (
    <Tooltip title={labels("rptExportHint")}>
      <Button onClick={() => openReport("ticketsReport", filters, "X")}>
        <Icon type="file-excel" /> {labels("exportExcel")}
      </Button>
    </Tooltip>
  );
};
