/*
 * The three charts of the board.
 * 23-11-2026 (React 19): OLD chart.js 2.9 + react-chartjs-2 2.9 (do not run on React 19)
 *                        NEW chart.js 4 + react-chartjs-2 5. Same charts and colours;
 *                        the options moved to the v4 names (plugins.legend, scales.y, tension).
 *
 * The colours come from the theme's dashboardChartsColors, which is the same
 * ordered palette cure-plus-fe uses for dashboard slices.
 */
import React from "react";
import { Bar, Line, Pie } from "react-chartjs-2";
import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
} from "chart.js";

// chart.js 4 draws only the parts registered here (smaller bundle)
ChartJS.register(ArcElement, BarElement, CategoryScale, Legend, LinearScale, LineElement, PointElement, Tooltip);
import { useTheme } from "styled-components";
import { Flex, ShadowSection, SubText } from "../../../components/commons";
import { useLabels } from "../../../labels";

interface SliceType {
  name: string;
  value: number;
}

interface TrendType {
  day: string;
  opened: number;
  resolved: number;
}

// 24-11-2026 NEW    : the box every chart sits in
// REASON : chart.js follows the size of its box only when the box is position:relative and
//          holds nothing else; without it, on the iPad the daily chart kept the width of the first
//          paint (a small chart on one side of the card) until the language was changed
// BENEFIT: every chart fills its card on any screen and follows when the card changes size
export const ChartBox = ({ height, children }: { height: number; children: React.ReactNode }) => (
  <div style={{ position: "relative", width: "100%", minWidth: 0, height }}>{children}</div>
);

const Panel = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <ShadowSection padding="10px 14px" style={{ flex: 1, minWidth: 300 }}>
    <SubText>{title}</SubText>
    {/* OLD: <div style={{ height: 240 }}> */}
    <ChartBox height={240}>{children}</ChartBox>
  </ShadowSection>
);

const ChartsView = ({
  byStatus,
  byPriority,
  byModule,
  trend,
}: {
  byStatus: SliceType[];
  byPriority: SliceType[];
  byModule: SliceType[];
  trend: TrendType[];
}) => {
  const labels = useLabels();
  const theme = useTheme();
  const palette = theme.colors.dashboardChartsColors as unknown as string[];

  const options = {
    maintainAspectRatio: false,
    plugins: { legend: { position: "bottom" as const, labels: { boxWidth: 12 } } },
  };
  // whole numbers only on the value axis (was 0.2, 0.4 ...)
  const yWhole = { y: { beginAtZero: true, ticks: { precision: 0 } } };
  const noLegend = { ...options, plugins: { legend: { display: false } }, scales: yWhole };

  const slices = (rows: SliceType[]) => ({
    labels: rows.map((row) => row.name),
    datasets: [
      {
        data: rows.map((row) => row.value),
        backgroundColor: rows.map(
          (row, index) => palette[index % palette.length],
        ),
      },
    ],
  });

  return (
    <>
      <Flex gap={12} wrap align="stretch" margin="12px 0 0">
        <Panel title={labels("status")}>
          <Pie data={slices(byStatus)} options={options} />
        </Panel>
        <Panel title={labels("priority")}>
          <Bar
            data={slices(byPriority)}
            options={noLegend}
          />
        </Panel>
        <Panel title={labels("module")}>
          <Bar
            data={slices(byModule)}
            options={noLegend}
          />
        </Panel>
      </Flex>

      <ShadowSection padding="10px 14px" style={{ marginTop: 12 }}>
        <SubText>{labels("trend")}</SubText>
        {/* OLD: <div style={{ height: 260 }}> */}
        <ChartBox height={260}>
          <Line
            data={{
              labels: trend.map((row) => row.day),
              datasets: [
                {
                  label: labels("opened"),
                  data: trend.map((row) => row.opened),
                  borderColor: theme.colors.primary,
                  backgroundColor: "transparent",
                  tension: 0.25,
                },
                {
                  label: labels("resolvedLabel"),
                  data: trend.map((row) => row.resolved),
                  borderColor: theme.colors.success,
                  backgroundColor: "transparent",
                  tension: 0.25,
                },
              ],
            }}
            options={{ ...options, scales: yWhole }}
          />
        </ChartBox>
      </ShadowSection>
    </>
  );
};

export default ChartsView;
