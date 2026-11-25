/*
 * FAQ (published guide articles) - staff and clients. 23-11-2026, script ETKT_13.
 *
 * GET  etk_kb_pkg/faq_data          published articles + "modules" (count per module)
 *                                   a client sees only the modules of his contract;
 *                                   article_id -> full body (and the view is counted)
 * POST etk_kb_pkg/faq_feedback_dml  "was this helpful?" Y | N
 *
 * Articles in the user's language come first (the data itself has 2 languages).
 */
import React, { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Button, Empty, Input, Modal, Spin, Tag, message as antMessage } from "antd";
import styled from "styled-components";
import { Flex, PageTitle, ShadowSection, SubText } from "../../components/commons";
import { useBasicMutation, useBasicQuery } from "../../hooks";
import { useLabels } from "../../labels";
import { icon } from "../../components/icon";

const PAGE_SIZE = 20;

const Card = styled.div`
  border: 1px solid ${({ theme }) => theme.colors.borderLight};
  border-radius: 12px;
  padding: 12px 14px;
  background: ${({ theme }) => theme.colors.background};
  cursor: pointer;
  transition: box-shadow 0.15s;
  &:hover {
    box-shadow: 0 4px 12px ${({ theme }) => theme.colors.shadow};
  }
  h4 {
    margin: 0 0 6px;
    color: ${({ theme }) => theme.colors.headingText};
  }
  p {
    margin: 0;
    color: ${({ theme }) => theme.colors.mutedText};
    font-size: 13px;
    white-space: pre-wrap;
    max-height: 60px;
    overflow: hidden;
  }
`;

const Body = styled.div`
  white-space: pre-wrap;
  line-height: 1.8;
  font-size: 14px;
  color: ${({ theme }) => theme.colors.bodyText};
`;

const FaqPage = () => {
  const labels = useLabels();
  const [rows, setRows] = useState<any[]>([]);
  const [modules, setModules] = useState<any[]>([]);
  const [offset, setOffset] = useState(0);
  // 23-11-2026 (ETKT_14): the client home opens the FAQ with ?q= / ?module= / ?article=
  const [searchParams] = useSearchParams();
  const firstFilters = {
    module_id: searchParams.get("module") || "",
    search: searchParams.get("q") || "",
  };
  const [filters, setFilters] = useState(firstFilters);
  const [article, setArticle] = useState<any>(null);
  const [voted, setVoted] = useState<{ [id: number]: boolean }>({});

  const { loading, runQuery } = useBasicQuery({
    apiId: "kbFaq",
    params: { ...firstFilters, poffset: 0, poffset_step: PAGE_SIZE },
    callOnFirstRender: true,
    onResponse: ({ apiValues, error }) => {
      setRows(!error && apiValues ? apiValues.data || [] : []);
      if (!error && apiValues && apiValues.modules) {
        setModules(apiValues.modules);
      }
    },
  });

  const { loading: opening, runQuery: openQuery } = useBasicQuery({
    apiId: "kbFaq",
    onResponse: ({ apiValues, error }) => {
      if (error) {
        antMessage.error(error);
      } else if (apiValues && apiValues.data && apiValues.data.length) {
        setArticle(apiValues.data[0]);
      }
    },
  });

  // ?article=<id> opens that article at once (from "useful articles" on the client home)
  const firstArticle = searchParams.get("article");
  useEffect(() => {
    if (firstArticle) {
      openQuery({ article_id: Number(firstArticle) });
    }
  }, [firstArticle, openQuery]);

  const { mutate: vote } = useBasicMutation({ apiId: "kbFaqFeedback" });

  const load = useCallback(
    (nextOffset: number, nextFilters = filters) => {
      setOffset(nextOffset);
      setFilters(nextFilters);
      runQuery({ ...nextFilters, poffset: nextOffset, poffset_step: PAGE_SIZE });
    },
    [runQuery, filters],
  );

  const total = rows.length ? Number(rows[0].total || 0) : 0;

  const onVote = (helpful: "Y" | "N") =>
    vote({ article_id: article.article_id, helpful }, ({ error }) => {
      if (error) {
        antMessage.error(error);
        return;
      }
      setVoted((old) => ({ ...old, [article.article_id]: true }));
      antMessage.success(labels("thanksFeedback"));
    });

  return (
    <>
      <Flex margin="0 0 12px" justify="space-between" wrap>
        <PageTitle>{labels("faq")}</PageTitle>
        <Input.Search
          allowClear
          style={{ width: 320 }}
          placeholder={labels("faqSearch")}
          defaultValue={firstFilters.search}
          onSearch={(value) => load(0, { ...filters, search: value })}
        />
      </Flex>

      <Flex wrap gap={8} margin="0 0 12px">
        <Tag.CheckableTag
          checked={!filters.module_id}
          onChange={() => load(0, { ...filters, module_id: "" })}
        >
          {labels("all")}
        </Tag.CheckableTag>
        {modules.map((m) => (
          <Tag.CheckableTag
            key={m.module_id}
            checked={filters.module_id === m.module_id}
            onChange={() => load(0, { ...filters, module_id: m.module_id })}
          >
            {m.module_name} ({m.articles})
          </Tag.CheckableTag>
        ))}
      </Flex>

      <ShadowSection>
        <Spin spinning={loading || opening}>
          {rows.length ? (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
                gap: 12,
              }}
            >
              {rows.map((row) => (
                <Card
                  key={row.article_id}
                  onClick={() => openQuery({ article_id: row.article_id })}
                >
                  <h4>{row.title}</h4>
                  <p>{row.excerpt}</p>
                  <Flex margin="8px 0 0" gap={8} wrap>
                    <Tag>{row.module_name}</Tag>
                    <SubText>
                      {labels("views")}: {row.view_count}
                    </SubText>
                  </Flex>
                </Card>
              ))}
            </div>
          ) : (
            <Empty description={labels("noData")} />
          )}
          {total > offset + PAGE_SIZE || offset > 0 ? (
            <Flex justify="center" margin="12px 0 0">
              <Button disabled={offset === 0} onClick={() => load(Math.max(0, offset - PAGE_SIZE))}>
                {labels("previous")}
              </Button>
              <SubText>
                {offset + 1} - {Math.min(offset + PAGE_SIZE, total)} / {total}
              </SubText>
              <Button
                disabled={offset + PAGE_SIZE >= total}
                onClick={() => load(offset + PAGE_SIZE)}
              >
                {labels("next")}
              </Button>
            </Flex>
          ) : null}
        </Spin>
      </ShadowSection>

      {article ? (
        <Modal
          open
          width={760}
          title={article.title}
          onCancel={() => setArticle(null)}
          footer={
            voted[article.article_id] ? (
              <SubText>{labels("thanksFeedback")}</SubText>
            ) : (
              <Flex justify="flex-end" gap={8}>
                <SubText>{labels("wasHelpful")}</SubText>
                <Button icon={icon("like")} onClick={() => onVote("Y")}>
                  {labels("yes")}
                </Button>
                <Button icon={icon("dislike")} onClick={() => onVote("N")}>
                  {labels("no")}
                </Button>
              </Flex>
            )
          }
        >
          <Flex margin="0 0 10px" gap={8}>
            <Tag>{article.module_name}</Tag>
            <SubText>{article.published_date}</SubText>
          </Flex>
          <Body dir="auto">{article.body}</Body>
        </Modal>
      ) : null}
    </>
  );
};

export default FaqPage;
