import React, { useEffect, useState } from 'react'
import profile from '../assets/profile.png'
import logo from '../assets/logo.jpg'
import hamburger from '../assets/burger.jpg'
import arrow from '../assets/arrowdown.png'
import { useNavigate } from 'react-router-dom';

const UserProfile = () => {

    // sidebar collapsed
    const [collapsed, setCollapsed] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false); // State for dropdown toggle

    const [userName, setUserName] = useState("User");
    const [userRole, setUserRole] = useState("Role");

    const accountData = JSON.parse(localStorage.getItem("account"));

    const navigate = useNavigate();
    // account logged handle
    useEffect(() => {
        if (accountData) {
            console.log("Account Data:", accountData);
            setUserName(accountData.name);
            setUserRole(accountData.roles);
        } else {
            alert("No account data found. Please login!");
            navigate('/')
        }
    }, [accountData])

    const handleLogout = () => {
        localStorage.removeItem("account");
        navigate("/");
    };

    if (accountData) {
        console.log("Account Data:", accountData);
    } else {
        console.log("No account data found in localStorage");
        navigate('/')
    }


    return (
        <>
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
                    <div className="flex items-center cursor-pointer" onClick={() => navigate("/profile")}>
                        <img src={profile} alt="Profile" className="w-10 h-10 rounded-full object-cover" />
                        <div className="ml-2">
                            <p className="font-medium text-sm">{userName}</p>
                            <p className="text-gray-500 text-xs">{userRole}</p>
                        </div>
                    </div>

                    {/* Logout Button */}
                    <button onClick={handleLogout} className="text-red-600 text-sm font-medium border-l pl-4">
                        Log Out
                    </button>
                </div>
            </header>

            <div className={`transition-all duration-300 pt-16 my-6 ${collapsed ? "ml-0 w-full" : "ml-64 w-[calc(100%-16rem)]"}`}>
                {/* Sidebar */}
                <aside
                    className={`bg-gray-800 text-white overflow-hidden transition-all duration-300 my-8 fixed left-0 top-16 h-[calc(100vh-4rem)] p-4 
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
                                className={`w-4 h-4 transition-transform duration-300 ${menuOpen ? "rotate-180" : "rotate-0"
                                    }`}
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
                            className="mb-4 cursor-pointer text-l flex items-center p-2 font-bold rounded-md bg-blue-500"
                            onClick={() => navigate("/profile")}
                        >
                            PROFILE
                        </h3>
                    )}

                    {/* Section Divider */}
                    {!collapsed && <hr className="my-6 border-gray-600" />}

                    {/* Profile Section */}
                    {!collapsed && (
                        <h3
                            className="mb-4 cursor-pointer text-l flex items-center p-2 font-bold rounded-md hover:bg-blue-500 duration-300"
                            onClick={() => navigate("/dashboard")}
                        >
                            DASHBOARD
                        </h3>
                    )}
                </aside>

                {/* Profile Content */}
                <div className="w-full min-h-screen px-5 py-7">
                    <div className="flex gap-5">
                        <img src={profile} alt="Profile" />
                        <div className="flex flex-col justify-center">
                            <p className="text-3xl font-semibold">{userName}</p>
                            <p className="text-lg italic font-semibold text-gray-600">{userRole}</p>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}

export default UserProfile
