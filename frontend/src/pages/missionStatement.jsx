import React, { useEffect, useState } from "react";
import { fetchMissionStatements } from "../services/api"; // Ensure the API service fetches the correct table data

export default function MissionStatementTable() {
  const [missionStatements, setMissionStatements] = useState([]);

  useEffect(() => {
    // Fetch mission statement data when the component loads
    const getMissionStatements = async () => {
      try {
        const data = await fetchMissionStatements();
        setMissionStatements(data); // Set the data to the state
      } catch (error) {
        console.error("Error fetching mission statements:", error);
      }
    };

    getMissionStatements();
  }, []);

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <div className="w-1/5 bg-gray-200 flex flex-col items-center py-4">
        <div className="mb-6">
          <img
            src="logo.png" // Replace with your logo path
            alt="Logo"
            className="w-16 h-16"
          />
        </div>
        {/* Sidebar Menu */}
        <ul className="space-y-4 text-gray-600">
          <li className="hover:text-blue-500 cursor-pointer">Menu 1</li>
          <li className="hover:text-blue-500 cursor-pointer">Menu 2</li>
          <li className="hover:text-blue-500 cursor-pointer">Menu 3</li>
        </ul>
      </div>

      {/* Main Content */}
      <div className="flex-1 bg-gray-100">
        {/* Header */}
        <div className="flex items-center justify-between bg-white px-6 py-4 shadow">
          <div className="text-gray-600">
            <span className="block font-bold text-lg">Name</span>
            <span className="text-sm">Role</span>
          </div>
          <button className="text-red-500 font-semibold">Log Out</button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Action Buttons */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <button className="bg-blue-500 text-white px-4 py-2 rounded mr-2">
                Create
              </button>
              <button className="bg-blue-500 text-white px-4 py-2 rounded mr-2">
                Upload
              </button>
              <button className="bg-blue-500 text-white px-4 py-2 rounded">
                Download Template
              </button>
            </div>
            <div className="flex items-center">
              <label className="mr-2">Search:</label>
              <input
                type="text"
                className="border px-2 py-1 rounded"
                placeholder="Search here"
              />
            </div>
          </div>

          {/* Table */}
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-red-500 text-white">
                <th className="border py-2 px-4">No</th>
                <th className="border py-2 px-4">Job ID</th>
                <th className="border py-2 px-4">Nama Job</th>
                <th className="border py-2 px-4">Deskripsi</th>
                <th className="border py-2 px-4">DJM</th>
              </tr>
            </thead>
            <tbody>
              {missionStatements.length > 0 ? (
                missionStatements.map((statement, index) => (
                  <tr
                    key={statement.job_id}
                    className={index % 2 === 0 ? "bg-gray-200" : "bg-white"}
                  >
                    <td className="border py-2 px-4">{index + 1}</td>
                    <td className="border py-2 px-4">{statement.job_id}</td>
                    <td className="border py-2 px-4">{statement.nama_job}</td>
                    <td className="border py-2 px-4">{statement.deskripsi}</td>
                    <td className="border py-2 px-4">Mission Statement</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan="5"
                    className="border py-4 px-4 text-center text-gray-500"
                  >
                    No data available
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
