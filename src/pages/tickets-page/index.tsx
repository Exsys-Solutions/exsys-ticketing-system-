/*
 * Tickets list (staff).
 *
 * GET etk_ticket_pkg/tickets_data
 *   view, status, priority, type, team_id, client_id, search,
 *   poffset, poffset_step
 * The server already limits the rows to what the signed-in role may see, so
 * the screen sends filters only - never a "who am I" condition.
 */
import React, { useCallback, useState } from "react";
import { Button } from "antd";

import type { ColumnType as ColumnProps } from "antd/es/table";
import { useNavigate } from "react-router-dom";
import { Flex, PageTitle, ShadowSection } from "../../components/commons";
import ExsysTable from "../../components/exsys-table";
import {
  PriorityBar,
  SentimentIcon,
  SlaTag,
  StatusTag,
} from "../../components/ticket-bits";
import { useBasicQuery } from "../../hooks";
import { useLabels } from "../../labels";
import { PAGE_SIZE, TICKET_VIEWS } from "./constants";
import FiltersView, { TicketFiltersType } from "./partials/FiltersView";
import NewTaskModal from "./partials/NewTaskModal";
import { ticketPath } from "../../routes/constants";
import Icon from "../../components/icon";
import Tabs from "../../components/tabs";
import { ExportExcelButton } from "../../components/report-bits";

const INITIAL_FILTERS: TicketFiltersType = {
  view: "open",
  status: "",
  type: "",
  search: "",
};

const TicketsPage = () => {
  const labels = useLabels();
  const navigate = useNavigate();
  const [filters, setFilters] = useState<TicketFiltersType>(INITIAL_FILTERS);
  const [offset, setOffset] = useState(0);
  const [rows, setRows] = useState<any[]>([]);
  const [taskOpen, setTaskOpen] = useState(false);

  const { loading, runQuery } = useBasicQuery({
    apiId: "tickets",
    callOnFirstRender: true,
    onResponse: ({ apiValues, error }) => {
      setRows(!error && apiValues ? apiValues.data || [] : []);
    },
  });

  const load = useCallback(
    (nextFilters: TicketFiltersType, nextOffset: number) => {
      runQuery({
        view: nextFilters.view,
        status: nextFilters.status,
        priority: nextFilters.priority,
        type: nextFilters.type,
        team_id: nextFilters.team_id,
        client_id: nextFilters.client_id,
        search: nextFilters.search,
        poffset: nextOffset,
        poffset_step: PAGE_SIZE,
      });
    },
    [runQuery],
  );

  const onFiltersChange = useCallback(
    (next: Partial<TicketFiltersType>) => {
      const merged = { ...filters, ...next };
      setFilters(merged);
      setOffset(0);
      load(merged, 0);
    },
    [filters, load],
  );

  const onPageChange = useCallback(
    (nextOffset: number) => {
      setOffset(nextOffset);
      load(filters, nextOffset);
    },
    [filters, load],
  );

  const columns: ColumnProps<any>[] = [
    {
      title: "",
      dataIndex: "company_priority",
      width: 10,
      render: (value: number) => <PriorityBar priority={value} />,
    },
    { title: labels("ticketNo"), dataIndex: "ticket_id", width: 90 },
    {
      title: labels("title"),
      dataIndex: "title",
      render: (value: string, record: any) => (
        <Flex gap={6}>
          <span>{value}</span>
          <SentimentIcon sentiment={record.sentiment} />
        </Flex>
      ),
    },
    { title: labels("client"), dataIndex: "client_name", width: 160 },
    { title: labels("branch"), dataIndex: "branch_name", width: 140 },
    { title: labels("module"), dataIndex: "module_name", width: 120 },
    { title: labels("type"), dataIndex: "type_name", width: 110 },
    {
      title: labels("status"),
      dataIndex: "status_name",
      width: 120,
      render: (value: string, record: any) => (
        <StatusTag statusName={value} openFlag={record.open_flag} />
      ),
    },
    { title: labels("priority"), dataIndex: "priority_name", width: 100 },
    { title: labels("team"), dataIndex: "team_name", width: 130 },
    { title: labels("assignee"), dataIndex: "assignee_name", width: 140 },
    {
      title: labels("sla"),
      dataIndex: "sla_state",
      width: 90,
      render: (value: string) => <SlaTag slaState={value} />,
    },
    { title: labels("submittedDate"), dataIndex: "submitted_date", width: 140 },
  ];

  return (
    <>
      <Flex justify="space-between" margin="0 0 12px">
        <PageTitle>{labels("tickets")}</PageTitle>
        {/* 23-11-2026 NEW: staff open an internal task (the service ticket_dml already took it) */}
        <Flex gap={8}>
          {/* 24-11-2026 NEW (script ETKT_15): every row of the current filter as an Excel file */}
          <ExportExcelButton
            filters={{
              view: filters.view,
              status: filters.status,
              priority: filters.priority,
              type: filters.type,
              team_id: filters.team_id,
              client_id: filters.client_id,
              search: filters.search,
            }}
          />
          <Button type="primary" onClick={() => setTaskOpen(true)}>
            <Icon type="plus" /> {labels("newTask")}
          </Button>
        </Flex>
      </Flex>

      <NewTaskModal
        open={taskOpen}
        onClose={() => setTaskOpen(false)}
        onCreated={(ticketId) => navigate(ticketPath(ticketId))}
      />

      <ShadowSection>
        <Tabs
          activeKey={filters.view}
          onChange={(view) => onFiltersChange({ view })}
        >
          {TICKET_VIEWS.map((view) => (
            <Tabs.TabPane
              tab={labels(view.labelKey as any)}
              key={view.key}
            />
          ))}
        </Tabs>

        <FiltersView
          filters={filters}
          onChange={onFiltersChange}
          onRefresh={() => load(filters, offset)}
        />

        <ExsysTable
          rowKey="ticket_id"
          columns={columns}
          dataSource={rows}
          loading={loading}
          offset={offset}
          pageSize={PAGE_SIZE}
          onPageChange={onPageChange}
          onRowClick={(record) => navigate(ticketPath(record.ticket_id))}
          useSlaRowColor
          scrollX={1500}
        />
      </ShadowSection>
    </>
  );
};

export default TicketsPage;
