import React, { useEffect, useState } from 'react';
import EditModal from '../components/EditModal';
import DeleteModal from '../components/DeleteModal';
import CreateEntryModal from '../components/CreateEntryModal';
import axios from 'axios';
import profile from '../assets/profile.png'
import { useNavigate } from 'react-router-dom';


const MainPage = () => {

  const navigate = useNavigate();

  const menu = [
    { id: 1, title: 'Create Job', endpoint: 'cj', description: 'This is the Job Creation of the company' },
    { id: 2, title: 'Mapping Job', endpoint: 'mj', description: 'This is the Job Mapping of the company' },
  ];

  // The table headers for 'create_job' and 'mapping_job' can be different
  const tableHeaders = {
    cj: [
      { title: 'No.' },
      { title: 'Action' },
      { title: 'Nama Job' },
      { title: 'Job ID' },
      { title: 'Job Prefix' },
      { title: 'Company Code' },
      { title: 'Band' },
      { title: 'Flag Managerial' },
      { title: 'Begda' },
      { title: 'Endda' },
    ],
    mj: [
      { title: 'No.' },
      { title: 'Action' },
      { title: 'Job ID' },
      { title: 'Company Code' },
      { title: 'Short Posisi' },
      { title: 'Objid Posisi' },
      { title: 'Nama Pemangku' },
      { title: 'NIK Pemangku' },
      { title: 'Begda' },
      { title: 'Endda' },
    ],
  };


  const [activeMenu, setActiveMenu] = useState(menu[0]);
  const [data, setData] = useState([]);
  const [maxJobId, setMaxJobId] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [createModalOpened, setCreateModalOpened] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [deleteModalOpened, setDeleteModalOpened] = useState(false);

  // New state for sidebar collapse
  const [collapsed, setCollapsed] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const entriesPerPage = 10; // Jumlah entri per halaman
  const [totalEntries, setTotalEntries] = useState(0);
  const startIndex = (currentPage - 1) * entriesPerPage;
  const endIndex = startIndex + entriesPerPage;
  //const currentData = data.slice(startIndex, endIndex);

  const [searchTerm, setSearchTerm] = useState("");
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); // Reset to the first page
  };

  // Filter data by search term
  const filteredData = data.filter(
    (item) =>
      item.job_id.toString().toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.nama_job.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.job_prefix.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.company_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.band.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.flag_mgr.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const currentData = filteredData.slice(
    (currentPage - 1) * entriesPerPage,
    currentPage * entriesPerPage
  );

  const handleLogout = () => {
    localStorage.removeItem("account");
    navigate("/login");
  };

  // account logged handle
  const accountData = JSON.parse(localStorage.getItem("account"));

  if (accountData) {
    console.log("Account Data:", accountData);
  } else {
    console.log("No account data found in localStorage");
    navigate('/login')
  }


  useEffect(() => {
    const fetchData = async () => {
      if (!activeMenu.endpoint) return;

      setLoading(true); // Set loading to true
      setError(null); // Reset any previous errors
      try {
        const response = await fetch(`http://localhost:5000/job/${activeMenu.endpoint}/`);
        if (!response.ok) {
          throw new Error('Data not found');
        }
        const data = await response.json();
        const sortedData = data.sort((a, b) => a.job_id - b.job_id);
        setData(sortedData);
        setTotalEntries(data.length);
        const maxJobId = Math.max(...data.map((entry) => entry.job_id), 0);
        setMaxJobId(maxJobId);
      } catch (error) {
        setError(error.message); // Set error message if something goes wrong
      } finally {
        setLoading(false); // Set loading to false after the fetch
      }
    };


    if (activeMenu.endpoint) {
      fetchData();
    }
  }, [activeMenu, isModalOpen, deleteModalOpened, createModalOpened]);

  const openModal = (entry) => {
    setSelectedItem(entry);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setSelectedItem(null);
    setIsModalOpen(false);
  };

  const openDelete = (entry) => {
    setSelectedItem(entry);
    setDeleteModalOpened(true);
  };

  const handleFileUpload = async (file) => {
    if (!file) return;

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await axios.post(`http://localhost:5000/job/${activeMenu.endpoint}/upload-xlsx`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      alert(response.data.message || 'File uploaded successfully');
    } catch (error) {
      console.error('Error uploading file:', error.message);
      alert(error.response?.data?.error || 'Failed to upload the file');
    }
  };

  const [jobs, setJobs] = useState([]);

  const fetchJobs = async () => {
    try {
      const response = await axios.get(
        `http://localhost:5000/job/${activeMenu.endpoint}/all/search?search=${searchTerm}`
      );
      setJobs(response.data);
    } catch (error) {
      console.error("Error fetching jobs:", error);
    }
  };

  const handleMenuClick = (item) => {
    setActiveMenu(item); // Update active menu
    window.location.reload(); // Refresh the page
  };

  const handleFileDownload = async () => {
    try {
      const response = await axios.get(`http://localhost:5000/job/${activeMenu.endpoint}/all/download`, {
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `${activeMenu.title}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading file:', error.message);
      alert('Failed to download the file');
    }
  };

  const handleFileDownloadTemplate = async () => {
    try {
      const response = await axios.get(`http://localhost:5000/job/${activeMenu.endpoint}/all/download-template`, {
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `${activeMenu.title}_template.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading file:', error.message);
      alert('Failed to download the file');
    }
  };

  const renderPagination = () => {
    const totalPages = Math.ceil(filteredData.length / entriesPerPage);
    return (
      <div className="flex justify-end flex gap-2 mt-5">
        <button
          onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
          disabled={currentPage === 1}
          className={`px-3 py-1 rounded-lg ${currentPage === 1 ? 'bg-gray-300 cursor-not-allowed' : 'bg-blue-500 text-white'}`}
        >
          Previous
        </button>
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
          <button
            key={page}
            onClick={() => setCurrentPage(page)}
            className={`px-3 py-1 rounded-lg ${currentPage === page ? 'bg-blue-500 text-white' : 'bg-gray-300'}`}
          >
            {page}
          </button>
        ))}
        <button
          onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
          disabled={currentPage === totalPages}
          className={`px-3 py-1 rounded-lg ${currentPage === totalPages ? 'bg-gray-300 cursor-not-allowed' : 'bg-blue-500 text-white'}`}
        >
          Next
        </button>
      </div>
    );
  };
  

  const paginatedData = data.slice(
    (currentPage - 1) * entriesPerPage,
    currentPage * entriesPerPage
  );

  const handlePageChange = (page) => {
    const totalPages = Math.ceil(totalEntries / entriesPerPage);
    if (page > 0 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const renderTableRows = (data) => {
    return data.map((item, index) => (
      <tr key={index} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
        <td className="px-4 py-2">{index + 1}</td>
        {activeMenu.endpoint === 'cj' && (
          <>
            <td className="px-4 py-2 flex gap-2">
              <button className="bg-blue-400 px-3 py-1 rounded-lg text-white">Edit</button>
              <button className="bg-red-400 px-3 py-1 rounded-lg text-white">Delete</button>
            </td>
            <td className="px-4 py-2">{item.nama_job}</td>
            <td className="px-4 py-2">{item.job_id}</td>
            <td className="px-4 py-2">{item.job_prefix}</td>
            <td className="px-4 py-2">{item.company_code}</td>
            <td className="px-4 py-2">{item.band}</td>
            <td className="px-4 py-2">{item.flag_mgr}</td>
            <td className="px-4 py-2">{item.begda}</td>
            <td className="px-4 py-2">{item.endda}</td>
          </>
        )}
        {activeMenu.endpoint === 'mj' && (
          <>
            <td className="px-4 py-2 flex gap-2">
              <button className="bg-blue-400 px-3 py-1 rounded-lg text-white">Edit</button>
              <button className="bg-red-400 px-3 py-1 rounded-lg text-white">Delete</button>
            </td>
            <td className="px-4 py-2">{item.job_id}</td>
            <td className="px-4 py-2">{item.company_code}</td>
            <td className="px-4 py-2">{item.short_posisi}</td>
            <td className="px-4 py-2">{item.obid_posisi}</td>
            <td className="px-4 py-2">{item.nama_pemangku}</td>
            <td className="px-4 py-2">{item.nik_pemangku}</td>
            <td className="px-4 py-2">{item.begda}</td>
            <td className="px-4 py-2">{item.endda}</td>
          </>
        )}
      </tr>
    ));
  };

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


      <div className="flex">
        {/* Sidebar */}
        <aside
          className={`bg-gray-800 text-white ${collapsed ? 'w-16' : 'w-64'} transition-all duration-300 h-screen p-4 overflow-y-auto`}
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
                className={`cursor-pointer flex items-center p-2 rounded-md bg-blue-500`}
                onClick={() => window.location.href = "/job"}
              >
                {!collapsed && <span className="ml-4">Job</span>}
              </li>
              <li className={`cursor-pointer flex items-center p-2 rounded-md hover:bg-blue-500 duration-300`}
                onClick={() => window.location.href = "/profile"}
              >
                {!collapsed && <span className="ml-4">Profile</span>}
              </li>
            </ul>
          </nav>
        </aside>

        <div
          key={activeMenu.id} // Forces a re-render whenever the active menu changes
          className="w-full h-screen px-5 py-3 bg-gray-100 overflow-y-auto"
        >
          {/* Rest of the content */}
          {isModalOpen && selectedItem && (
            <EditModal entryData={selectedItem} activeItem={activeMenu} onClose={closeModal} />
          )}

          {deleteModalOpened && selectedItem && (
            <DeleteModal entryData={selectedItem} activeItem={activeMenu} onClose={() => setDeleteModalOpened(false)} />
          )}

          {createModalOpened && (
            <CreateEntryModal activeItem={activeMenu} onClose={() => setCreateModalOpened(false)} idAvailable={maxJobId + 1} />
          )}

          <div className='w-full h-screen px-5 py-3 bg-gray-100'>
            <div className='w-full h-20 bg-white flex items-center justify-center gap-10 px-5 rounded-md shadow-sm'>
              {menu.map((item) => (
                <div
                  key={item.id}
                  className={`relative flex items-center justify-center duration-300 gap-3 cursor-pointer group ${activeMenu.id === item.id ? 'text-black' : 'text-gray-700'
                    }`}
                  onClick={() => setActiveMenu(item)}
                >
                  <h1 className='text-lg font-semibold'>{item.title}</h1>
                  <div className='absolute bottom-0 left-0 w-0 h-0.5 bg-black transition-all duration-300 group-hover:w-full'></div>
                </div>
              ))}
            </div>

            <div className='w-full bg-white px-5 py-7 mt-5 rounded-md shadow-sm'>
              <div className='w-full flex justify-between items-center'>
                <div>
                  <p className='text-black font-semibold text-xl'>{activeMenu.title} DJM</p>
                  <div className='flex gap-2 mt-5'>
                  {(accountData.roles === "Admin" || accountData.roles === "Super Admin") && (
                    <div className='flex gap-2'>                    
                      <button
                        className='bg-blue-400 px-5 py-0.5 rounded-lg text-white hover:scale-110 duration-300 hover:bg-blue-500'
                        onClick={() => setCreateModalOpened(true)}
                      >
                        Create
                      </button>
                      <button
                        className='bg-blue-400 px-5 py-0.5 rounded-lg text-white hover:scale-110 duration-300 hover:bg-blue-500'
                        onClick={() => document.getElementById('fileUpload').click()}
                      >
                        Upload
                      </button>
                    </div>
                  )}
                    <button
                      className='bg-blue-400 px-5 py-0.5 rounded-lg text-white hover:scale-110 duration-300 hover:bg-blue-500'
                      onClick={handleFileDownloadTemplate}
                    >
                      Download Template
                    </button>
                  </div>
                  <input
                    type='file'
                    id='fileUpload'
                    accept='.xlsx'
                    className='hidden'
                    onChange={(e) => handleFileUpload(e.target.files[0])}
                  />
                  <div className='flex gap-2 mt-5'>
                    <p className='font-semibold text-black'>Showing</p>
                    <div className='border border-black px-3 font-bold text-lg'>{totalEntries}</div>
                    <p className='font-semibold text-black'>Entries</p>
                  </div>
                </div>
                <div className='flex flex-col gap-3 items-end'>
                  <button
                    className='w-fit bg-blue-400 px-5 py-0.5 rounded-lg text-white hover:scale-110 duration-300 hover:bg-blue-500'
                    onClick={handleFileDownload}
                  >
                    Download
                  </button>

                  <input
                    type="text"
                    placeholder="Search by job_id, nama_job, or deskripsi"
                    value={searchTerm}
                    onChange={handleSearchChange}
                    className="border p-2"
                  />
                  {/* <button onClick={fetchJobs} className="bg-blue-500 text-white p-2 ml-2">
                    Search
                  </button>
                  <ul>
                    {jobs.map((job) => (
                      <li key={job.job_id}>
                        <h2>{job.nama_job}</h2>
                        <p>{job.deskripsi}</p>
                      </li>
                    ))}
                  </ul> */}

                </div>
              </div>

              {/* Render table */}
              <div className="w-full bg-white px-5 py-7 mt-5 rounded-md shadow-sm">
                <table className="w-full table-auto border-collapse">
                  <thead className="bg-gray-300">
                    <tr>
                      {tableHeaders[activeMenu.endpoint]?.map((header, idx) => (
                        <th key={idx} className="px-4 py-2 border-b text-left font-semibold">
                          {header.title}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={tableHeaders[activeMenu.endpoint].length} className="text-center py-4">
                          Loading...
                        </td>
                      </tr>
                    ) : error ? (
                      <tr>
                        <td colSpan={tableHeaders[activeMenu.endpoint].length} className="text-center py-4 text-red-500">
                          {error}
                        </td>
                      </tr>
                    ) : (
                      renderTableRows(data)
                    )}
                  </tbody>
                </table>
              </div>
              
              {renderPagination()}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default MainPage;
