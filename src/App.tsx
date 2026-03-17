import { createBrowserRouter, RouterProvider } from "react-router";
import PinGate from "./components/auth/PinGate";
import AppShell from "./components/layout/AppShell";
import TodayPage from "./pages/TodayPage";
import JournalPage from "./pages/JournalPage";
import SettingsPage from "./pages/SettingsPage";
import FinancePage from "./pages/FinancePage";
import YearOverviewPage from "./pages/YearOverviewPage";

const router = createBrowserRouter([
  {
    path: "/",
    Component: PinGate,
    children: [
      {
        Component: AppShell,
        children: [
          { index: true, Component: TodayPage },
          { path: "journal", Component: JournalPage },
          { path: "finance/year", Component: YearOverviewPage },
          { path: "finance", Component: FinancePage },
          { path: "settings", Component: SettingsPage },
        ],
      },
    ],
  },
]);

export default function App() {
  return <RouterProvider router={router} />;
}
