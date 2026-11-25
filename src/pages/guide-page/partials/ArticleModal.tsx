/*
 * One guide article: write / edit a draft, and the approver buttons.
 * articleId = null -> a new draft.
 * Editing is open only while the article is a draft or rejected (the server
 * refuses anything else); a published one must be returned to draft first.
 */
import React, { useEffect, useState } from "react";
import {
  Alert,
  Button,
  Input,
  Modal,
  Popconfirm,
  Radio,
  Select,
  Spin,
  Tag,
  message as antMessage,
} from "antd";
import { Flex, FieldLabel, SubText } from "../../../components/commons";
import { useBasicMutation, useBasicQuery, useLookups } from "../../../hooks";
import { useLabels } from "../../../labels";
import { useMakeSelectCurrentLanguageId } from "../../../store";
import { ARTICLE_STATUS_COLORS } from "../constants";
import { icon } from "../../../components/icon";

interface Props {
  articleId: number | null;
  onClose: () => void;
  onChanged: () => void;
}

interface ArticleType {
  article_id?: number;
  module_id?: string;
  problem_id?: number;
  title: string;
  body: string;
  keywords: string;
  language_id: number;
  article_status?: string;
  status_name?: string;
  reject_reason?: string;
  can_approve?: string;
  author_name?: string;
  approved_by_name?: string;
  approved_date?: string;
  source_ticket_id?: number;
}

const ArticleModal = ({ articleId, onClose, onChanged }: Props) => {
  const labels = useLabels();
  const languageId = useMakeSelectCurrentLanguageId();
  const { lookups } = useLookups();
  const [article, setArticle] = useState<ArticleType>({
    title: "",
    body: "",
    keywords: "",
    language_id: languageId === 1 ? 1 : 2,
  });
  const [problems, setProblems] = useState<any[]>([]);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectOpen, setRejectOpen] = useState(false);

  const { loading, runQuery } = useBasicQuery({
    apiId: "kbArticles",
    onResponse: ({ apiValues, error }) => {
      if (!error && apiValues && apiValues.data && apiValues.data.length) {
        const row = apiValues.data[0];
        setArticle({
          ...row,
          body: row.body || "",
          keywords: row.keywords || "",
        });
      }
    },
  });

  // the problem list for the "linked problem" select (open problems first)
  useBasicQuery({
    apiId: "kbProblems",
    params: { poffset: 0, poffset_step: 500 },
    callOnFirstRender: true,
    onResponse: ({ apiValues, error }) =>
      setProblems(!error && apiValues ? apiValues.data || [] : []),
  });

  useEffect(() => {
    if (articleId) {
      runQuery({ article_id: articleId });
    }
  }, [articleId, runQuery]);

  const afterSave = ({ error }: { error: string }) => {
    if (error) {
      antMessage.error(error);
      return;
    }
    antMessage.success(labels("saved"));
    onChanged();
    onClose();
  };

  const { loading: saving, mutate: save } = useBasicMutation({
    apiId: "kbArticleDml",
  });
  const { loading: acting, mutate: act } = useBasicMutation({
    apiId: "kbArticleAction",
  });

  const status = article.article_status;
  const editable = !articleId || status === "D" || status === "R";
  const approver = article.can_approve === "Y";

  const set = (field: keyof ArticleType, value: any) =>
    setArticle((old) => ({ ...old, [field]: value }));

  const onSave = () =>
    save(
      {
        record_status: articleId ? "u" : "n",
        article_id: articleId || undefined,
        module_id: article.module_id,
        problem_id: article.problem_id || null,
        title: article.title,
        body: article.body,
        keywords: article.keywords,
        language_id: article.language_id,
      },
      afterSave,
    );

  const onAction = (action: string, reason?: string) =>
    act({ article_id: articleId, action, reject_reason: reason }, afterSave);

  const footer = [
    <Button key="close" onClick={onClose}>
      {labels("close")}
    </Button>,
  ];
  if (editable) {
    footer.push(
      <Button key="save" type="primary" loading={saving} onClick={onSave}>
        {labels("saveDraft")}
      </Button>,
    );
  }
  if (articleId && approver && status === "D") {
    footer.push(
      <Button key="reject" danger onClick={() => setRejectOpen(true)}>
        {labels("reject")}
      </Button>,
      <Popconfirm
        key="approve"
        title={labels("approvePublishConfirm")}
        onConfirm={() => onAction("approve")}
      >
        <Button type="primary" loading={acting} icon={icon("check")}>
          {labels("approvePublish")}
        </Button>
      </Popconfirm>,
    );
  }
  if (articleId && (status === "R" || status === "A" || (status === "P" && approver))) {
    footer.push(
      <Button key="redraft" loading={acting} onClick={() => onAction("redraft")}>
        {labels("backToDraft")}
      </Button>,
    );
  }
  if (articleId && approver && status !== "A") {
    footer.push(
      <Popconfirm
        key="archive"
        title={labels("archiveConfirm")}
        onConfirm={() => onAction("archive")}
      >
        <Button loading={acting}>{labels("archive")}</Button>
      </Popconfirm>,
    );
  }

  return (
    <Modal
      open
      width={860}
      title={
        <Flex gap={8}>
          <span>{articleId ? `${labels("article")} #${articleId}` : labels("newArticle")}</span>
          {status ? (
            <Tag color={ARTICLE_STATUS_COLORS[status]}>{article.status_name}</Tag>
          ) : null}
        </Flex>
      }
      onCancel={onClose}
      footer={footer}
      mask={{ closable: false }}
    >
      <Spin spinning={loading}>
        {status === "R" && article.reject_reason ? (
          <Alert
            type="error"
            showIcon
            style={{ marginBottom: 12 }}
            title={`${labels("rejectReason")}: ${article.reject_reason}`}
          />
        ) : null}
        {status === "P" ? (
          <Alert
            type="info"
            showIcon
            style={{ marginBottom: 12 }}
            title={labels("publishedReadOnly")}
          />
        ) : null}

        <Flex gap={12} wrap align="flex-start">
          <div style={{ flex: 1, minWidth: 200 }}>
            <FieldLabel>{labels("module")} *</FieldLabel>
            <Select
              style={{ width: "100%" }}
              disabled={!editable}
              value={article.module_id}
              onChange={(value: any) => set("module_id", value)}
              showSearch
              optionFilterProp="children"
            >
              {lookups.modules.map((m) => (
                <Select.Option key={String(m.key)} value={String(m.key)}>
                  {m.value}
                </Select.Option>
              ))}
            </Select>
          </div>
          <div style={{ flex: 1, minWidth: 200 }}>
            <FieldLabel>{labels("problem")}</FieldLabel>
            <Select
              allowClear
              style={{ width: "100%" }}
              disabled={!editable}
              value={article.problem_id || undefined}
              onChange={(value: any) => set("problem_id", value)}
              showSearch
              optionFilterProp="children"
            >
              {problems.map((p) => (
                <Select.Option key={p.problem_id} value={p.problem_id}>
                  {`#${p.problem_id} ${p.title}`}
                </Select.Option>
              ))}
            </Select>
          </div>
          <div>
            <FieldLabel>{labels("articleLanguage")}</FieldLabel>
            <Radio.Group
              disabled={!editable}
              value={article.language_id}
              onChange={(e) => set("language_id", e.target.value)}
            >
              <Radio.Button value={2}>العربية</Radio.Button>
              <Radio.Button value={1}>English</Radio.Button>
            </Radio.Group>
          </div>
        </Flex>

        <div style={{ marginTop: 12 }}>
          <FieldLabel>{labels("title")} *</FieldLabel>
          <Input
            readOnly={!editable} /* 23-11-2026: readOnly, not disabled - the published text was too faint to read */
            maxLength={200}
            value={article.title}
            onChange={(e) => set("title", e.target.value)}
          />
        </div>
        <div style={{ marginTop: 12 }}>
          <FieldLabel>{labels("articleBody")} *</FieldLabel>
          <Input.TextArea
            readOnly={!editable} /* 23-11-2026: readOnly, not disabled - the published text was too faint to read */
            autoSize={{ minRows: 10, maxRows: 22 }}
            value={article.body}
            onChange={(e) => set("body", e.target.value)}
          />
        </div>
        <div style={{ marginTop: 12 }}>
          <FieldLabel>{labels("keywords")}</FieldLabel>
          <Input
            readOnly={!editable} /* 23-11-2026: readOnly, not disabled - the published text was too faint to read */
            maxLength={1000}
            value={article.keywords}
            placeholder={labels("keywordsHint")}
            onChange={(e) => set("keywords", e.target.value)}
          />
        </div>

        {articleId ? (
          <Flex margin="12px 0 0" gap={16} wrap>
            <SubText>
              {labels("author")}: {article.author_name || "-"}
            </SubText>
            {article.approved_by_name ? (
              <SubText>
                {labels("approvedBy")}: {article.approved_by_name} · {article.approved_date}
              </SubText>
            ) : null}
            {article.source_ticket_id ? (
              <SubText>
                {labels("sourceTicket")}: {article.source_ticket_id}
              </SubText>
            ) : null}
          </Flex>
        ) : null}
      </Spin>

      <Modal
        open={rejectOpen}
        title={labels("reject")}
        okText={labels("reject")}
        okButtonProps={{ danger: true, loading: acting }}
        cancelText={labels("close")}
        onCancel={() => setRejectOpen(false)}
        onOk={() => {
          if (!rejectReason.trim()) {
            antMessage.error(labels("rejectReasonRequired"));
            return;
          }
          onAction("reject", rejectReason.trim());
        }}
      >
        <FieldLabel>{labels("rejectReason")} *</FieldLabel>
        <Input.TextArea
          autoSize={{ minRows: 3 }}
          maxLength={400}
          value={rejectReason}
          onChange={(e) => setRejectReason(e.target.value)}
        />
      </Modal>
    </Modal>
  );
};

export default ArticleModal;
