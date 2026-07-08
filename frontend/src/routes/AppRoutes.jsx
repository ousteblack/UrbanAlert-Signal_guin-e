import { Routes, Route } from "react-router-dom";

import Home from "../pages/Home";
import Dashboard from "../pages/Dashboard/Dashboard";
import ReportIncident from "../pages/Reports/ReportIncident";
import Login from "../pages/Auth/Login";
import MapExplorer from "../pages/Map/MapExplorer";
import ReportList from "../pages/Reports/ReportList";
import MyReports from "../pages/Reports/MyReports";
import ReportDetails from "../pages/Reports/ReportDetails";
import TermsOfService from "../pages/Legal/TermsOfService";
import PrivacyPolicy from "../pages/Legal/PrivacyPolicy";
import CookieManagement from "../pages/Legal/CookieManagement";
import Profile from "../pages/Profile/Profile";

import PrivateRoute from "./PrivateRoute";
import AdminRoute from "./AdminRoute";

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      
      {/* Routes Citoyen (Connecté) */}
      <Route path="/report" element={
        <PrivateRoute>
          <ReportIncident />
        </PrivateRoute>
      } />
      <Route path="/my-reports" element={
        <PrivateRoute>
          <MyReports />
        </PrivateRoute>
      } />
      <Route path="/profile" element={
        <PrivateRoute>
          <Profile />
        </PrivateRoute>
      } />
      
      {/* Routes Administrateur */}
      <Route path="/dashboard" element={
        <PrivateRoute>
          <Dashboard />
        </PrivateRoute>
      } />
      <Route path="/reports" element={
        <AdminRoute>
          <ReportList />
        </AdminRoute>
      } />
      <Route path="/reports/:id" element={
        <PrivateRoute>
          <ReportDetails />
        </PrivateRoute>
      } />
      <Route path="/map" element={
        <AdminRoute>
          <MapExplorer />
        </AdminRoute>
      } />

      {/* Routes Légales */}
      <Route path="/terms" element={<TermsOfService />} />
      <Route path="/privacy" element={<PrivacyPolicy />} />
      <Route path="/cookies" element={<CookieManagement />} />
    </Routes>
  );
}
