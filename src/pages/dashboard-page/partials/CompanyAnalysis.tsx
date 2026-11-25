/*
 * Company analysis for management - 23-11-2026 (script ETKT_14), the rest of the
 * prototype management board:
 *   - 5 more tiles (AI solved %, angry clients now, internal SLA breached now,
 *     contracts ended or ending within 30 days, average rating)
 *   - clients compared by weight (tickets / client weight, against the average),
 *     click a client = its branches against the average branch
 *   - by root cause, most repeated problems
 *   - teams: actual load against the load expected from their clients' weights
 *   - branch type weights with the weight suggested by the last year; management
 *     can type a weight or take the suggested one (etk_admin2_pkg/branch_type_dml)
 *
 * GET etk_analytics_pkg/company_analysis_data?from_date&to_date&client_id
 */
import { useCallback, useEffect, useState } from "react";
import { Button, InputNumber, Popconfirm, Select, Spin, Tag, message as antMessage } from "antd";
import type { ColumnType as ColumnProps } from "antd/es/table";
import { Dayjs } from "dayjs";
import { useTheme } from "styled-components";
import { Flex, ShadowSection, SubText } from "../../../components/commons";
import ExsysTable from "../../../components/exsys-table";
import { BarList, DATE_FORMAT, IdxTag, KpiTiles, KpiType, Tone } from "../../../components/stats-bits";
import { useBasicMutation, useBasicQuery } from "../../../hooks";
import { useLabels } from "../../../labels";

interface PayloadType {
  high_ratio?: number;
  low_ratio?: number;
  kpis: KpiType[];
  clients: any[];
  branches: any[];
  by_root_cause: any[];
  top_problems: any[];
  team_load: any[];
  branch_types: any[];
}

const EMPTY: PayloadType = {
  kpis: [],
  clients: [],
  branches: [],
  by_root_cause: [],
  top_problems: [],
  team_load: [],
  branch_types: [],
};

const Title = ({ children }: { children: React.ReactNode }) => (
  <SubText style={{ fontWeight: 600, display: "block", marginBottom: 8, fontSize: 14 }}>{children}</SubText>
);

const dash = (value: any, suffix = "") =>
  value === null || value === undefined || value === "" ? "—" : `${value}${suffix}`;

const CompanyAnalysis = ({ from, to }: { from: Dayjs; to: Dayjs }) => {
  const labels = useLabels();
  const theme = useTheme();
  const [payload, setPayload] = useState<PayloadType>(EMPTY);
  const [clientId, setClientId] = useState<number | undefined>(undefined);
  const [weights, setWeights] = useState<{ [code: string]: number }>({});
  const [allClients, setAllClients] = useState<any[]>([]);

  const { loading, runQuery } = useBasicQuery<PayloadType>({
    apiId: "companyAnalysis",
    onResponse: ({ apiValues, error }) => {
      const next = !error && apiValues ? { ...EMPTY, ...apiValues } : EMPTY;
      setPayload(next);
      if (!clientIdRefSet()) {
        setAllClients(next.clients);
      }
      const w: { [code: string]: number } = {};
      next.branch_types.forEach((row) => (w[row.branch_type_code] = Number(row.weight)));
      setWeights(w);
    },
  });

  // the client list of the select is taken from the answer without a client filter
  const clientIdRefSet = () => clientId !== undefined;

  const fromText = from.format(DATE_FORMAT);
  const toText = to.format(DATE_FORMAT);

  const load = useCallback(
    (nextClient?: number) =>
      runQuery({ from_date: fromText, to_date: toText, client_id: nextClient }),
    [runQuery, fromText, toText],
  );

  useEffect(() => {
    load(clientId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fromText, toText]);

  const { loading: saving, mutate: saveType } = useBasicMutation({ apiId: "branchTypeDml" });

  const onSaveWeight = (row: any, weight: number) =>
    saveType(
      { record_status: "u", branch_type_code: row.branch_type_code, weight },
      ({ error }) => {
        if (error) {
          antMessage.error(error);
          return;
        }
        antMessage.success(labels("saved"));
        load(clientId);
      },
    );

  const tone = (kpi: KpiType): Tone => {
    const v = Number(kpi.value || 0);
    if (kpi.code === "ai_pct") return "good";
    if (kpi.code === "angry_open" || kpi.code === "breach_int_open") return v > 0 ? "crit" : "good";
    if (kpi.code === "contracts_due") return v > 0 ? "warn" : "good";
    return undefined;
  };

  const clientColumns: ColumnProps<any>[] = [
    { title: labels("client"), dataIndex: "client_name", width: 200 },
    { title: labels("branchesWord"), dataIndex: "branch_summary", width: 220 },
    { title: labels("weight"), dataIndex: "weight", width: 80 },
    { title: labels("tickets"), dataIndex: "tickets", width: 80 },
    { title: labels("afterWeight"), dataIndex: "adjusted", width: 100, render: (v) => dash(v) },
    {
      title: labels("vsAverage"),
      dataIndex: "idx",
      width: 220,
      render: (v, row) => <IdxTag value={v} flag={row.idx_flag} />,
    },
    { title: labels("critical"), dataIndex: "critical", width: 80 },
    { title: labels("aiSolvedShort"), dataIndex: "ai_pct", width: 90, render: (v) => dash(v, "%") },
    { title: labels("avgResolve"), dataIndex: "avg_resolve_hours", width: 110, render: (v) => dash(v, ` ${labels("hoursShort")}`) },
    { title: labels("onTimeShort"), dataIndex: "on_time_pct", width: 100, render: (v) => dash(v, "%") },
    { title: labels("rejectedSolution"), dataIndex: "rejected", width: 90 },
    { title: labels("rating"), dataIndex: "avg_rating", width: 80, render: (v) => dash(v) },
  ];

  const branchColumns: ColumnProps<any>[] = [
    { title: labels("branch"), dataIndex: "branch_name" },
    { title: labels("branchType"), dataIndex: "branch_type", width: 150 },
    { title: labels("weight"), dataIndex: "weight", width: 80 },
    { title: labels("tickets"), dataIndex: "tickets", width: 80 },
    { title: labels("afterWeight"), dataIndex: "adjusted", width: 100, render: (v) => dash(v) },
    { title: labels("vsBranchAverage"), dataIndex: "idx", width: 220, render: (v, row) => <IdxTag value={v} flag={row.idx_flag} /> },
    { title: labels("onTimeShort"), dataIndex: "on_time_pct", width: 100, render: (v) => dash(v, "%") },
    { title: labels("rating"), dataIndex: "avg_rating", width: 80, render: (v) => dash(v) },
  ];

  const hi = Number(payload.high_ratio || 1.3);
  const lo = Number(payload.low_ratio || 0.7);

  const teamColumns: ColumnProps<any>[] = [
    { title: labels("team"), dataIndex: "team_name", width: 160 },
    { title: labels("functionName"), dataIndex: "function_name", width: 170 },
    { title: labels("viewOpen"), dataIndex: "open_now", width: 90 },
    { title: labels("periodTickets"), dataIndex: "tickets", width: 100 },
    { title: labels("expectedLoad"), dataIndex: "expected", width: 130, render: (v) => dash(v) },
    {
      title: labels("actualVsExpected"),
      dataIndex: "actual",
      width: 220,
      render: (v, row) => {
        if (row.expected === null || row.expected === undefined || !Number(row.expected)) return "—";
        const ratio = Number(v) / Number(row.expected);
        return <IdxTag kind="team" value={ratio} flag={ratio > hi ? "H" : ratio < lo ? "L" : "N"} />;
      },
    },
    { title: labels("acceptOnTime"), dataIndex: "accept_on_time_pct", width: 120, render: (v) => dash(v, "%") },
    {
      title: labels("escalationsOnTeam"),
      dataIndex: "escalations",
      width: 110,
      render: (v) => (Number(v) > 0 ? <Tag color={theme.colors.error}>{v}</Tag> : v),
    },
  ];

  const typeColumns: ColumnProps<any>[] = [
    { title: labels("branchType"), dataIndex: "name" },
    { title: labels("branchesCount"), dataIndex: "branches", width: 110 },
    {
      title: labels("currentWeight"),
      dataIndex: "weight",
      width: 150,
      render: (v, row) => (
        <InputNumber
          min={0.05}
          step={0.05}
          value={weights[row.branch_type_code]}
          onChange={(value) =>
            setWeights((old) => ({ ...old, [row.branch_type_code]: Number(value) }))
          }
        />
      ),
    },
    { title: labels("suggestedWeight"), dataIndex: "suggested", width: 160, render: (v) => dash(v) },
    {
      title: "",
      dataIndex: "branch_type_code",
      width: 260,
      render: (code, row) => (
        <Flex gap={6}>
          <Button
            size="small"
            type="primary"
            loading={saving}
            disabled={!weights[code] || Number(weights[code]) === Number(row.weight)}
            onClick={() => onSaveWeight(row, weights[code])}
          >
            {labels("save")}
          </Button>
          {row.suggested && Number(row.suggested) !== Number(row.weight) ? (
            <Popconfirm title={labels("useSuggestedConfirm")} onConfirm={() => onSaveWeight(row, Number(row.suggested))}>
              <Button size="small">{labels("useSuggested")}</Button>
            </Popconfirm>
          ) : null}
        </Flex>
      ),
    },
  ];

  const clientName = clientId
    ? (allClients.find((c) => c.client_id === clientId) || {}).client_name
    : undefined;

  return (
    <Spin spinning={loading}>
      <ShadowSection style={{ marginTop: 12 }}>
        <Flex justify="space-between" wrap gap={10} margin="0 0 10px">
          <Title>{labels("companyAnalysis")}</Title>
          <Select
            allowClear
            showSearch
            optionFilterProp="label"
            style={{ width: 260 }}
            placeholder={labels("allClients")}
            value={clientId}
            onChange={(value?: number) => {
              setClientId(value);
              load(value);
            }}
            options={allClients.map((c) => ({ value: c.client_id, label: c.client_name }))}
          />
        </Flex>
        <KpiTiles kpis={payload.kpis} tone={tone} />
      </ShadowSection>

      <ShadowSection style={{ marginTop: 12 }}>
        <Title>{clientName ? `${labels("clientPosition")} ${clientName}` : labels("clientsByWeight")}</Title>
        <ExsysTable
          rowKey="client_id"
          columns={clientColumns}
          dataSource={payload.clients}
          onRowClick={(record) => {
            setClientId(record.client_id);
            load(record.client_id);
          }}
          scrollX={1500}
        />
        <SubText style={{ display: "block", marginTop: 6 }}>{labels("weightNote")}</SubText>
        {clientId && payload.branches.length ? (
          <>
            <Title>{labels("branchesWord")}</Title>
            <ExsysTable rowKey="branch_id" columns={branchColumns} dataSource={payload.branches} scrollX={1000} />
            <SubText style={{ display: "block", marginTop: 6 }}>{labels("branchWeightNote")}</SubText>
          </>
        ) : null}
      </ShadowSection>

      <Flex gap={12} wrap align="stretch" margin="12px 0 0">
        <ShadowSection style={{ flex: 1, minWidth: 300 }}>
          <Title>{labels("byRootCause")}</Title>
          <BarList rows={payload.by_root_cause} />
        </ShadowSection>
        <ShadowSection style={{ flex: 1, minWidth: 300 }}>
          <Title>{labels("topProblems")}</Title>
          <BarList rows={payload.top_problems} color={theme.colors.warningDark} />
        </ShadowSection>
      </Flex>

      <ShadowSection style={{ marginTop: 12 }}>
        <Title>{labels("teamLoadTitle")}</Title>
        <ExsysTable rowKey="team_id" columns={teamColumns} dataSource={payload.team_load} scrollX={1200} />
        <SubText style={{ display: "block", marginTop: 6 }}>{labels("teamLoadNote")}</SubText>
      </ShadowSection>

      <ShadowSection style={{ marginTop: 12 }}>
        <Title>{labels("branchTypeWeights")}</Title>
        <ExsysTable rowKey="branch_type_code" columns={typeColumns} dataSource={payload.branch_types} scrollX={900} />
        <SubText style={{ display: "block", marginTop: 6 }}>{labels("suggestedWeightNote")}</SubText>
      </ShadowSection>
    </Spin>
  );
};

export default CompanyAnalysis;
