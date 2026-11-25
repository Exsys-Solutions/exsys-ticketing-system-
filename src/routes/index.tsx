/*
 * Routing + the role guard.
 *
 * Rules (same table as the packages enforce server side):
 *   staff  (MGT / SUP / AGT / DEV) -> internal portal
 *   client (CLA / CLU)             -> client portal only
 * The server checks it too; this only keeps the UI honest.
 *
 * 23-11-2026 (React 19 / react-router 7):
 *   OLD    : <Switch>, <Route component={..} exact>, <Redirect>
 *   NEW    : <Routes>, <Route element={<.. />}> (always exact), <Navigate replace>
 *   REASON : react-router 5 does not support React 19.
 *   The routes and the role rules are the same as before.
 */
import React from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { PAGES_PATH_NAMES } from "./constants";
import { isManagement, isStaffUser, useAppConfig } from "../store";
import AppLayout from "../components/app-layout";
import LoginPage from "../pages/login-page";
import ChangePasswordPage from "../pages/change-password-page";
import DashboardPage from "../pages/dashboard-page";
import TicketsPage from "../pages/tickets-page";
import TicketDetailsPage from "../pages/ticket-details-page";
import EscalationPage from "../pages/escalation-page";
import NotificationsPage from "../pages/notifications-page";
import ClientsPage from "../pages/clients-page";
import ClientsSetupPage from "../pages/settings/clients-setup-page";
import UsersSetupPage from "../pages/settings/users-setup-page";
import TeamsSetupPage from "../pages/settings/teams-setup-page";
import SlaSetupPage from "../pages/settings/sla-setup-page";
import WorkflowSetupPage from "../pages/settings/workflow-setup-page";
import GeneralSetupPage from "../pages/settings/general-setup-page";
import ClientNewTicketPage from "../pages/client-portal/new-ticket-page";
import ClientMyTicketsPage from "../pages/client-portal/my-tickets-page";
import UserRequestsSetupPage from "../pages/settings/user-requests-page";
import ClientUserRequestsPage from "../pages/client-portal/user-requests-page";
import GuidePage from "../pages/guide-page";
import ProblemsPage from "../pages/problems-page";
import FaqPage from "../pages/faq-page";
import ClientHomePage from "../pages/client-portal/home-page";
import ClientDashboardPage from "../pages/client-portal/dashboard-page";
import ReportsPage from "../pages/reports-page";

type RouteRow = [boolean, string, React.ComponentType];

const AppRoutes = () => {
  const { authorization, user } = useAppConfig();

  if (!authorization || !user) {
    return (
      <Routes>
        <Route path={PAGES_PATH_NAMES.login} element={<LoginPage />} />
        <Route path="*" element={<Navigate to={PAGES_PATH_NAMES.login} replace />} />
      </Routes>
    );
  }

  // a user with the initial password can reach nothing but this screen,
  // because every other service answers -20803 until the password changes
  if (user.must_change_pwd_flag === "Y") {
    return (
      <Routes>
        <Route path={PAGES_PATH_NAMES.changePassword} element={<ChangePasswordPage />} />
        <Route
          path="*"
          element={<Navigate to={PAGES_PATH_NAMES.changePassword} replace />}
        />
      </Routes>
    );
  }

  const staff = isStaffUser(user);
  const management = isManagement(user);

  // [allowed, path, page] - same table as the old <Switch>
  const rows: RouteRow[] = [
    [true, PAGES_PATH_NAMES.changePassword, ChangePasswordPage],
    [staff, PAGES_PATH_NAMES.home, DashboardPage],
    [staff, PAGES_PATH_NAMES.tickets, TicketsPage],
    [staff, PAGES_PATH_NAMES.ticketDetails, TicketDetailsPage],
    [staff, PAGES_PATH_NAMES.escalation, EscalationPage],
    [staff, PAGES_PATH_NAMES.notifications, NotificationsPage],
    [staff, PAGES_PATH_NAMES.clients, ClientsPage],
    // 23-11-2026 (script ETKT_13): guide, repeated problems, FAQ
    [staff, PAGES_PATH_NAMES.guide, GuidePage],
    [staff, PAGES_PATH_NAMES.problems, ProblemsPage],
    [staff, PAGES_PATH_NAMES.faq, FaqPage],
    [!staff, PAGES_PATH_NAMES.clientFaq, FaqPage],
    // 23-11-2026 (script ETKT_14): client home and client statistics
    [!staff, PAGES_PATH_NAMES.clientHome, ClientHomePage],
    [!staff, PAGES_PATH_NAMES.clientDashboard, ClientDashboardPage],
    // 24-11-2026 (script ETKT_15): reports (the server checks each report right again)
    [staff, PAGES_PATH_NAMES.reports, ReportsPage],
    [!staff, PAGES_PATH_NAMES.clientReports, ReportsPage],
    // 24-11-2026 (v2.2.2) NEW: same notifications screen for the client
    // (OLD: staff only, so /notifications sent a client back to /portal)
    [!staff, PAGES_PATH_NAMES.clientNotifications, NotificationsPage],
    [management, PAGES_PATH_NAMES.setupClients, ClientsSetupPage],
    [management, PAGES_PATH_NAMES.setupUsers, UsersSetupPage],
    [management, PAGES_PATH_NAMES.setupTeams, TeamsSetupPage],
    [management, PAGES_PATH_NAMES.setupSla, SlaSetupPage],
    [management, PAGES_PATH_NAMES.setupWorkflow, WorkflowSetupPage],
    [management, PAGES_PATH_NAMES.setupGeneral, GeneralSetupPage],
    [management, PAGES_PATH_NAMES.setupUserRequests, UserRequestsSetupPage],
    // open to every client user on purpose: only the SERVER knows who
    // the client manager is, and it answers -20812 to anybody else
    [!staff, PAGES_PATH_NAMES.clientUserRequests, ClientUserRequestsPage],
    [!staff, PAGES_PATH_NAMES.clientNewTicket, ClientNewTicketPage],
    [!staff, PAGES_PATH_NAMES.clientMyTickets, ClientMyTicketsPage],
    [!staff, PAGES_PATH_NAMES.clientTicketDetails, TicketDetailsPage],
  ];

  return (
    <AppLayout>
      <Routes>
        {rows
          .filter(([allowed]) => allowed)
          .map(([, path, Page]) => (
            <Route key={path} path={path} element={<Page />} />
          ))}
        <Route
          path="*"
          element={
            <Navigate
              to={staff ? PAGES_PATH_NAMES.home : PAGES_PATH_NAMES.clientHome}
              replace
            />
          }
        />
      </Routes>
    </AppLayout>
  );
};

export default AppRoutes;
