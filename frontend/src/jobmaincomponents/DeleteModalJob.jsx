import React from 'react';
import axios from 'axios'; 
const DeleteModalJob = ({ entryData, activeItem, onClose }) => {

  const handleDelete = async () => {
    try {
      const response = await axios.delete(
        `http://localhost:5000/job/${activeItem.endpoint}/${entryData.obj_id}/delete`
      );

      if (response.status === 200) {
        onClose();
      }
    } catch (error) {
      console.error("Error deleting item:", error);
      alert("Failed to delete item.");
    }
  };

  return (
    <div className='fixed top-0 left-0 w-full h-full bg-black bg-opacity-50 flex items-center justify-center'>
      <div className='w-1/3 h-fit bg-white rounded-md shadow-lg'>
        <div className='w-full h-20 bg-red-400 flex items-center justify-between px-5 rounded-t-md'>
          <p className='text-white font-semibold text-xl'>Confirm Deletion</p>
          <button onClick={onClose} className='text-white font-semibold text-xl'>&times;</button>
        </div>
        <div className='w-full h-full p-5'>
          <p className='text-black '>Are you sure you want to delete <span className='font-semibold italic'>{entryData.nama_job}</span> with <span className='font-semibold italic'>ID = {entryData.job_id}</span></p>
          <div className='flex gap-5 mt-5'>
            <button
              onClick={handleDelete}
              className='w-full bg-red-500 px-5 py-1 rounded-lg font-semibold text-lg text-white duration-300 hover:bg-red-600'
            >
              Delete
            </button>
            <button
              onClick={onClose}
              className='w-full bg-gray-400 px-5 py-1 rounded-lg font-semibold text-lg text-white duration-300 hover:bg-gray-500'
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeleteModalJob;
