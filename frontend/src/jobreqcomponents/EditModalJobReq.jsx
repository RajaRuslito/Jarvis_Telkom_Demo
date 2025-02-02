import React, { useState } from 'react';
import axios from 'axios';

const EditModal = ({ entryData, activeItem, onClose }) => {
  const [currentEntry, setEntryData] = useState(entryData); 
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState(null);
  
  const baseUrl = `${import.meta.env.VITE_REACT_APP_BACKEND_BASEURL}/jobreq/${activeItem.endpoint}`;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEntryData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  const updateCurrentEntry = async () => {
    setIsUpdating(true);
    setError(null); // Reset error state before attempting update
    
    try {
      const response = await axios.put(
        `${baseUrl}/${currentEntry.obj_id}/update`, 
        {
          nama_job: currentEntry.nama_job,
          deskripsi: currentEntry.deskripsi,
          befda: currentEntry.befda,
          endda: currentEntry.endda,
        }
      );

      console.log('Update successful:', response.data);
      onClose(); // Close the modal after success
    } catch (err) {
      console.error('Error updating entry:', err);
      setError('Failed to update entry. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className='z-50 fixed top-0 left-0 w-full h-full bg-black bg-opacity-50 flex items-center justify-center'>
      <div className='flex flex-col w-1/3 h-fit bg-white rounded-md shadow-lg'>
        <div className='w-full h-20 bg-blue-400 flex items-center justify-between px-5 rounded-t-md'>
          <p className='text-white font-semibold text-xl'>Edit {activeItem.title}</p>
          <button onClick={onClose} className='text-white font-semibold text-xl'>&times;</button>
        </div>
        <div className='w-full h-full p-5'>
          <div className='flex flex-col gap-5'>
            <div className='flex flex-col gap-1'>
              <label className='text-black font-semibold'>Nama Job</label>
              <input
                type='text'
                name='nama_job'
                className='border border-gray-400 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-400'
                value={currentEntry.nama_job}
                onChange={handleChange}
              />
            </div>
            <div className='flex flex-col gap-1'>
              <label className='text-black font-semibold'>Deskripsi</label>
              <textarea
                name='deskripsi'
                rows={8}
                className='border border-gray-400 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-400'
                value={currentEntry.deskripsi}
                onChange={handleChange}
              />
            </div>
            {/* Befda and Endda inputs */}
            <div className='flex flex-col gap-1'>
              <label className='text-black font-semibold'>Before Date</label>
              <input
                type='text'
                name='befda'
                className='border border-gray-400 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-400'
                value={currentEntry.befda}
                onChange={handleChange}
              />
            </div>
            <div className='flex flex-col gap-1'>
              <label className='text-black font-semibold'>End Date</label>
              <input
                type='text'
                name='endda'
                className='border border-gray-400 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-400'
                value={currentEntry.endda}
                onChange={handleChange}
              />
            </div>
            {/* Error message */}
            {error && <p className='text-red-500'>{error}</p>}
            <div className='flex gap-3 mt-5'>
              <button
                onClick={updateCurrentEntry}
                className='w-full bg-blue-400 px-5 py-1 rounded-lg font-semibold text-lg text-white duration-300 hover:bg-blue-500'
                disabled={isUpdating}
              >
                {isUpdating ? 'Updating...' : 'Save Update'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditModal;
