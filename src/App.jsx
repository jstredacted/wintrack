import { createBrowserRouter, RouterProvider } from "react-router";
import AppShell from "./components/layout/AppShell";
import TodayPage from "./pages/TodayPage";
import HistoryPage from "./pages/HistoryPage";
import JournalPage from "./pages/JournalPage";

const router = createBrowserRouter([
  {
    path: "/",
    Component: AppShell,
    children: [
      { index: true, Component: TodayPage },
      { path: "history", Component: HistoryPage },
      { path: "journal", Component: JournalPage },
    ],
  },
]);

export default function App() {
  return <RouterProvider router={router} />;
}
