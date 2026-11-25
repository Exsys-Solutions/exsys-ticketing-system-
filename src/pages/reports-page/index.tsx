/*
 * 24-11-2026 NEW (script ETKT_15): Reports - staff (/reports) and client portal (/portal/reports)
 *
 * One card per report of etk_report_pkg. Each card has its filters and two
 * buttons: "Open to print" (output H, new tab) and "Export to Excel" (output X).
 *   tickets_report  everybody; the server limits the rows to what the user may see
 *   sla_report      management and supervisors
 *   staff_report    management and supervisors
 *   client_report   client users (their client) and staff (a client must be chosen)
 * The server checks every right again (-20812 / -20810), the screen only hides
 * what the user cannot use.
 */
import React, { useState } from "react";
import { Button, DatePicker, Radio, Select, message } from "antd";
import dayjs, { Dayjs } from "dayjs";
import styled from "styled-components";
import { PageTitle, ShadowSection, SubText } from "../../components/commons";
import Icon from "../../components/icon";
import { DATE_FORMAT, periodRange } from "../../components/stats-bits";
import { useBasicQuery, useLookups } from "../../hooks";
import useOpenReport, { ReportOutput } from "../../hooks/useOpenReport";
import { useSessionRange, useSessionState } from "../../hooks/useSessionState";
import { useLabels } from "../../labels";
import { ApiIdType, RecordType } from "../../api";
import { isManagement, isStaffUser, isSupervisor, useAppConfig } from "../../store";

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
  gap: 16px;
`;

const Card = styled(ShadowSection)`
  display: flex;
  flex-direction: column;
  gap: 10px;
  h3 {
    margin: 0;
    font-size: 16px;
    color: ${({ theme }) => theme.colors.primary};
  }
  .filters {
    display: flex;
    flex-direction: column;
    gap: 8px;
    flex: 1;
  }
  .filters .ant-select,
  .filters .ant-picker {
    width: 100%;
  }
  .actions {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }
`;

const RangeField = ({
  value,
  onChange,
  allowEmpty,
}: {
  value: [Dayjs, Dayjs] | null;
  onChange: (next: [Dayjs, Dayjs] | null) => void;
  allowEmpty?: boolean;
}) => (
  <DatePicker.RangePicker
    format={DATE_FORMAT}
    value={value}
    allowClear={!!allowEmpty}
    onChange={(dates) =>
      onChange(dates && dates[0] && dates[1] ? [dates[0], dates[1]] : null)
    }
  />
);

const ReportCard = ({
  title,
  description,
  children,
  onOpen,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
  onOpen: (output: ReportOutput) => void;
}) => {
  const labels = useLabels();
  return (
    <Card padding="16px">
      <h3>{title}</h3>
      <SubText>{description}</SubText>
      <div className="filters">{children}</div>
      <div className="actions">
        <Button type="primary" onClick={() => onOpen("H")}>
          <Icon type="printer" /> {labels("rptOpenPrint")}
        </Button>
        <Button onClick={() => onOpen("X")}>
          <Icon type="file-excel" /> {labels("exportExcel")}
        </Button>
      </div>
    </Card>
  );
};

const dates = (range: [Dayjs, Dayjs] | null): RecordType =>
  range
    ? { from_date: range[0].format(DATE_FORMAT), to_date: range[1].format(DATE_FORMAT) }
    : {};

const ReportsPage = () => {
  const labels = useLabels();
  const { user } = useAppConfig();
  const { lookups } = useLookups();
  const openReport = useOpenReport();
  const staff = isStaffUser(user);
  const manager = isManagement(user) || isSupervisor(user);
  // a client manager of several branches may choose one; a one-branch user never
  const clientBranches = !staff && user?.role === "CLA" ? lookups.branches : [];

  // staff choose a client from the clients list
  const [clients, setClients] = useState<any[]>([]);
  useBasicQuery({
    apiId: "clients",
    params: { poffset: 0, poffset_step: 500 },
    callOnFirstRender: staff,
    onResponse: ({ apiValues, error }) =>
      setClients(!error && apiValues ? apiValues.data || [] : []),
  });
  const clientOptions = clients.map((c) => ({ value: c.client_id, label: c.client_name }));
  const teamOptions = lookups.teams.map((t) => ({ value: Number(t.key), label: t.value }));
  const statusOptions = lookups.statuses.map((s) => ({ value: s.key, label: s.value }));
  const moduleOptions = lookups.modules.map((m) => ({ value: m.key, label: m.value }));
  const branchOptions = clientBranches.map((b) => ({ value: Number(b.key), label: b.value }));

  // filters are kept for the session (a language change mounts the page again)
  const [tRange, setTRange] = useSessionState<[string, string] | null>("rpt-t-range", null);
  const [tClient, setTClient] = useSessionState<number | undefined>("rpt-t-client", undefined);
  const [tBranch, setTBranch] = useSessionState<number | undefined>("rpt-t-branch", undefined);
  const [tStatus, setTStatus] = useSessionState<string | undefined>("rpt-t-status", undefined);
  const [tTeam, setTTeam] = useSessionState<number | undefined>("rpt-t-team", undefined);
  const [tModule, setTModule] = useSessionState<string | undefined>("rpt-t-module", undefined);
  const [sRange, setSRange] = useSessionRange("rpt-s-range", () => periodRange("m"));
  const [sGroup, setSGroup] = useSessionState<string>("rpt-s-group", "C");
  const [sClient, setSClient] = useSessionState<number | undefined>("rpt-s-client", undefined);
  const [sTeam, setSTeam] = useSessionState<number | undefined>("rpt-s-team", undefined);
  const [pRange, setPRange] = useSessionRange("rpt-p-range", () => periodRange("m"));
  const [pTeam, setPTeam] = useSessionState<number | undefined>("rpt-p-team", undefined);
  const [cRange, setCRange] = useSessionRange("rpt-c-range", () => periodRange("m"));
  const [cClient, setCClient] = useSessionState<number | undefined>("rpt-c-client", undefined);
  const [cBranch, setCBranch] = useSessionState<number | undefined>("rpt-c-branch", undefined);

  const ticketsRange: [Dayjs, Dayjs] | null = tRange ? [dayjs(tRange[0]), dayjs(tRange[1])] : null;

  const open = (apiId: ApiIdType, params: RecordType, output: ReportOutput) =>
    openReport(apiId, params, output);

  return (
    <>
      <PageTitle>{labels("reports")}</PageTitle>
      <Grid>
        <ReportCard
          title={labels("rpt_tickets")}
          description={labels("rptTicketsDesc")}
          onOpen={(output) =>
            open(
              "ticketsReport",
              {
                ...dates(ticketsRange),
                view: "all",
                client_id: staff ? tClient : undefined,
                branch_id: staff ? undefined : tBranch,
                status: tStatus,
                team_id: staff ? tTeam : undefined,
                module_id: tModule,
              },
              output,
            )
          }
        >
          <RangeField
            value={ticketsRange}
            allowEmpty
            onChange={(next) =>
              setTRange(next ? [next[0].format(DATE_FORMAT), next[1].format(DATE_FORMAT)] : null)
            }
          />
          <SubText>{labels("rptAllDatesHint")}</SubText>
          {staff ? (
            <Select
              allowClear
              showSearch
              optionFilterProp="label"
              placeholder={labels("allClients")}
              value={tClient}
              onChange={setTClient}
              options={clientOptions}
            />
          ) : null}
          {branchOptions.length > 1 ? (
            <Select
              allowClear
              placeholder={labels("allBranches")}
              value={tBranch}
              onChange={setTBranch}
              options={branchOptions}
            />
          ) : null}
          <Select
            allowClear
            placeholder={labels("status")}
            value={tStatus}
            onChange={setTStatus}
            options={statusOptions}
          />
          {staff ? (
            <Select
              allowClear
              placeholder={labels("allTeams")}
              value={tTeam}
              onChange={setTTeam}
              options={teamOptions}
            />
          ) : null}
          <Select
            allowClear
            placeholder={labels("module")}
            value={tModule}
            onChange={setTModule}
            options={moduleOptions}
          />
        </ReportCard>

        {manager ? (
          <ReportCard
            title={labels("rpt_sla")}
            description={labels("rptSlaDesc")}
            onOpen={(output) =>
              open(
                "slaReport",
                { ...dates(sRange), group_by: sGroup, client_id: sClient, team_id: sTeam },
                output,
              )
            }
          >
            <RangeField value={sRange} onChange={(next) => next && setSRange(next)} />
            <Radio.Group
              value={sGroup}
              buttonStyle="solid"
              onChange={(event) => setSGroup(event.target.value)}
            >
              <Radio.Button value="C">{labels("client")}</Radio.Button>
              <Radio.Button value="T">{labels("team")}</Radio.Button>
              <Radio.Button value="P">{labels("priority")}</Radio.Button>
            </Radio.Group>
            <Select
              allowClear
              showSearch
              optionFilterProp="label"
              placeholder={labels("allClients")}
              value={sClient}
              onChange={setSClient}
              options={clientOptions}
            />
            <Select
              allowClear
              placeholder={labels("allTeams")}
              value={sTeam}
              onChange={setSTeam}
              options={teamOptions}
            />
          </ReportCard>
        ) : null}

        {manager ? (
          <ReportCard
            title={labels("rpt_staff")}
            description={labels("rptStaffDesc")}
            onOpen={(output) =>
              open("staffReport", { ...dates(pRange), team_id: pTeam }, output)
            }
          >
            <RangeField value={pRange} onChange={(next) => next && setPRange(next)} />
            <Select
              allowClear
              placeholder={labels("allTeams")}
              value={pTeam}
              onChange={setPTeam}
              options={teamOptions}
            />
          </ReportCard>
        ) : null}

        <ReportCard
          title={labels("rpt_client")}
          description={labels("rptClientDesc")}
          onOpen={(output) => {
            if (staff && !cClient) {
              message.warning(labels("rptChooseClient"));
              return;
            }
            open(
              "clientReport",
              {
                ...dates(cRange),
                client_id: staff ? cClient : undefined,
                branch_id: staff ? undefined : cBranch,
              },
              output,
            );
          }}
        >
          <RangeField value={cRange} onChange={(next) => next && setCRange(next)} />
          {staff ? (
            <Select
              showSearch
              optionFilterProp="label"
              placeholder={labels("client")}
              value={cClient}
              onChange={setCClient}
              options={clientOptions}
            />
          ) : null}
          {branchOptions.length > 1 ? (
            <Select
              allowClear
              placeholder={labels("allBranches")}
              value={cBranch}
              onChange={setCBranch}
              options={branchOptions}
            />
          ) : null}
        </ReportCard>
      </Grid>
    </>
  );
};

export default ReportsPage;
