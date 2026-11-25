/*
 * Layout primitives, the small set this app uses out of
 * `@app-structure/commons` in cure-plus-fe, with the same names.
 */
import styled, { css } from "styled-components";

export const Flex = styled.div<{
  column?: boolean;
  gap?: number;
  align?: string;
  justify?: string;
  wrap?: boolean;
  flex?: number | string;
  margin?: string;
  padding?: string;
  width?: string;
}>`
  display: flex;
  flex-direction: ${({ column }) => (column ? "column" : "row")};
  align-items: ${({ align }) => align || "center"};
  justify-content: ${({ justify }) => justify || "flex-start"};
  flex-wrap: ${({ wrap }) => (wrap ? "wrap" : "nowrap")};
  gap: ${({ gap }) => (gap === undefined ? 8 : gap)}px;
  ${({ flex }) => (flex !== undefined ? css`flex: ${flex};` : "")}
  ${({ margin }) => (margin ? css`margin: ${margin};` : "")}
  ${({ padding }) => (padding ? css`padding: ${padding};` : "")}
  ${({ width }) => (width ? css`width: ${width};` : "")}
`;

/*
 * 24-11-2026 (v2.2.2) - look closer to Cure+ (Khaled sent 3 Cure+ screens as reference:
 * Consent Template Process, Vitals Review, Nursing Hand Over)
 *   OLD    : grey sections with small corners, grey number boxes, dark page title
 *   NEW    : white cards with round corners, number cards with a coloured dot and a
 *            big number, page title in the EXSYS blue
 *   REASON : Khaled asked to improve the look
 *   BENEFIT: one look across Cure+ and the ticketing app; numbers read faster
 */
export const ShadowSection = styled.div<{ padding?: string }>`
  background: ${({ theme }) => theme.colors.background};
  border: 1px solid ${({ theme }) => theme.colors.desktopNavDivider};
  border-radius: 12px;
  padding: ${({ padding }) => padding || "14px 16px"};
  box-shadow: 0 2px 6px ${({ theme }) => theme.colors.shadow};
`;

export const PageTitle = styled.h2`
  margin: 0;
  font-size: 20px;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.primary};
`;

export const SubText = styled.span`
  color: ${({ theme }) => theme.colors.mutedText};
  font-size: 12px;
`;

export const FieldLabel = styled.div`
  color: ${({ theme }) => theme.colors.labelText};
  font-size: 12px;
  margin-bottom: 2px;
`;

export const FieldValue = styled.div`
  color: ${({ theme }) => theme.colors.text};
  font-size: 13px;
  font-weight: 500;
  word-break: break-word;
`;

/* number card: "(dot) label" on top, the big number under it (Cure+ status cards) */
export const StatBox = styled.div`
  background: ${({ theme }) => theme.colors.background};
  border: 1px solid ${({ theme }) => theme.colors.desktopNavDivider};
  border-radius: 12px;
  padding: 12px 16px;
  min-width: 160px;
  flex: 1;
  transition: border-color 0.2s, box-shadow 0.2s;

  &:hover {
    border-color: ${({ theme }) => theme.colors.primary};
    box-shadow: 0 2px 8px ${({ theme }) => theme.colors.shadow};
  }
  > span:first-child {
    display: flex;
    align-items: center;
    gap: 7px;
    font-size: 13px;
    color: ${({ theme }) => theme.colors.headingText};
  }
  > span:first-child::before {
    content: "";
    width: 9px;
    height: 9px;
    border-radius: 50%;
    flex-shrink: 0;
    background: ${({ theme }) => theme.colors.primary};
  }
`;

export const StatValue = styled.div`
  font-size: 30px;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.primary};
  line-height: 1.25;
  font-variant-numeric: tabular-nums;
`;
