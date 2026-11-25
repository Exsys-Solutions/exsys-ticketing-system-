/*
 * One problem: its fields, the guide article that solves it, and the tickets
 * linked to it (link a ticket by number, unlink one). problemId null = new.
 */
import React, { useEffect, useState } from "react";
import {
  Button,
  Divider,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Radio,
  Select,
  Spin,
  Tag,
  message as antMessage,
} from "antd";
import type { ColumnType as ColumnProps } from "antd/es/table";
import { useNavigate } from "react-router-dom";
import { Flex, FieldLabel } from "../../../components/commons";
import ExsysTable from "../../../components/exsys-table";
import { useBasicMutation, useBasicQuery, useLookups } from "../../../hooks";
import { useLabels } from "../../../labels";
import { ticketPath } from "../../../routes/constants";
import { icon } from "../../../components/icon";

interface Props {
  problemId: number | null;
  onClose: () => void;
  onChanged: () => void;
}

interface ProblemType {
  problem_id?: number;
  title: string;
  module_id?: string;
  article_id?: number;
  problem_status: string;
  fixed_release?: string;
  notes?: string;
  tickets?: number;
}

const ProblemModal = ({ problemId, onClose, onChanged }: Props) => {
  const labels = useLabels();
  const navigate = useNavigate();
  const { lookups } = useLookups();
  const [problem, setProblem] = useState<ProblemType>({
    title: "",
    problem_status: "O",
  });
  const [tickets, setTickets] = useState<any[]>([]);
  const [articles, setArticles] = useState<any[]>([]);
  const [linkTicket, setLinkTicket] = useState<number | undefined>(undefined);

  const { loading, runQuery } = useBasicQuery({
    apiId: "kbProblems",
    onResponse: ({ apiValues, error }) => {
      if (!error && apiValues && apiValues.data && apiValues.data.length) {
        setProblem(apiValues.data[0]);
        setTickets(apiValues.tickets || []);
      }
    },
  });

  // published articles to link (the guide list, published only)
  useBasicQuery({
    apiId: "kbArticles",
    params: { status: "P", poffset: 0, poffset_step: 500 },
    callOnFirstRender: true,
    onResponse: ({ apiValues, error }) =>
      setArticles(!error && apiValues ? apiValues.data || [] : []),
  });

  useEffect(() => {
    if (problemId) {
      runQuery({ problem_id: problemId });
    }
  }, [problemId, runQuery]);

  const { loading: saving, mutate: save } = useBasicMutation({
    apiId: "kbProblemDml",
  });
  const { loading: linking, mutate: link } = useBasicMutation({
    apiId: "kbProblemLink",
  });

  const set = (field: keyof ProblemType, value: any) =>
    setProblem((old) => ({ ...old, [field]: value }));

  const done = ({ error }: { error: string }, close = true) => {
    if (error) {
      antMessage.error(error);
      return false;
    }
    antMessage.success(labels("saved"));
    onChanged();
    if (close) {
      onClose();
    }
    return true;
  };

  const onSave = () =>
    save(
      {
        record_status: problemId ? "u" : "n",
        problem_id: problemId || undefined,
        title: problem.title,
        module_id: problem.module_id || null,
        article_id: problem.article_id || null,
        problem_status: problem.problem_status,
        fixed_release: problem.fixed_release,
        notes: problem.notes,
      },
      (r) => done(r),
    );

  const onDelete = () =>
    save({ record_status: "d", problem_id: problemId }, (r) => done(r));

  const onLink = (ticketId: number, action: "link" | "unlink") =>
    link({ ticket_id: ticketId, problem_id: problemId, action }, (r) => {
      if (done(r, false)) {
        setLinkTicket(undefined);
        runQuery({ problem_id: problemId });
      }
    });

  const ticketColumns: ColumnProps<any>[] = [
    { title: labels("ticketNo"), dataIndex: "ticket_id", width: 90 },
    { title: labels("title"), dataIndex: "title" },
    { title: labels("client"), dataIndex: "client_name", width: 160 },
    {
      title: labels("status"),
      dataIndex: "status_name",
      width: 120,
      render: (value: string, record: any) => (
        <Tag color={record.open_flag === "Y" ? "blue" : ""}>{value}</Tag>
      ),
    },
    { title: labels("submittedDate"), dataIndex: "submitted_date", width: 140 },
    {
      title: "",
      dataIndex: "ticket_id",
      key: "unlink",
      width: 90,
      render: (value: number) => (
        <span onClick={(e) => e.stopPropagation()}>
          <Popconfirm
            title={labels("unlinkConfirm")}
            onConfirm={() => onLink(value, "unlink")}
          >
            <Button size="small" type="link">
              {labels("unlink")}
            </Button>
          </Popconfirm>
        </span>
      ),
    },
  ];

  return (
    <Modal
      open
      width={900}
      title={problemId ? `${labels("problem")} #${problemId}` : labels("newProblem")}
      onCancel={onClose}
      mask={{ closable: false }}
      footer={[
        problemId && !tickets.length ? (
          <Popconfirm key="del" title={labels("deleteConfirm")} onConfirm={onDelete}>
            <Button danger>{labels("delete")}</Button>
          </Popconfirm>
        ) : null,
        <Button key="close" onClick={onClose}>
          {labels("close")}
        </Button>,
        <Button key="save" type="primary" loading={saving} onClick={onSave}>
          {labels("save")}
        </Button>,
      ]}
    >
      <Spin spinning={loading}>
        <FieldLabel>{labels("title")} *</FieldLabel>
        <Input
          maxLength={200}
          value={problem.title}
          onChange={(e) => set("title", e.target.value)}
        />
        <Flex gap={12} wrap align="flex-start" margin="12px 0 0">
          <div style={{ flex: 1, minWidth: 180 }}>
            <FieldLabel>{labels("module")}</FieldLabel>
            <Select
              allowClear
              style={{ width: "100%" }}
              value={problem.module_id || undefined}
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
          <div style={{ flex: 2, minWidth: 220 }}>
            <FieldLabel>{labels("guideArticle")}</FieldLabel>
            <Select
              allowClear
              style={{ width: "100%" }}
              value={problem.article_id || undefined}
              onChange={(value: any) => set("article_id", value)}
              showSearch
              optionFilterProp="children"
            >
              {articles.map((a) => (
                <Select.Option key={a.article_id} value={a.article_id}>
                  {`#${a.article_id} ${a.title}`}
                </Select.Option>
              ))}
            </Select>
          </div>
        </Flex>
        <Flex gap={12} wrap margin="12px 0 0">
          <div>
            <FieldLabel>{labels("status")}</FieldLabel>
            <Radio.Group
              value={problem.problem_status}
              onChange={(e) => set("problem_status", e.target.value)}
            >
              <Radio.Button value="O">{labels("openProblem")}</Radio.Button>
              <Radio.Button value="F">{labels("fixedProblem")}</Radio.Button>
            </Radio.Group>
          </div>
          {problem.problem_status === "F" ? (
            <div>
              <FieldLabel>{labels("fixedRelease")}</FieldLabel>
              <Input
                style={{ width: 160 }}
                maxLength={20}
                value={problem.fixed_release}
                onChange={(e) => set("fixed_release", e.target.value)}
              />
            </div>
          ) : null}
        </Flex>
        <div style={{ marginTop: 12 }}>
          <FieldLabel>{labels("notes")}</FieldLabel>
          <Input.TextArea
            autoSize={{ minRows: 2, maxRows: 6 }}
            maxLength={1000}
            value={problem.notes}
            onChange={(e) => set("notes", e.target.value)}
          />
        </div>

        {problemId ? (
          <>
            <Divider titlePlacement="start">
              {labels("linkedTickets")} ({tickets.length})
            </Divider>
            <Flex margin="0 0 8px" gap={8}>
              <InputNumber
                style={{ width: 160 }}
                placeholder={labels("ticketNo")}
                value={linkTicket}
                onChange={(value) => setLinkTicket(value ? Number(value) : undefined)}
              />
              <Button
                icon={icon("link")}
                loading={linking}
                disabled={!linkTicket}
                onClick={() => linkTicket && onLink(linkTicket, "link")}
              >
                {labels("linkTicket")}
              </Button>
            </Flex>
            <ExsysTable
              rowKey="ticket_id"
              columns={ticketColumns}
              dataSource={tickets}
              onRowClick={(record) => navigate(ticketPath(record.ticket_id))}
            />
          </>
        ) : null}
      </Spin>
    </Modal>
  );
};

export default ProblemModal;
