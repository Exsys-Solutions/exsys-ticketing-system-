/*
 * Guide (knowledge base) - staff. 23-11-2026, script ETKT_13.
 *
 * GET  etk_kb_pkg/articles_data       list (status / module / search), one article with its body
 * POST etk_kb_pkg/article_dml         n new draft, u edit a draft or a rejected article, d archive
 * POST etk_kb_pkg/article_action_dml  approve | reject | archive | redraft
 *
 * Life of an article: anybody on the staff writes a DRAFT -> a guide approver
 * (management or ETK_USER.KB_APPROVER_FLAG = Y) PUBLISHES it or REJECTS it with
 * a reason -> a published article shows in the FAQ of the clients that have
 * its module. The server checks every rule; the buttons only follow it.
 */
import React, { useCallback, useState } from "react";
import { Button, Input, Radio, Select, Tag } from "antd";
import type { ColumnType as ColumnProps } from "antd/es/table";
import { useTheme } from "styled-components";
import { Flex, PageTitle, ShadowSection } from "../../components/commons";
import ExsysTable from "../../components/exsys-table";
import { useBasicQuery, useLookups } from "../../hooks";
import { useLabels } from "../../labels";
import ArticleModal from "./partials/ArticleModal";
import { ARTICLE_STATUS_COLORS } from "./constants";
import { icon } from "../../components/icon";

const PAGE_SIZE = 25;

const GuidePage = () => {
  const labels = useLabels();
  const theme = useTheme();
  const { lookups } = useLookups();
  const [rows, setRows] = useState<any[]>([]);
  const [offset, setOffset] = useState(0);
  const [filters, setFilters] = useState({
    status: "",
    module_id: "",
    search: "",
  });
  const [openId, setOpenId] = useState<number | null | undefined>(undefined);

  const { loading, runQuery } = useBasicQuery({
    apiId: "kbArticles",
    params: { poffset: 0, poffset_step: PAGE_SIZE },
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
    { title: "#", dataIndex: "article_id", width: 70 },
    {
      title: labels("title"),
      dataIndex: "title",
      render: (value: string, record: any) => (
        <>
          <div style={{ fontWeight: 500 }}>{value}</div>
          {record.source_kind === "A" ? (
            <Tag color={theme.colors.primary}>{labels("aiDraft")}</Tag>
          ) : null}
          {record.reject_reason && record.article_status === "R" ? (
            <div style={{ color: theme.colors.error, fontSize: 12 }}>
              {record.reject_reason}
            </div>
          ) : null}
        </>
      ),
    },
    { title: labels("module"), dataIndex: "module_name", width: 150 },
    {
      title: labels("status"),
      dataIndex: "status_name",
      width: 110,
      render: (value: string, record: any) => (
        <Tag color={ARTICLE_STATUS_COLORS[record.article_status]}>{value}</Tag>
      ),
    },
    {
      title: labels("articleLanguage"),
      dataIndex: "language_id",
      width: 90,
      render: (value: number) => (value === 1 ? "EN" : "AR"),
    },
    { title: labels("author"), dataIndex: "author_name", width: 150 },
    { title: labels("views"), dataIndex: "view_count", width: 80 },
    {
      title: labels("helpful"),
      dataIndex: "helpful_yes",
      width: 100,
      render: (value: number, record: any) => `${value} / ${record.helpful_no}`,
    },
    { title: labels("lastUpdate"), dataIndex: "update_date", width: 140 },
  ];

  return (
    <>
      <Flex margin="0 0 12px" justify="space-between" wrap>
        <PageTitle>{labels("guide")}</PageTitle>
        <Button type="primary" icon={icon("plus")} onClick={() => setOpenId(null)}>
          {labels("newArticle")}
        </Button>
      </Flex>
      <ShadowSection>
        <Flex margin="0 0 12px" wrap gap={12}>
          <Radio.Group
            value={filters.status}
            onChange={(e) => load(0, { ...filters, status: e.target.value })}
          >
            <Radio.Button value="">{labels("all")}</Radio.Button>
            <Radio.Button value="D">{labels("drafts")}</Radio.Button>
            <Radio.Button value="P">{labels("published")}</Radio.Button>
            <Radio.Button value="R">{labels("rejected")}</Radio.Button>
            <Radio.Button value="A">{labels("archived")}</Radio.Button>
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
          rowKey="article_id"
          columns={columns}
          dataSource={rows}
          loading={loading}
          offset={offset}
          pageSize={PAGE_SIZE}
          onPageChange={load}
          onRowClick={(record) => setOpenId(record.article_id)}
          scrollX={1100}
        />
      </ShadowSection>

      {openId !== undefined ? (
        <ArticleModal
          articleId={openId}
          onClose={() => setOpenId(undefined)}
          onChanged={() => load(offset)}
        />
      ) : null}
    </>
  );
};

export default GuidePage;
