/*
 * Tabs - 23-11-2026 (React 19 / antd 6 move).
 *
 * OLD    : <Tabs><Tabs.TabPane tab=".." key="..">..</Tabs.TabPane></Tabs> (antd v3)
 * NEW    : antd 6 wants <Tabs items={[{ key, label, children }]} />. This wrapper
 *          turns the TabPane children into items, so the screens keep their
 *          readable JSX and antd gets the new form (no deprecation warning).
 * REASON : the move to React 19 needs antd 6.
 * BENEFIT: 11 screens did not have to be rewritten.
 */
import React from "react";
import { Tabs as AntdTabs } from "antd";
import type { TabsProps } from "antd";

export interface TabPaneProps {
  tab: React.ReactNode;
  disabled?: boolean;
  forceRender?: boolean;
  children?: React.ReactNode;
}

/* only carries its props; Tabs reads them */
const TabPane = (_props: TabPaneProps) => null;

const Tabs = ({ children, ...rest }: Omit<TabsProps, "items"> & { children?: React.ReactNode }) => {
  const items = React.Children.toArray(children)
    .filter((child): child is React.ReactElement<TabPaneProps> => React.isValidElement(child))
    .map((child) => ({
      // Children.toArray prefixes the key with ".$"
      key: String(child.key).replace(/^\.\$/, ""),
      label: child.props.tab,
      disabled: child.props.disabled,
      forceRender: child.props.forceRender,
      children: child.props.children,
    }));
  return <AntdTabs {...rest} items={items} />;
};

Tabs.TabPane = TabPane;

export default Tabs;
