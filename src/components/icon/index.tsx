/*
 * Icon - 23-11-2026 (React 19 / antd 6 move).
 *
 * OLD    : antd v3 had <Icon type="edit" />; antd 4+ removed it (one component
 *          per icon in @ant-design/icons).
 * NEW    : this small component keeps the same <Icon type="..." /> call, so the
 *          screens and the menu tables (icon: "bell") did not change.
 * REASON : the move to React 19 needs antd 6.
 * BENEFIT: one place lists the icons the app uses (only these are bundled).
 *          A new icon = one import + one line in ICONS.
 */
import React from "react";
import {
  AlertOutlined,
  BarChartOutlined,
  BellOutlined,
  BookOutlined,
  BulbOutlined,
  BulbFilled,
  CheckOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  ClusterOutlined,
  CustomerServiceOutlined,
  DashboardOutlined,
  DeleteOutlined,
  DislikeOutlined,
  DownOutlined,
  EditOutlined,
  ExportOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
  FileExcelOutlined,
  FlagOutlined,
  FrownOutlined,
  GlobalOutlined,
  KeyOutlined,
  LeftOutlined,
  LikeOutlined,
  LinkOutlined,
  LoadingOutlined,
  LockOutlined,
  LogoutOutlined,
  MergeCellsOutlined,
  PlusOutlined,
  PrinterOutlined,
  PlusCircleOutlined,
  PoweroffOutlined,
  ProfileOutlined,
  QuestionCircleOutlined,
  ReloadOutlined,
  RightOutlined,
  RobotOutlined,
  SafetyCertificateOutlined,
  SearchOutlined,
  SettingOutlined,
  ShareAltOutlined,
  ShopOutlined,
  SmileOutlined,
  SwapOutlined,
  TeamOutlined,
  ToolOutlined,
  UnlockOutlined,
  UpOutlined,
  UserOutlined,
  UserAddOutlined,
  WarningOutlined,
} from "@ant-design/icons";

const ICONS: { [type: string]: React.ComponentType<any> } = {
  "alert": AlertOutlined,
  "bar-chart": BarChartOutlined,
  "bell": BellOutlined,
  "book": BookOutlined,
  "bulb": BulbOutlined,
  "bulb-filled": BulbFilled,
  "check": CheckOutlined,
  "check-circle": CheckCircleOutlined,
  "clock-circle": ClockCircleOutlined,
  "close-circle": CloseCircleOutlined,
  "cluster": ClusterOutlined,
  "customer-service": CustomerServiceOutlined,
  "dashboard": DashboardOutlined,
  "delete": DeleteOutlined,
  "dislike": DislikeOutlined,
  "down": DownOutlined,
  "edit": EditOutlined,
  "export": ExportOutlined,
  "eye": EyeOutlined,
  "eye-invisible": EyeInvisibleOutlined,
  "file-excel": FileExcelOutlined,
  "flag": FlagOutlined,
  "frown": FrownOutlined,
  "global": GlobalOutlined,
  "key": KeyOutlined,
  "left": LeftOutlined,
  "like": LikeOutlined,
  "link": LinkOutlined,
  "loading": LoadingOutlined,
  "lock": LockOutlined,
  "logout": LogoutOutlined,
  "merge-cells": MergeCellsOutlined,
  "plus": PlusOutlined,
  "printer": PrinterOutlined,
  "plus-circle": PlusCircleOutlined,
  "poweroff": PoweroffOutlined,
  "profile": ProfileOutlined,
  "question-circle": QuestionCircleOutlined,
  "reload": ReloadOutlined,
  "right": RightOutlined,
  "robot": RobotOutlined,
  "safety-certificate": SafetyCertificateOutlined,
  "search": SearchOutlined,
  "setting": SettingOutlined,
  "share-alt": ShareAltOutlined,
  "shop": ShopOutlined,
  "smile": SmileOutlined,
  "swap": SwapOutlined,
  "team": TeamOutlined,
  "tool": ToolOutlined,
  "unlock": UnlockOutlined,
  "up": UpOutlined,
  "user": UserOutlined,
  "user-add": UserAddOutlined,
  "warning": WarningOutlined,
};

export interface IconProps extends React.HTMLAttributes<HTMLSpanElement> {
  type: string;
  spin?: boolean;
  rotate?: number;
}

const Icon = ({ type, ...rest }: IconProps) => {
  const Component = ICONS[type] || QuestionCircleOutlined;
  return <Component {...rest} />;
};

/* for antd props that take a node: <Button icon={icon("plus")} /> */
export const icon = (type: string) => <Icon type={type} />;

export default Icon;
