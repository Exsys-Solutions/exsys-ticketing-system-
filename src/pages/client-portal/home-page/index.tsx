/*
 * Client home - 23-11-2026 (script ETKT_14), the prototype "cl-home".
 *
 * GET etk_analytics_pkg/client_home_data
 *   greeting, search box into the guide, quick buttons (new ticket, statistics,
 *   my open tickets), the guide by module, the last 5 tickets, the most read articles.
 * The contract banner is the shared one above every page.
 */
import { useState } from "react";
import { Button, Input, Spin, Tag } from "antd";
import type { ColumnType as ColumnProps } from "antd/es/table";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";
import { Flex, ShadowSection, SubText } from "../../../components/commons";
import ExsysTable from "../../../components/exsys-table";
import { icon } from "../../../components/icon";
import { useBasicQuery } from "../../../hooks";
import { useLabels } from "../../../labels";
import { PAGES_PATH_NAMES, ticketPath } from "../../../routes/constants";

const Hero = styled.section`
  background: linear-gradient(135deg, #006fbb, #0b8bd8);
  color: #fff;
  border-radius: 14px;
  padding: 26px 22px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  h1 {
    color: #fff;
    margin: 0;
    font-size: 22px;
  }
  .ant-input-search {
    max-width: 580px;
  }
`;

const Cats = styled.div`
  display: grid;
  gap: 10px;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  button {
    text-align: start;
    background: ${({ theme }) => theme.colors.background};
    border: 1px solid ${({ theme }) => theme.colors.borderLight};
    border-radius: 10px;
    padding: 12px 14px;
    cursor: pointer;
    color: ${({ theme }) => theme.colors.text};
    font: inherit;
  }
  button:hover {
    border-color: ${({ theme }) => theme.colors.primary};
  }
  b {
    display: block;
  }
  span {
    color: ${({ theme }) => theme.colors.mutedText};
    font-size: 12px;
  }
`;

interface HomeType {
  client_name?: string;
  branch_name?: string;
  user_name?: string;
  open_count: number;
  waiting_count: number;
  latest: any[];
  modules: { module_id: string; module_name: string; articles: number }[];
  articles: { article_id: number; title: string; module_name: string }[];
}

const ClientHomePage = () => {
  const labels = useLabels();
  const navigate = useNavigate();
  const [home, setHome] = useState<HomeType>({
    open_count: 0,
    waiting_count: 0,
    latest: [],
    modules: [],
    articles: [],
  });

  const { loading } = useBasicQuery<HomeType>({
    apiId: "clientHome",
    callOnFirstRender: true,
    onResponse: ({ apiValues, error }) => {
      if (!error && apiValues) {
        setHome({ ...home, ...apiValues });
      }
    },
  });

  const faq = (query: string) => navigate(`${PAGES_PATH_NAMES.clientFaq}?${query}`);

  const columns: ColumnProps<any>[] = [
    { title: labels("ticketNo"), dataIndex: "ticket_id", width: 90 },
    { title: labels("title"), dataIndex: "title" },
    { title: labels("module"), dataIndex: "module_name", width: 140 },
    {
      title: labels("status"),
      dataIndex: "status_name",
      width: 130,
      render: (value: string, record: any) => (
        <Tag color={record.open_flag === "Y" ? "blue" : undefined}>{value}</Tag>
      ),
    },
  ];

  return (
    <Spin spinning={loading}>
      <Hero>
        <h1>
          {labels("helloUser")} {home.user_name || ""}{labels("howCanWeHelp")}
        </h1>
        <Input.Search
          size="large"
          allowClear
          placeholder={labels("guideSearchHint")}
          onSearch={(value) => (value.trim() ? faq(`q=${encodeURIComponent(value.trim())}`) : undefined)}
        />
        <Flex gap={8} wrap>
          <Button icon={icon("plus-circle")} onClick={() => navigate(PAGES_PATH_NAMES.clientNewTicket)}>
            {labels("newTicket")}
          </Button>
          <Button icon={icon("dashboard")} onClick={() => navigate(PAGES_PATH_NAMES.clientDashboard)}>
            {labels("orgStats")}
          </Button>
          <Button icon={icon("profile")} onClick={() => navigate(PAGES_PATH_NAMES.clientMyTickets)}>
            {labels("followMyTickets")} ({home.open_count} {labels("openWord")})
          </Button>
        </Flex>
        {home.waiting_count ? (
          <SubText style={{ color: "#fff" }}>
            {labels("waitingYou")}: {home.waiting_count}
          </SubText>
        ) : null}
      </Hero>

      <h3 style={{ margin: "18px 0 10px" }}>{labels("browseGuideByModule")}</h3>
      <Cats>
        {home.modules.map((m) => (
          <button key={m.module_id} onClick={() => faq(`module=${m.module_id}`)}>
            <b>{m.module_name}</b>
            <span>
              {m.articles} {labels("articlesWord")}
            </span>
          </button>
        ))}
      </Cats>

      <Flex gap={12} wrap align="stretch" margin="16px 0 0">
        <ShadowSection style={{ flex: 2, minWidth: 340 }}>
          <SubText style={{ fontWeight: 600 }}>{labels("latestTickets")}</SubText>
          <ExsysTable
            rowKey="ticket_id"
            columns={columns}
            dataSource={home.latest}
            onRowClick={(record) => navigate(ticketPath(record.ticket_id, true))}
          />
        </ShadowSection>
        <ShadowSection style={{ flex: 1, minWidth: 260 }}>
          <SubText style={{ fontWeight: 600, display: "block", marginBottom: 8 }}>
            {labels("usefulArticles")}
          </SubText>
          {home.articles.length ? (
            home.articles.map((a) => (
              <div key={a.article_id} style={{ marginBottom: 8 }}>
                <a onClick={() => faq(`article=${a.article_id}`)}>{a.title}</a>
                <SubText style={{ display: "block" }}>{a.module_name}</SubText>
              </div>
            ))
          ) : (
            <SubText>{labels("noData")}</SubText>
          )}
        </ShadowSection>
      </Flex>
    </Spin>
  );
};

export default ClientHomePage;
