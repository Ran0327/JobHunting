import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Shell } from "./components/Shell";
import { Assistant } from "./pages/Assistant";
import { Community } from "./pages/Community";
import { Dashboard } from "./pages/Dashboard";
import { Favorites } from "./pages/Favorites";
import { Mine } from "./pages/Mine";
import { Interview } from "./pages/Interview";
import { JobDetail } from "./pages/JobDetail";
import { Jobs } from "./pages/Jobs";
import { ProfilePage } from "./pages/Profile";
import { Progress } from "./pages/Progress";
import { Resumes } from "./pages/Resumes";
import { AppProvider } from "./store";

export function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Shell />}>
            <Route index element={<Dashboard />} />
            <Route path="jobs" element={<Jobs />} />
            <Route path="jobs/:id" element={<JobDetail />} />
            <Route path="resumes" element={<Resumes />} />
            <Route path="assistant" element={<Assistant />} />
            <Route path="interview" element={<Interview />} />
            <Route path="favorites" element={<Favorites />} />
            <Route path="mine" element={<Mine />} />
            <Route path="community/notices" element={<Community />} />
            <Route path="community" element={<Community />} />
            <Route path="community/:id" element={<Community />} />
            <Route path="progress" element={<Progress />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
}
