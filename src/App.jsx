import { createBrowserRouter, RouterProvider } from "react-router";
import AppShell from "./components/layout/AppShell";
import TodayPage from "./pages/TodayPage";
import JournalPage from "./pages/JournalPage";
import SettingsPage from "./pages/SettingsPage";

const router = createBrowserRouter([
  {
    path: "/",
    Component: AppShell,
    children: [
      { index: true, Component: TodayPage },
      { path: "journal", Component: JournalPage },
      { path: "settings", Component: SettingsPage },
    ],
  },
]);

export default function App() {
  return <RouterProvider router={router} />;
}
