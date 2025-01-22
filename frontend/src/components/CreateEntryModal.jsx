import React, { useState } from 'react';
import axios from 'axios';

const CreateEntryModal = ({ activeItem, onClose, idAvailable }) => {
  const [newEntry, setNewEntry] = useState({
    job_id: idAvailable || '', // Initialize job_id with idAvailable
    nama_job: '',
    deskripsi: '',
    befda: '', // Initialize befda with an empty string
    endda: '', // Initialize endda with an empty string
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setNewEntry({
      ...newEntry,
      [name]: value,
    });
  };

  // Handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Ensure job_id, nama_job, and deskripsi are filled
    if (!newEntry.job_id || !newEntry.nama_job || !newEntry.deskripsi) {
      alert('Please fill in all required fields.');
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await axios.post(
        `http://localhost:5000/${activeItem.endpoint}/create`,
        newEntry
      );

      if (response.status === 201) {
        // After successfully creating, close the modal
        alert('Entry created successfully');
        onClose(); // Close the modal
      }
    } catch (error) {
      console.error('Error creating entry:', error);
      alert('Failed to create entry.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed z-20 top-0 left-0 w-full h-full bg-black bg-opacity-50 flex items-center justify-center">
      <div className="w-1/3 h-fit bg-white rounded-md shadow-lg">
        <div className="w-full h-20 bg-green-400 flex items-center justify-between px-5 rounded-t-md">
          <p className="text-white font-semibold text-xl">Create New {activeItem.title}</p>
          <button onClick={onClose} className="text-white font-semibold text-xl">&times;</button>
        </div>
        <form onSubmit={handleSubmit} className="w-full h-full p-5">
          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-1">
              <label className="text-black font-semibold">Job ID</label>
              <input
                name="job_id"
                value={newEntry.job_id} // Use state value for job_id
                onChange={handleChange}
                required
                className="border border-gray-400 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-black font-semibold">Nama Job</label>
              <input
                type="text"
                name="nama_job"
                value={newEntry.nama_job}
                onChange={handleChange}
                required
                className="border border-gray-400 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-black font-semibold">Deskripsi</label>
              <textarea
                name="deskripsi"
                rows={8}
                value={newEntry.deskripsi}
                onChange={handleChange}
                required
                className="border border-gray-400 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-black font-semibold">Beginning Date</label>
              <input
                type="text"
                name="begda"
                value={newEntry.befda}
                onChange={handleChange}
                className="border border-gray-400 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-black font-semibold">End Date</label>
              <input
                type="text"
                name="endda"
                value={newEntry.endda}
                onChange={handleChange}
                className="border border-gray-400 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>

            <div className="flex gap-5 mt-5">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-green-500 px-5 py-1 rounded-lg font-semibold text-lg text-white duration-300 hover:bg-green-600"
              >
                {isSubmitting ? 'Submitting...' : 'Create'}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="w-full bg-gray-400 px-5 py-1 rounded-lg font-semibold text-lg text-white duration-300 hover:bg-gray-500"
              >
                Cancel
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateEntryModal;
