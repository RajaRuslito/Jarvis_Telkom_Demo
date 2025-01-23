import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import MainPage from "./pages/MainPage";
import Register from "./pages/Register";
import UserProfile from "./pages/UserProfile";
import JobMain from "./pages/JobMain";
import JobRequirement from "./pages/JobRequirement";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path='/register' element={<Register />} />
        <Route path='/' element={<Login />} />
        <Route path='/jobdesc' element={<MainPage />} />
        <Route path='/job' element={<JobMain />} />
        <Route path='/jobreq' element={<JobRequirement />} />
        <Route path='/profile' element={<UserProfile />} />
      </Routes>
    </Router>
  );
}
