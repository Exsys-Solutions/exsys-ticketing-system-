/*
 * One ticket.
 *
 * GET etk_ticket_pkg/ticket_data?ticket_id=..  returns the whole screen in one
 * call: data, messages, history, attachments, next_statuses, assignees and
 * other_viewers. other_viewers is the collision alert: it is the people the
 * server saw open this ticket, so two agents do not answer at once.
 *
 * The same screen serves the client portal: the server strips the internal
 * fields and the internal notes for a client user, so there is no second copy
 * of this screen to keep in step.
 */
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Alert, Spin } from "antd";

import { useParams } from "react-router-dom";
import {
  Flex,
  PageTitle,
  ShadowSection,
  SubText,
} from "../../components/commons";
import { useBasicQuery } from "../../hooks";
import { isStaffUser, useAppConfig } from "../../store";
import { useLabels } from "../../labels";
import PropertiesView from "./partials/PropertiesView";
import ConversationView from "./partials/ConversationView";
import ActionsBar from "./partials/ActionsBar";
import HistoryView from "./partials/HistoryView";
import { TicketPayloadType } from "./index.interface";
import Icon from "../../components/icon";
import Tabs from "../../components/tabs";

const EMPTY: TicketPayloadType = {
  data: [],
  messages: [],
  history: [],
  attachments: [],
  next_statuses: [],
  assignees: [],
  other_viewers: [],
};

const TicketDetailsPage = () => {
  const labels = useLabels();
  const { ticketId } = useParams<{ ticketId: string }>();
  const { user } = useAppConfig();
  const [payload, setPayload] = useState<TicketPayloadType>(EMPTY);

  const staff = isStaffUser(user);
  const supervisorOrManagement =
    user?.role === "SUP" || user?.role === "MGT";

  const { loading, runQuery } = useBasicQuery<TicketPayloadType>({
    apiId: "ticket",
    params: { ticket_id: ticketId },
    callOnFirstRender: true,
    onResponse: ({ apiValues, error }) => {
      setPayload(!error && apiValues ? { ...EMPTY, ...apiValues } : EMPTY);
    },
  });

  const reload = useCallback(() => {
    runQuery({ ticket_id: ticketId });
  }, [runQuery, ticketId]);

  // 24-11-2026 NEW    : another ticket number in the address loads that ticket
  // REASON : the screen stays mounted when only :ticketId changes (back / forward between
  //          two tickets), so it kept showing the first ticket while the actions used the new number
  // BENEFIT: the ticket shown is always the ticket in the address
  const shownIdRef = useRef(ticketId);
  useEffect(() => {
    if (shownIdRef.current === ticketId) {
      return;
    }
    shownIdRef.current = ticketId;
    setPayload(EMPTY);
    runQuery({ ticket_id: ticketId });
  }, [ticketId, runQuery]);

  const ticket = payload.data[0];

  if (loading && !ticket) {
    return <Spin description={labels("loading")} />;
  }

  if (!ticket) {
    return <Alert type="warning" title={labels("noData")} showIcon />;
  }

  return (
    <>
      <Flex justify="space-between" margin="0 0 12px" wrap>
        <div>
          <PageTitle>
            #{ticket.ticket_id} — {ticket.title}
          </PageTitle>
          <SubText>
            {ticket.client_name} · {ticket.module_name}
          </SubText>
        </div>
      </Flex>

      {payload.other_viewers.length ? (
        <Alert
          type="warning"
          showIcon
          icon={<Icon type="eye" />}
          style={{ marginBottom: 12 }}
          title={payload.other_viewers
            .map((viewer) => viewer.user_name)
            .join(", ")}
        />
      ) : null}

      {/* 24-11-2026 OLD: no wrap, minWidth 0 - on a narrow window the conversation shrank
          to one word per line next to the 300px properties panel
          NEW: wrap, the conversation keeps at least 320px and the panel goes under it */}
      <Flex align="flex-start" gap={14} wrap>
        <div style={{ flex: 1, minWidth: 320 }}>
          {/* 24-11-2026 (v2.2.2) OLD: the actions card was always drawn
              NEW: only when it has a button (staff, or a client with a next status)
              REASON: a client saw an empty white card above the conversation */}
          {staff || payload.next_statuses.length ? (
            <ShadowSection style={{ marginBottom: 12 }}>
              <ActionsBar
                ticket={ticket}
                nextStatuses={payload.next_statuses}
                isStaff={staff}
                isSupervisorOrManagement={!!supervisorOrManagement}
                onDone={reload}
              />
            </ShadowSection>
          ) : null}

          <ShadowSection>
            <Tabs defaultActiveKey="conversation">
              <Tabs.TabPane
                tab={labels("conversation")}
                key="conversation"
              >
                {/* 23-11-2026 OLD: the description was shown here AND as the
                    first message (the server saves it as the first message).
                    NEW: shown here only when no message carries it. */}
                {payload.messages.some(
                  (item) => (item.body || "").trim() === (ticket.description || "").trim(),
                ) ? null : (
                  <div style={{ marginBottom: 14 }}>
                    <SubText>{labels("description")}</SubText>
                    <div style={{ whiteSpace: "pre-wrap" }}>
                      {ticket.description}
                    </div>
                  </div>
                )}

                <ConversationView
                  ticketId={ticket.ticket_id}
                  messages={payload.messages}
                  isStaff={staff}
                  canWrite={ticket.open_flag !== "N"}
                  onSent={reload}
                  // 24-11-2026 (v2.2.2) NEW: no "Reply to client" on an internal task
                  internal={ticket.internal_flag === "Y"}
                  // 24-11-2026 NEW: the canned reply {placeholders} (see ConversationView)
                  fillValues={{
                    name: ticket.created_by_name,
                    ticket: ticket.ticket_id,
                    ticket_id: ticket.ticket_id,
                    client: ticket.client_name,
                    branch: ticket.branch_name,
                    module: ticket.module_name,
                    title: ticket.title,
                  }}
                />
              </Tabs.TabPane>

              {staff ? (
                <Tabs.TabPane tab={labels("history")} key="history">
                  <HistoryView history={payload.history} />
                </Tabs.TabPane>
              ) : null}
            </Tabs>
          </ShadowSection>
        </div>

        {/* 23-11-2026: onChanged - the problem link reloads the ticket */}
        <PropertiesView ticket={ticket} isStaff={staff} onChanged={reload} />
      </Flex>
    </>
  );
};

export default TicketDetailsPage;
