import React, { useEffect, useState } from "react";
import { Doughnut, Bar } from "react-chartjs-2";
import {
    Chart as ChartJS,
    ArcElement,
    Tooltip,
    Legend,
    CategoryScale,
    LinearScale,
    BarElement,
} from "chart.js";
import axios from "axios";
import profile from '../assets/profile.png'
import logo from '../assets/logo.jpg'
import hamburger from '../assets/burger.jpg'
import arrow from '../assets/arrowdown.png'
import { useNavigate } from 'react-router-dom';
import { ToastContainer } from "react-toastify";

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

const Dashboard = () => {
    const [jobDescData, setJobDescData] = useState([]);
    const [jobData, setJobData] = useState([]);
    const [jobReqData, setJobReqData] = useState([]);
    const navigate = useNavigate();
    const [collapsed, setCollapsed] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false); // State for dropdown toggle


    useEffect(() => {
        const fetchJobDesc = async () => {
            try {
                const responses = await Promise.all([
                    axios.get("http://localhost:5000/jobdesc/ja"),
                    axios.get("http://localhost:5000/jobdesc/ms"),
                    axios.get("http://localhost:5000/jobdesc/jr"),
                    axios.get("http://localhost:5000/jobdesc/jpi"),
                ]);
                // Flatten the array of arrays
                setJobDescData(responses.flatMap((res) => res.data));
            } catch (error) {
                console.error("Error fetching job descriptions:", error);
            }
        };
    
        const fetchJobs = async () => {
            try {
                const responses = await Promise.all([
                    axios.get("http://localhost:5000/job/cj"),
                    axios.get("http://localhost:5000/job/mj"),
                ]);
                setJobData(responses.flatMap((res) => res.data));
            } catch (error) {
                console.error("Error fetching jobs:", error);
            }
        };
    
        const fetchJobReq = async () => {
            try {
                const responses = await Promise.all([
                    axios.get("http://localhost:5000/jobreq/tc"),
                    axios.get("http://localhost:5000/jobreq/dlc"),
                    axios.get("http://localhost:5000/jobreq/jp"),
                    axios.get("http://localhost:5000/jobreq/vb"),
                ]);
                setJobReqData(responses.flatMap((res) => res.data));
            } catch (error) {
                console.error("Error fetching job requests:", error);
            }
        };
    
        fetchJobDesc();
        fetchJobs();
        fetchJobReq();
    }, []);
    

    const handleLogout = () => {
        localStorage.removeItem("account");
        navigate("/");
    };

    // account logged handle
    const accountData = JSON.parse(localStorage.getItem("account"));

    if (accountData) {
        console.log("Account Data:", accountData);
    } else {
        console.log("No account data found in localStorage");
        navigate('/')
    }


    const jobDescCount = jobDescData.length;
    const jobCount = jobData.length;
    const jobReqCount = jobReqData.length;

    const doughnutData = {
        labels: ["Job Descriptions", "Jobs", "Job Requirements"],
        datasets: [
            {
                data: [jobDescCount, jobCount, jobReqCount],
                backgroundColor: ["#FF6384", "#36A2EB", "#FFCE56"],
            },
        ],
    };

    const barData = {
        labels: [
            "Jan", "Feb", "Mar", "Apr", "May", "Jun",
            "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
        ],
        datasets: [
            {
                label: "Jobs Created",
                data: Array(12)
                    .fill(0)
                    .map((_, i) =>
                        jobData.filter(
                            (job) => new Date(job.created_at).getMonth() === i
                        ).length
                    ),
                backgroundColor: "#36A2EB",
            },
        ],
    };

    return (
        <>
            <ToastContainer />
            {/* Header */}
            <header className="bg-white shadow flex items-center justify-between py-4 px-6 fixed top-0 left-0 right-0 z-50">
                <div className="flex items-center space-x-4">
                    {/* Hamburger Button */}
                    <button onClick={() => setCollapsed(!collapsed)} className="focus:outline-none">
                        <img src={hamburger} alt="Menu" className="w-10 h-10 cursor-pointer" />
                    </button>

                    {/* Logo */}
                    <h1 className="text-2xl font-bold cursor-pointer" onClick={() => navigate("/jobdesc")}>
                        <img src={logo} alt="logo" className="w-21 h-16 object-cover" />
                    </h1>
                </div>

                {/* Right: User Info */}
                <div className="flex items-center space-x-4">
                    {/* Profile Info */}
                    <div
                        className="flex items-center cursor-pointer"
                        onClick={() => window.location.href = "/profile"}
                    >
                        <img
                            src={profile}
                            alt="Profile"
                            className="w-10 h-10 rounded-full object-cover"
                        />
                        <div className="ml-2">
                            <p className="font-medium text-sm">{accountData?.name || "Name"}</p>
                            <p className="text-gray-500 text-xs">{accountData?.roles || "Role"}</p>
                        </div>
                    </div>

                    {/* Logout Button */}
                    <button onClick={handleLogout} className="text-red-600 text-sm font-medium border-l pl-4">
                        Log Out
                    </button>
                </div>
            </header>

            {/* Main Container with Margin on Both Sides */}
            <div className={`px-6 bg-gray-100 min-h-screen transition-all duration-300 mx-6 mt-20 py-4 
                                ${collapsed ? "ml-0 w-full" : "ml-64 w-[calc(100%-16rem)]"}`}>

                {/* Sidebar */}
                <aside
                    className={`bg-gray-800 text-white overflow-hidden transition-all duration-300 my-8 h-screen p-4 fixed left-0 top-16 h-[calc(100vh-4rem)] 
                      ${collapsed ? "w-0 overflow-hidden opacity-0 pointer-events-none" : "w-64 opacity-100"}`}
                >
                    {/* Sidebar Main Title (Dropdown Toggle) */}
                    {!collapsed && (
                        <h3
                            className="text-white font-bold text-l mb-4 cursor-pointer flex justify-between items-center p-2 rounded-md hover:bg-blue-500 duration-300"
                            onClick={() => setMenuOpen(!menuOpen)}
                        >
                            MANAGE DJM
                            <img
                                src={arrow}
                                alt="Toggle Arrow"
                                className={`w-4 h-4 transition-transform duration-300 ${menuOpen ? "rotate-180" : "rotate-0"}`}
                            />
                        </h3>
                    )}

                    {/* Navigation Links - Dropdown */}
                    {menuOpen && !collapsed && (
                        <nav>
                            <ul className="space-y-3 pl-4">
                                <li
                                    className="cursor-pointer text-lg flex items-center p-2 rounded-md hover:bg-blue-500 duration-300"
                                    onClick={() => navigate("/jobdesc")}
                                >
                                    <span>Job Desc</span>
                                </li>
                                <li
                                    className="cursor-pointer text-lg flex items-center p-2 rounded-md hover:bg-blue-500 duration-300"
                                    onClick={() => navigate("/job")}
                                >
                                    <span>Job</span>
                                </li>
                                <li
                                    className="cursor-pointer text-lg flex items-center p-2 rounded-md hover:bg-blue-500 duration-300"
                                    onClick={() => navigate("/jobreq")}
                                >
                                    <span>Job Req</span>
                                </li>
                            </ul>
                        </nav>
                    )}

                    {/* Section Divider */}
                    {!collapsed && <hr className="my-6 border-gray-600" />}

                    {/* Profile Section */}
                    {!collapsed && (
                        <h3
                            className="mb-4 cursor-pointer text-l flex items-center p-2 font-bold rounded-md hover:bg-blue-500 duration-300"
                            onClick={() => navigate("/profile")}
                        >
                            PROFILE
                        </h3>
                    )}

                    {/* Section Divider */}
                    {!collapsed && <hr className="my-6 border-gray-600" />}

                    {/* Dashboard Section */}
                    {!collapsed && (
                        <h3
                            className="mb-4 cursor-pointer text-l flex items-center p-2 font-bold rounded-md bg-blue-500"
                            onClick={() => navigate("/dashboard")}
                        >
                            DASHBOARD
                        </h3>
                    )}
                </aside>

                <h1 className="text-2xl py-6 font-bold mb-2">Job Management Dashboard</h1>

                {/* Job Data Overview Section */}
                <div className="bg-white shadow-md rounded-lg p-6 mb-6">
                    <h2 className="text-xl font-semibold mb-4">Job Data Overview</h2>
                    <div className="flex justify-center gap-6 items-center">

                        {/* Doughnut Chart */}
                        <div className="w-1/3 flex justify-center">
                            <Doughnut
                                data={doughnutData}
                                options={{ plugins: { legend: { position: "top" } } }}
                                style={{ maxWidth: "300px", maxHeight: "300px" }}
                            />
                        </div>

                        {/* Total Jobs */}
                        <div className="text-left">
                            <h3 className="text-lg font-semibold">Total Job Statistics:</h3>
                            <p className="text-2xl font-bold text-green-600">
                                {jobDescCount + jobCount + jobReqCount} Total Jobs
                            </p>
                            <h2 className="mt-5 text-lg">Job Descriptions:</h2>
                            <p className="text-lg font-bold text-[#FF6384]">
                                {jobDescCount} Job Descriptions
                            </p>
                            <h2 className="text-lg">Job Creations:</h2>
                            <p className="text-lg font-bold text-[#36A2EB]">
                                {jobCount} Job Creations
                            </p>
                            <h2 className="text-lg">Job Requirements:</h2>
                            <p className="text-lg font-bold text-[#FFCE56]">
                                {jobReqCount} Job Requirements
                            </p>
                        </div>
                    </div>
                </div>

                {/* Jobs Created Per Month Section */}
                <div className="bg-white shadow-md rounded-lg p-6">
                    <h2 className="text-xl font-semibold mb-4">Jobs Created Per Month</h2>
                    <div className="max-w-3xl mx-auto">
                        <Bar
                            data={barData}
                            options={{
                                responsive: true,
                                plugins: {
                                    legend: { position: "top" },
                                },
                            }}
                        />
                    </div>
                </div>
            </div>

        </>
    );
};

export default Dashboard;
