/*
 * The right-hand properties panel + the client / EXSYS-context card.
 * The server already hides the internal fields from a client user (they come
 * back null), so the screen only has to skip empty values.
 */
import React, { useState } from "react";
import { Alert, Divider, Select, Tag, message as antMessage } from "antd";
import { useTheme } from "styled-components";
import {
  FieldLabel,
  FieldValue,
  Flex,
  ShadowSection,
} from "../../../components/commons";
import {
  PriorityTag,
  SlaTag,
  StatusTag,
  usePriorityName,
} from "../../../components/ticket-bits";
import { useLabels } from "../../../labels";
import { useBasicMutation, useBasicQuery } from "../../../hooks";
import { TicketType } from "../index.interface";

const Field = ({ label, value }: { label: string; value?: any }) =>
  value === undefined || value === null || value === "" ? null : (
    <div style={{ marginBottom: 10 }}>
      <FieldLabel>{label}</FieldLabel>
      <FieldValue>{value}</FieldValue>
    </div>
  );

/*
 * 23-11-2026 NEW (script ETKT_13): the repeated problem of the ticket (staff).
 *   OLD    : PROBLEM_ID could be set by ticket_dml only, never cleared, and no screen had it.
 *   NEW    : a select of the problems; link / unlink through etk_kb_pkg/problem_link_dml
 *            (written in the ticket history).
 *   BENEFIT: repeated tickets are grouped under one problem from the ticket itself.
 */
const ProblemLink = ({
  ticket,
  onChanged,
}: {
  ticket: TicketType;
  onChanged?: () => void;
}) => {
  const labels = useLabels();
  const [problems, setProblems] = useState<any[]>([]);
  const { loading, runQuery } = useBasicQuery({
    apiId: "kbProblems",
    params: { poffset: 0, poffset_step: 500 },
    // 24-11-2026 OLD: loaded on focus  NEW: loaded with the screen (staff only)
    // REASON : the list opened empty ("No data") on the first click while it was loading
    // BENEFIT: the problems are there the first time the list opens
    callOnFirstRender: true,
    onResponse: ({ apiValues, error }) =>
      setProblems(!error && apiValues ? apiValues.data || [] : []),
  });
  const { loading: saving, mutate } = useBasicMutation({ apiId: "kbProblemLink" });

  const current = ticket.problem_id || undefined;
  const shown =
    current && !problems.some((p) => p.problem_id === current)
      ? [{ problem_id: current, title: "" }, ...problems]
      : problems;

  return (
    <div style={{ marginBottom: 10 }}>
      <FieldLabel>{labels("problem")}</FieldLabel>
      <Select
        allowClear
        showSearch
        optionFilterProp="children"
        style={{ width: "100%" }}
        loading={loading || saving}
        value={current}
        placeholder={labels("linkToProblem")}
        onChange={(value: any) =>
          mutate(
            {
              ticket_id: ticket.ticket_id,
              problem_id: value || null,
              action: value ? "link" : "unlink",
            },
            ({ error }) => {
              if (error) {
                antMessage.error(error);
              } else {
                antMessage.success(labels("saved"));
                if (onChanged) {
                  onChanged();
                }
              }
            },
          )
        }
      >
        {shown.map((p) => (
          <Select.Option key={p.problem_id} value={p.problem_id}>
            {`#${p.problem_id} ${p.title}`}
          </Select.Option>
        ))}
      </Select>
    </div>
  );
};

const PropertiesView = ({
  ticket,
  isStaff,
  onChanged,
}: {
  ticket: TicketType;
  isStaff: boolean;
  onChanged?: () => void;
}) => {
  const labels = useLabels();
  const theme = useTheme();
  const priorityName = usePriorityName();

  const hasContext =
    ticket.ctx_page_name || ticket.ctx_user_name || ticket.ctx_error;

  return (
    <div style={{ width: 300, flexShrink: 0 }}>
      <ShadowSection>
        <Flex gap={6} wrap margin="0 0 10px">
          <StatusTag
            statusName={ticket.status_name}
            openFlag={ticket.open_flag}
          />
          <PriorityTag
            // 24-11-2026 (v2.2.2) OLD: ticket.company_priority only
            // NEW: the client priority when the company one is not sent (script ETKT_18
            //      hides the company priority from a client), so the colour matches the name
            priority={ticket.company_priority || ticket.client_priority}
            // 23-11-2026 OLD: the number ("2")  NEW: the priority name
            priorityName={priorityName(
              ticket.company_priority || ticket.client_priority,
            )}
          />
          {ticket.contract_expired_flag === "Y" ? (
            <Tag color={theme.colors.warningDark}>
              {labels("contractExpired")}
            </Tag>
          ) : null}
        </Flex>

        <Field label={labels("client")} value={ticket.client_name} />
        <Field label={labels("branch")} value={ticket.branch_name} />
        <Field label={labels("module")} value={ticket.module_name} />
        <Field label={labels("type")} value={ticket.type_name} />
        <Field label={labels("createdBy")} value={ticket.created_by_name} />
        <Field label={labels("submittedDate")} value={ticket.submitted_date} />

        {isStaff ? (
          <>
            <Divider style={{ margin: "8px 0" }} />
            <Field label={labels("team")} value={ticket.team_name} />
            <Field label={labels("assignee")} value={ticket.assignee_name} />
            <Field
              label={labels("clientPriority")}
              value={priorityName(ticket.client_priority)}
            />
            <Field
              label={labels("companyPriority")}
              value={priorityName(ticket.company_priority)}
            />
            <Field label={labels("acceptDue")} value={ticket.accept_due_int} />
            <Field
              label={labels("resolveDue")}
              value={ticket.resolve_due_int}
            />
            <Field label={labels("escLevel")} value={ticket.esc_level} />
            <ProblemLink ticket={ticket} onChanged={onChanged} />
          </>
        ) : (
          <>
            <Divider style={{ margin: "8px 0" }} />
            {/* 24-11-2026 (v2.2.2) NEW: the client reads who works on his ticket
                (decision: the employee only, never the team or the company priority) */}
            <Field label={labels("assignee")} value={ticket.assignee_name} />
            <Field label={labels("acceptDue")} value={ticket.accept_due_ext} />
            <Field
              label={labels("resolveDue")}
              value={ticket.resolve_due_ext}
            />
          </>
        )}

        <Field label={labels("resolutionNote")} value={ticket.resolution_note} />
        <Field label={labels("blockReason")} value={ticket.block_reason} />
        <Field label={labels("cancelReason")} value={ticket.cancel_reason} />
        <Field label={labels("rating")} value={ticket.rating} />
      </ShadowSection>

      {hasContext && isStaff ? (
        <ShadowSection padding="10px 14px" style={{ marginTop: 12 }}>
          <FieldLabel style={{ fontWeight: 600 }}>
            {labels("exsysContext")}
          </FieldLabel>
          <Field label={labels("page")} value={ticket.ctx_page_name} />
          <Field label={labels("exsysUser")} value={ticket.ctx_user_name} />
          {ticket.ctx_error ? (
            <Alert type="error" title={ticket.ctx_error} />
          ) : null}
        </ShadowSection>
      ) : null}

      {ticket.merged_into_ticket_id ? (
        <Alert
          style={{ marginTop: 12 }}
          type="info"
          showIcon
          title={`${labels("mergeInto")} ${ticket.merged_into_ticket_id}`}
        />
      ) : null}

      <div style={{ marginTop: 12 }}>
        <SlaTag
          slaState={
            ticket.open_flag === "N"
              ? undefined
              : (ticket as any).sla_state
          }
        />
      </div>
    </div>
  );
};

export default PropertiesView;
