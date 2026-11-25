/*
 * The small pieces every ticket screen repeats: status tag, priority bar,
 * SLA tag, sentiment icon. Kept together so the colors are decided once.
 */
import React from "react";
import { Tag, Tooltip } from "antd";
import styled, { useTheme } from "styled-components";
import { useLabels } from "../../labels";
import { useLookups } from "../../hooks";
import Icon from "../icon";

/* 23-11-2026 NEW: priority number -> its name from lookups (was shown as a bare number) */
export const usePriorityName = () => {
  const { lookups } = useLookups();
  return (priority?: number | string) => {
    if (priority === null || priority === undefined || priority === "") {
      return "";
    }
    const found = lookups.priorities.find(
      (item) => String(item.key) === String(priority),
    );
    return found ? found.value : String(priority);
  };
};

/* company priority 1..5 -> the colored bar on the ticket card */
const PRIORITY_COLORS: { [key: number]: string } = {
  1: "error",
  2: "accentOrange",
  3: "warning",
  4: "primary",
  5: "mutedText",
};

export const PriorityBar = styled.span<{ priority?: number }>`
  display: inline-block;
  width: 4px;
  align-self: stretch;
  min-height: 16px;
  border-radius: 2px;
  background: ${({ theme, priority }) =>
    (theme.colors as any)[PRIORITY_COLORS[priority || 5]] ||
    theme.colors.mutedText};
`;

const StatusPill = styled.span<{ $closed?: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 2px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
  color: ${({ theme, $closed }) =>
    $closed ? theme.colors.success : theme.colors.primary};
  background: ${({ theme, $closed }) =>
    $closed ? theme.colors.successBackground : theme.colors.infoBackground};

  &::before {
    content: "";
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: currentColor;
  }
`;

export const StatusTag = ({
  statusName,
  openFlag,
}: {
  statusName?: string;
  openFlag?: string;
}) => {
  if (!statusName) {
    return null;
  }
  // 24-11-2026 (v2.2.2) OLD: a solid antd Tag  NEW: the Cure+ status pill "(dot) name"
  // REASON: better look (Cure+ screens as reference)  BENEFIT: lighter lists, same colours
  return <StatusPill $closed={openFlag === "N"}>{statusName}</StatusPill>;
};

export const PriorityTag = ({
  priority,
  priorityName,
}: {
  priority?: number;
  priorityName?: string;
}) => {
  const theme = useTheme();
  if (!priorityName) {
    return null;
  }
  const colorKey = PRIORITY_COLORS[priority || 5];
  return (
    <Tag color={(theme.colors as any)[colorKey] || theme.colors.mutedText}>
      {priorityName}
    </Tag>
  );
};

/* sla_state comes from etk_util_pkg.sla_state: late | near | ok */
export const SlaTag = ({ slaState }: { slaState?: string }) => {
  const theme = useTheme();
  const labels = useLabels();

  if (!slaState) {
    return null;
  }

  if (slaState === "late") {
    return <Tag color={theme.colors.error}>{labels("slaLate")}</Tag>;
  }
  if (slaState === "near") {
    return <Tag color={theme.colors.warningDark}>{labels("slaNear")}</Tag>;
  }
  return <Tag color={theme.colors.success}>{labels("slaOk")}</Tag>;
};

/*
 * 24-11-2026 (v2.2.2) FIX
 *   OLD    : A = angry, H = happy - codes the server never sends, so the angry
 *            face was never drawn in the tickets list; tooltip in English only
 *   NEW    : G = angry, N = neutral, P = pleased (ETK_TICKET.SENTIMENT), tooltip
 *            from the screen texts
 *   BENEFIT: the agent sees the angry client in the list, in his language
 */
export const SentimentIcon = ({ sentiment }: { sentiment?: string }) => {
  const theme = useTheme();
  const labels = useLabels();

  if (sentiment === "G") {
    return (
      <Tooltip title={labels("viewAngry")}>
        <Icon type="frown" style={{ color: theme.colors.error }} />
      </Tooltip>
    );
  }
  if (sentiment === "P") {
    return <Icon type="smile" style={{ color: theme.colors.success }} />;
  }
  return null;
};
