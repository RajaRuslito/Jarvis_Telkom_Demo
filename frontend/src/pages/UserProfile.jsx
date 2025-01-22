import React, { useEffect, useState } from 'react'
import profile from '../assets/profile.png'
import { useNavigate } from 'react-router-dom';

const UserProfile = () => {

    // sidebar collapsed
    const [collapsed, setCollapsed] = useState(false);

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
            navigate('/login')
        }
    }, [accountData])

    const handleLogout = () => {
        localStorage.removeItem("account");
        navigate("/login");
    };

    if (accountData) {
        console.log("Account Data:", accountData);
    } else {
        console.log("No account data found in localStorage");
        navigate('/login')
    }


    return (
        <>
            <header className="bg-white shadow flex items-center justify-between py-4 px-6">
                {/* Left: Title */}
                <h1
                    className="text-2xl font-bold cursor-pointer"
                    onClick={() => (window.location.href = "/jobdesc")}
                >
                    Jarvis Demo
                </h1>
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
                    <button
                        onClick={handleLogout}
                        className="text-red-600 text-sm font-medium border-l pl-4"
                    >
                        Log Out
                    </button>
                </div>
            </header>
            <div className='flex'>
                {/* Sidebar */}
                <aside
                    className={`bg-gray-800 text-white ${collapsed ? 'w-16' : 'w-64'} transition-all duration-300 h-screen p-4`}
                    onMouseEnter={() => setCollapsed(false)}
                    onMouseLeave={() => setCollapsed(true)}
                >
                    <nav>
                    <ul className="space-y-4">
                        <li
                            className={`cursor-pointer flex items-center p-2 rounded-md hover:bg-blue-500 duration-300`}
                            onClick={() => window.location.href = "/jobdesc"}
                        >
                            {!collapsed && <span className="ml-4">Job Desc</span>}
                        </li>
                        <li
                            className={`cursor-pointer flex items-center p-2 rounded-md hover:bg-blue-500 duration-300`}
                            onClick={() => window.location.href = "/job"}
                        >
                            {!collapsed && <span className="ml-4">Job</span>}
                        </li>
                        <li className={`cursor-pointer flex items-center p-2 rounded-md bg-blue-500`}
                            onClick={() => window.location.href = "/profile"}
                        >
                            {!collapsed && <span className="ml-4">Profile</span>}
                        </li>
                        </ul>
                    </nav>
                </aside>

                {/* Profile */}
                <div className='w-full min-h-screen px-5 py-7'>
                    <div className='flex gap-5'>
                        <img src={profile} alt="" />
                        <div className='flex flex-col justify-center'>
                            <p className='text-3xl font-semibold'>{userName}</p>
                            <p className='text-lg italic font-semibold text-gray-600'>{userRole}</p>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}

export default UserProfile
