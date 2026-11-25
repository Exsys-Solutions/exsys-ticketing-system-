/*
 * Small pieces shared by the statistics screens (23-11-2026, script ETKT_14):
 *   KpiTiles   - the number tiles; the server sends code / value / kind and the
 *                label comes from the screen texts (kpi_<code>), so it is in the
 *                user's language
 *   BarList    - "name ---- 12" rows, like the prototype boards
 *   PeriodBar  - week / month / 3 months / year / from-to, gives back from & to
 *   IdxTag     - 1.4x "higher than expected" / normal / lower, from idx_flag
 */
import React from "react";
import { DatePicker, Radio, Tag } from "antd";
import dayjs, { Dayjs } from "dayjs";
import styled, { useTheme } from "styled-components";
import { Flex, SubText } from "../commons";
import { useLabels } from "../../labels";

export interface KpiType {
  code: string;
  value: number | null;
  kind: "count" | "pct" | "hours" | "rating";
}

export type Tone = "good" | "warn" | "crit" | undefined;

const Tiles = styled.div`
  display: grid;
  gap: 10px;
  grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
`;

/*
 * 24-11-2026 (v2.2.2) - Cure+ status card
 *   OLD    : coloured side border, the number first then a grey label
 *   NEW    : "(dot) label" first, then the big number in the tone colour
 *   REASON : Khaled asked for a better look (Cure+ screens as reference)
 *   BENEFIT: the colour is on the number itself, the eye finds the bad ones first
 */
const toneColor = (theme: any, tone?: Tone) =>
  tone === "crit"
    ? theme.colors.error
    : tone === "warn"
    ? theme.colors.warningDark
    : tone === "good"
    ? theme.colors.success
    : theme.colors.primary;

const Tile = styled.div<{ $tone?: Tone }>`
  background: ${({ theme }) => theme.colors.background};
  border: 1px solid ${({ theme }) => theme.colors.desktopNavDivider};
  border-radius: 12px;
  padding: 12px 16px;
  display: flex;
  flex-direction: column-reverse;
  justify-content: flex-end;
  transition: border-color 0.2s, box-shadow 0.2s;

  &:hover {
    border-color: ${({ theme, $tone }) => toneColor(theme, $tone)};
    box-shadow: 0 2px 8px ${({ theme }) => theme.colors.shadow};
  }
  b {
    display: block;
    font-size: 30px;
    line-height: 1.25;
    font-variant-numeric: tabular-nums;
    color: ${({ theme, $tone }) => toneColor(theme, $tone)};
  }
  span {
    display: flex;
    align-items: center;
    gap: 7px;
    color: ${({ theme }) => theme.colors.headingText};
    font-size: 13px;
  }
  span::before {
    content: "";
    width: 9px;
    height: 9px;
    border-radius: 50%;
    flex-shrink: 0;
    background: ${({ theme, $tone }) => toneColor(theme, $tone)};
  }
`;

export const useKpiText = () => {
  const labels = useLabels();
  return (kpi: KpiType) => {
    if (kpi.value === null || kpi.value === undefined) {
      return "—";
    }
    if (kpi.kind === "pct") {
      return `${kpi.value}%`;
    }
    if (kpi.kind === "hours") {
      return `${kpi.value} ${labels("hoursShort")}`;
    }
    return String(kpi.value);
  };
};

export const KpiTiles = ({
  kpis,
  tone,
}: {
  kpis: KpiType[];
  tone?: (kpi: KpiType) => Tone;
}) => {
  const labels = useLabels();
  const text = useKpiText();
  return (
    <Tiles>
      {kpis.map((kpi) => (
        <Tile key={kpi.code} $tone={tone ? tone(kpi) : undefined}>
          <b dir="ltr" style={{ textAlign: "start" }}>
            {text(kpi)}
          </b>
          <span>{labels(`kpi_${kpi.code}`)}</span>
        </Tile>
      ))}
    </Tiles>
  );
};

const Bars = styled.div`
  display: flex;
  flex-direction: column;
  gap: 7px;
  .row {
    display: grid;
    grid-template-columns: minmax(70px, 42%) minmax(50px, 1fr) 40px;
    gap: 8px;
    align-items: center;
    font-size: 13px;
  }
  .track {
    height: 10px;
    background: ${({ theme }) => theme.colors.surfaceSoft};
    border-radius: 5px;
    overflow: hidden;
  }
  .track i {
    display: block;
    height: 100%;
    border-radius: 5px;
  }
  .value {
    font-variant-numeric: tabular-nums;
    text-align: end;
  }
`;

export interface BarRow {
  key?: string | number;
  name: string;
  value: number;
}

export const BarList = ({ rows, color }: { rows: BarRow[]; color?: string }) => {
  const labels = useLabels();
  const theme = useTheme();
  const max = Math.max(1, ...rows.map((row) => Number(row.value) || 0));
  if (!rows.length) {
    return <SubText>{labels("noData")}</SubText>;
  }
  return (
    <Bars>
      {rows.map((row, index) => (
        <div className="row" key={`${row.key ?? row.name}-${index}`}>
          <span>{row.name || "—"}</span>
          <div className="track">
            <i
              style={{
                width: `${((Number(row.value) || 0) / max) * 100}%`,
                background: color || theme.colors.primary,
              }}
            />
          </div>
          <b className="value">{row.value}</b>
        </div>
      ))}
    </Bars>
  );
};

export const DATE_FORMAT = "YYYY-MM-DD";

export const PERIOD_DAYS: { [key: string]: number } = { w: 6, m: 29, q: 89, y: 364 };

export const periodRange = (key: string): [Dayjs, Dayjs] => [
  dayjs().subtract(PERIOD_DAYS[key] ?? 29, "days"),
  dayjs(),
];

export const PeriodBar = ({
  period,
  range,
  onChange,
}: {
  period: string;
  range: [Dayjs, Dayjs];
  onChange: (period: string, range: [Dayjs, Dayjs]) => void;
}) => {
  const labels = useLabels();
  return (
    <Flex gap={10} wrap justify="space-between">
      <Flex gap={10} wrap>
        <Radio.Group
          value={period}
          buttonStyle="solid"
          onChange={(event) => {
            const key = event.target.value;
            onChange(key, key === "c" ? range : periodRange(key));
          }}
        >
          <Radio.Button value="w">{labels("periodWeek")}</Radio.Button>
          <Radio.Button value="m">{labels("periodMonth")}</Radio.Button>
          <Radio.Button value="q">{labels("period3Months")}</Radio.Button>
          <Radio.Button value="y">{labels("periodYear")}</Radio.Button>
          <Radio.Button value="c">{labels("periodCustom")}</Radio.Button>
        </Radio.Group>
        {period === "c" ? (
          <DatePicker.RangePicker
            format={DATE_FORMAT}
            value={range}
            allowClear={false}
            onChange={(dates) => {
              if (dates && dates[0] && dates[1]) {
                onChange("c", [dates[0], dates[1]]);
              }
            }}
          />
        ) : null}
      </Flex>
      <SubText dir="ltr">
        {range[0].format("DD/MM/YYYY")} - {range[1].format("DD/MM/YYYY")}
      </SubText>
    </Flex>
  );
};

/* 1.4x + higher / normal / lower than expected, from the server's flag */
export const IdxTag = ({
  value,
  flag,
  kind = "client",
}: {
  value: number | null;
  flag?: string;
  kind?: "client" | "team";
}) => {
  const labels = useLabels();
  if (value === null || value === undefined) {
    return <>—</>;
  }
  const text =
    flag === "H"
      ? labels(kind === "team" ? "loadHigh" : "idxHigh")
      : flag === "L"
      ? labels(kind === "team" ? "loadLow" : "idxLow")
      : labels(kind === "team" ? "loadNormal" : "idxNormal");
  const color = flag === "H" ? "red" : flag === "L" ? "green" : "blue";
  return (
    <Flex gap={6}>
      <span dir="ltr">{Number(value).toFixed(1)}×</span>
      <Tag color={color}>{text}</Tag>
    </Flex>
  );
};
