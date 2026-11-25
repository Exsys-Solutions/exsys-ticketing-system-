/*
 * 23-11-2026 (React 19):
 *   OLD : ReactDOM.render + "antd/dist/antd.css"
 *   NEW : createRoot; antd 6 styles itself (CSS-in-JS), no css file to import
 *   moment -> dayjs (antd 6 dates); customParseFormat lets dayjs(value, "DD-MM-YYYY") work like moment
 */
import { createRoot } from "react-dom/client";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
dayjs.extend(customParseFormat);
import "./index.css";
import App from "./App";

createRoot(document.getElementById("root") as HTMLElement).render(<App />);
