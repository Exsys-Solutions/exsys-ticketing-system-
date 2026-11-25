/*
 * Repeated problems - staff. 23-11-2026, script ETKT_13.
 *
 * GET  etk_kb_pkg/problems_data      list with tickets / open tickets / clients per problem,
 *                                    problem_id -> the same row + its "tickets"
 * POST etk_kb_pkg/problem_dml        n / u / d (d only when nothing is linked)
 * POST etk_kb_pkg/problem_link_dml   link | unlink one ticket
 *
 * One parent problem collects the tickets that report the same fault, so the
 * fix is done once (fixed release) and the guide article that solves it is
 * linked to it.
 */
import React, { useCallback, useState } from "react";
import { Button, Input, Radio, Select, Tag } from "antd";
import type { ColumnType as ColumnProps } from "antd/es/table";
import { useTheme } from "styled-components";
import { Flex, PageTitle, ShadowSection } from "../../components/commons";
import ExsysTable from "../../components/exsys-table";
import { useBasicQuery, useLookups } from "../../hooks";
import { useLabels } from "../../labels";
import ProblemModal from "./partials/ProblemModal";
import { icon } from "../../components/icon";

const PAGE_SIZE = 25;

const ProblemsPage = () => {
  const labels = useLabels();
  const theme = useTheme();
  const { lookups } = useLookups();
  const [rows, setRows] = useState<any[]>([]);
  const [offset, setOffset] = useState(0);
  const [filters, setFilters] = useState({
    status: "O",
    module_id: "",
    search: "",
  });
  const [openId, setOpenId] = useState<number | null | undefined>(undefined);

  const { loading, runQuery } = useBasicQuery({
    apiId: "kbProblems",
    params: { status: "O", poffset: 0, poffset_step: PAGE_SIZE },
    callOnFirstRender: true,
    onResponse: ({ apiValues, error }) => {
      setRows(!error && apiValues ? apiValues.data || [] : []);
    },
  });

  const load = useCallback(
    (nextOffset: number, nextFilters = filters) => {
      setOffset(nextOffset);
      setFilters(nextFilters);
      runQuery({ ...nextFilters, poffset: nextOffset, poffset_step: PAGE_SIZE });
    },
    [runQuery, filters],
  );

  const columns: ColumnProps<any>[] = [
    { title: "#", dataIndex: "problem_id", width: 70 },
    { title: labels("title"), dataIndex: "title" },
    { title: labels("module"), dataIndex: "module_name", width: 150 },
    {
      title: labels("status"),
      dataIndex: "status_name",
      width: 120,
      render: (value: string, record: any) => (
        <Tag color={record.problem_status === "O" ? "orange" : "green"}>
          {value}
          {record.fixed_release ? ` · ${record.fixed_release}` : ""}
        </Tag>
      ),
    },
    { title: labels("tickets"), dataIndex: "tickets", width: 90 },
    {
      title: labels("openNow"),
      dataIndex: "open_tickets",
      width: 90,
      render: (value: number) =>
        value ? <Tag color={theme.colors.error}>{value}</Tag> : 0,
    },
    { title: labels("clientsCount"), dataIndex: "clients", width: 90 },
    {
      title: labels("guideArticle"),
      dataIndex: "article_title",
      width: 220,
      render: (value: string) => value || "-",
    },
    { title: labels("lastTicket"), dataIndex: "last_ticket_date", width: 140 },
  ];

  return (
    <>
      <Flex margin="0 0 12px" justify="space-between" wrap>
        <PageTitle>{labels("problems")}</PageTitle>
        <Button type="primary" icon={icon("plus")} onClick={() => setOpenId(null)}>
          {labels("newProblem")}
        </Button>
      </Flex>
      <ShadowSection>
        <Flex margin="0 0 12px" wrap gap={12}>
          <Radio.Group
            value={filters.status}
            onChange={(e) => load(0, { ...filters, status: e.target.value })}
          >
            <Radio.Button value="O">{labels("openProblems")}</Radio.Button>
            <Radio.Button value="F">{labels("fixedProblems")}</Radio.Button>
            <Radio.Button value="">{labels("all")}</Radio.Button>
          </Radio.Group>
          <Select
            allowClear
            style={{ width: 200 }}
            placeholder={labels("module")}
            value={filters.module_id || undefined}
            onChange={(value: any) =>
              load(0, { ...filters, module_id: value || "" })
            }
          >
            {lookups.modules.map((m) => (
              <Select.Option key={String(m.key)} value={String(m.key)}>
                {m.value}
              </Select.Option>
            ))}
          </Select>
          <Input.Search
            allowClear
            style={{ width: 260 }}
            placeholder={labels("search")}
            onSearch={(value) => load(0, { ...filters, search: value })}
          />
        </Flex>
        <ExsysTable
          rowKey="problem_id"
          columns={columns}
          dataSource={rows}
          loading={loading}
          offset={offset}
          pageSize={PAGE_SIZE}
          onPageChange={load}
          onRowClick={(record) => setOpenId(record.problem_id)}
          scrollX={1100}
        />
      </ShadowSection>

      {openId !== undefined ? (
        <ProblemModal
          problemId={openId}
          onClose={() => setOpenId(undefined)}
          onChanged={() => load(offset)}
        />
      ) : null}
    </>
  );
};

export default ProblemsPage;
