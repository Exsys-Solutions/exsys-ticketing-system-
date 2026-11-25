/*
 * Client statistics - 23-11-2026 (script ETKT_14).
 *
 * GET etk_analytics_pkg/client_dashboard_data?from_date&to_date&branch_id&scope=org|mine
 *
 * What the client manager asked to see about his own organisation (the prototype
 * "cl-dash"): 9 tiles, sent / solved per day-week-month, by status / module /
 * type / branch / sender, and the two lists that need him: waiting for your
 * reply and late. The server decides the branch: a one-branch user always gets
 * his branch, whatever is sent.
 */
import { useCallback, useState } from "react";
import { Radio, Select, Spin } from "antd";
import type { ColumnType as ColumnProps } from "antd/es/table";
import { Dayjs } from "dayjs";
import { useNavigate } from "react-router-dom";
import { useTheme } from "styled-components";
import { Bar } from "react-chartjs-2";
import { ChartBox } from "../../dashboard-page/partials/ChartsView";
import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Tooltip,
} from "chart.js";
import { Flex, PageTitle, ShadowSection, SubText } from "../../../components/commons";
import ExsysTable from "../../../components/exsys-table";
import {
  BarList,
  DATE_FORMAT,
  KpiTiles,
  KpiType,
  PeriodBar,
  periodRange,
  Tone,
} from "../../../components/stats-bits";
import { useBasicQuery, useLookups } from "../../../hooks";
import { useSessionRange, useSessionState } from "../../../hooks/useSessionState";
import { useLabels, useLanguages } from "../../../labels";
import { ticketPath } from "../../../routes/constants";

ChartJS.register(BarElement, CategoryScale, Legend, LinearScale, Tooltip);

interface PayloadType {
  client_name?: string;
  branch_name?: string;
  all_branches?: string;
  kpis: KpiType[];
  trend: { label: string; sent: number; solved: number }[];
  by_status: any[];
  by_module: any[];
  by_type: any[];
  by_branch: any[];
  by_sender: any[];
  waiting: any[];
  stuck: any[];
}

const EMPTY: PayloadType = {
  kpis: [],
  trend: [],
  by_status: [],
  by_module: [],
  by_type: [],
  by_branch: [],
  by_sender: [],
  waiting: [],
  stuck: [],
};

const ClientDashboardPage = () => {
  const labels = useLabels();
  const theme = useTheme();
  const navigate = useNavigate();
  const { lookups } = useLookups();
  // the oldest bucket sits at the start of the reading direction (right in Arabic)
  const { isRtl } = useLanguages();
  const [payload, setPayload] = useState<PayloadType>(EMPTY);
  // 24-11-2026 OLD: useState("m") / useState(periodRange("m")) / useState("org") / useState(undefined)
  // NEW: kept in sessionStorage. REASON: a language change put the filters back to the default.
  // BENEFIT: the user keeps period, range, scope and branch when he changes the language.
  const [period, setPeriod] = useSessionState<string>("cdash-period", "m");
  const [range, setRange] = useSessionRange("cdash-range", () => periodRange("m"));
  const [scope, setScope] = useSessionState<string>("cdash-scope", "org");
  const [branchId, setBranchId] = useSessionState<number | undefined>("cdash-branch", undefined);

  const { loading, runQuery } = useBasicQuery<PayloadType>({
    apiId: "clientDashboard",
    // 24-11-2026 OLD: scope "org" and the last month; NEW: the kept filters
    params: {
      scope,
      from_date: range[0].format(DATE_FORMAT),
      to_date: range[1].format(DATE_FORMAT),
      branch_id: branchId,
    },
    callOnFirstRender: true,
    onResponse: ({ apiValues, error }) =>
      setPayload(!error && apiValues ? { ...EMPTY, ...apiValues } : EMPTY),
  });

  const load = useCallback(
    (next: { range?: [Dayjs, Dayjs]; scope?: string; branchId?: number | null }) => {
      const r = next.range || range;
      const b = next.branchId === null ? undefined : next.branchId ?? branchId;
      runQuery({
        from_date: r[0].format(DATE_FORMAT),
        to_date: r[1].format(DATE_FORMAT),
        scope: next.scope || scope,
        branch_id: b,
      });
    },
    [runQuery, range, scope, branchId],
  );

  const tone = (kpi: KpiType): Tone => {
    const v = Number(kpi.value || 0);
    switch (kpi.code) {
      case "solved":
      case "ai_solved":
        return "good";
      case "stuck":
        return v > 0 ? "crit" : "good";
      case "waiting_you":
        return v > 0 ? "warn" : "good";
      case "on_time_pct":
        return kpi.value === null ? undefined : v < 80 ? "warn" : "good";
      default:
        return undefined;
    }
  };

  const listColumns: ColumnProps<any>[] = [
    { title: labels("ticketNo"), dataIndex: "ticket_id", width: 80 },
    {
      title: labels("title"),
      dataIndex: "title",
      render: (value: string, record: any) => (
        <>
          <div>{value}</div>
          <SubText>{record.module_name}</SubText>
        </>
      ),
    },
    { title: labels("status"), dataIndex: "status_name", width: 120 },
    { title: labels("submittedDate"), dataIndex: "submitted_date", width: 140 },
  ];

  const place = payload.branch_name || payload.client_name || "";
  const allBranches = payload.all_branches === "Y";

  const card = (title: string, rows: any[]) => (
    <ShadowSection style={{ flex: 1, minWidth: 280 }}>
      <SubText style={{ fontWeight: 600, display: "block", marginBottom: 8 }}>{title}</SubText>
      <BarList rows={rows} />
    </ShadowSection>
  );

  return (
    <Spin spinning={loading}>
      <Flex justify="space-between" wrap gap={10} margin="0 0 12px">
        <PageTitle>
          {labels("clientStatsTitle")} {place}
        </PageTitle>
        <Flex gap={10} wrap>
          {allBranches ? (
            <Select
              allowClear
              style={{ width: 230 }}
              placeholder={labels("allBranches")}
              value={branchId}
              onChange={(value?: number) => {
                setBranchId(value);
                load({ branchId: value ?? null });
              }}
              options={lookups.branches.map((b) => ({ value: Number(b.key), label: b.value }))}
            />
          ) : null}
          <Radio.Group
            value={scope}
            buttonStyle="solid"
            onChange={(event) => {
              setScope(event.target.value);
              load({ scope: event.target.value });
            }}
          >
            <Radio.Button value="org">{labels("scopeOrg")}</Radio.Button>
            <Radio.Button value="mine">{labels("scopeMine")}</Radio.Button>
          </Radio.Group>
        </Flex>
      </Flex>

      <ShadowSection style={{ marginBottom: 12 }}>
        <PeriodBar
          period={period}
          range={range}
          onChange={(key, next) => {
            setPeriod(key);
            setRange(next);
            load({ range: next });
          }}
        />
      </ShadowSection>

      <KpiTiles kpis={payload.kpis} tone={tone} />

      <ShadowSection style={{ marginTop: 12 }}>
        <SubText style={{ fontWeight: 600 }}>{labels("sentSolvedTrend")}</SubText>
        {/* 24-11-2026 OLD: <div style={{ height: 260 }}>  NEW: ChartBox (see dashboard ChartsView) */}
        <ChartBox height={260}>
          <Bar
            data={{
              labels: payload.trend.map((row) => row.label),
              datasets: [
                {
                  label: labels("kpi_sent"),
                  data: payload.trend.map((row) => row.sent),
                  backgroundColor: theme.colors.primary,
                },
                {
                  label: labels("kpi_solved"),
                  data: payload.trend.map((row) => row.solved),
                  backgroundColor: theme.colors.success,
                },
              ],
            }}
            options={{
              maintainAspectRatio: false,
              plugins: { legend: { position: "top" } },
              scales: {
                x: { reverse: isRtl },
                y: { beginAtZero: true, ticks: { precision: 0 }, position: isRtl ? "right" : "left" },
              },
            }}
          />
        </ChartBox>
      </ShadowSection>

      <Flex gap={12} wrap align="stretch" margin="12px 0 0">
        {card(labels("byStatus"), payload.by_status)}
        {card(labels("byModule"), payload.by_module)}
        {card(labels("byType"), payload.by_type)}
        {payload.by_branch.length ? card(labels("byBranch"), payload.by_branch) : null}
        {payload.by_sender.length ? card(labels("bySender"), payload.by_sender) : null}
      </Flex>

      <Flex gap={12} wrap align="stretch" margin="12px 0 0">
        <ShadowSection style={{ flex: 1, minWidth: 340 }}>
          <SubText style={{ fontWeight: 600 }}>{labels("waitingYou")}</SubText>
          <ExsysTable
            rowKey="ticket_id"
            columns={listColumns}
            dataSource={payload.waiting}
            onRowClick={(record) => navigate(ticketPath(record.ticket_id, true))}
          />
        </ShadowSection>
        <ShadowSection style={{ flex: 1, minWidth: 340 }}>
          <SubText style={{ fontWeight: 600 }}>{labels("stuckLate")}</SubText>
          <ExsysTable
            rowKey="ticket_id"
            columns={listColumns}
            dataSource={payload.stuck}
            onRowClick={(record) => navigate(ticketPath(record.ticket_id, true))}
          />
        </ShadowSection>
      </Flex>

      <SubText style={{ display: "block", marginTop: 10 }}>{labels("clientStatsNote")}</SubText>
    </Spin>
  );
};

export default ClientDashboardPage;
