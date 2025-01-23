import React, { useState } from 'react';
import axios from 'axios';

const CreateEntryModalJob = ({ activeItem, onClose, idAvailable }) => {
    const [newEntry, setNewEntry] = useState({
        cj: {
            job_id: idAvailable || '', // Initialize job_id with idAvailable
            nama_job: '',
            job_prefix: '',
            company_code: '',
            band: '',
            flag_mgr: '-',
        },
        mj: {
            job_id: idAvailable || '',
            company_code: '',
            short_posisi: '',
            obid_posisi: '',
            nama_pemangku: '',
            nik_pemangku: '',
        },
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Handle form input changes
    const handleChange = (e) => {
        const { name, value } = e.target;
        const endpoint = activeItem.endpoint;

        setNewEntry((prevState) => ({
            ...prevState,
            [endpoint]: {
                ...prevState[endpoint],
                [name]: value,
            },
        }));
    };


    // Handle form submit
    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        // Ensure job_id, nama_job, and deskripsi are filled
        const endpoint = activeItem.endpoint;
        if (endpoint === 'cj') {
            if (!newEntry[endpoint].job_id || !newEntry[endpoint].nama_job || !newEntry[endpoint].job_prefix || !newEntry[endpoint].company_code || !newEntry[endpoint].band || !newEntry[endpoint].flag_mgr) {
                alert('Please fill in all required fields.');
                setIsSubmitting(false);
                return;
            }
        }

        else if (endpoint === 'mj') {
            if (!newEntry[endpoint].job_id || !newEntry[endpoint].short_posisi || !newEntry[endpoint].company_code || !newEntry[endpoint].obid_posisi || !newEntry[endpoint].nama_pemangku || !newEntry[endpoint].nik_pemangku) {
                alert('Please fill in all required fields.');
                setIsSubmitting(false);
                return;
            }
        }

        try {
            const response = await axios.post(
                `http://localhost:5000/job/${activeItem.endpoint}/create`,
                newEntry[endpoint]
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

    const endpoint = activeItem.endpoint;

    return (
        <div className="fixed z-20 top-0 left-0 w-full h-full bg-black bg-opacity-50 flex items-center justify-center">
            <div className="w-full max-w-2xl max-h-[90vh] bg-white rounded-md shadow-lg overflow-y-auto">
                <div className="w-full h-20 bg-green-400 flex items-center justify-between px-5 rounded-t-md">
                    <p className="text-white font-semibold text-xl">Create New {activeItem.title}</p>
                    <button onClick={onClose} className="text-white font-semibold text-xl">&times;</button>
                </div>
                <form onSubmit={handleSubmit} className="w-full h-full p-5">
                    <div className="flex flex-col gap-5">
                        {endpoint === 'cj' && (
                            <>
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
                                    <label className="text-black font-semibold">Job Prefix</label>
                                    <textarea
                                        type="text"
                                        name="job_prefix"
                                        rows={8}
                                        value={newEntry.job_prefix}
                                        onChange={handleChange}
                                        required
                                        className="border border-gray-400 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-400  max-h-32 resize-y"
                                    />
                                </div>
                                <div className="flex flex-col gap-1">
                                    <label className="text-black font-semibold">Company Code</label>
                                    <textarea
                                        name="company_code"
                                        rows={8}
                                        value={newEntry.company_code}
                                        onChange={handleChange}
                                        required
                                        className="border border-gray-400 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-400 max-h-32 resize-y"
                                    />
                                </div>
                                <div className="flex flex-col gap-1">
                                    <label className="text-black font-semibold">Band Posisi</label>
                                    <textarea
                                        type="text"
                                        name="band"
                                        rows={8}
                                        value={newEntry.band}
                                        onChange={handleChange}
                                        required
                                        className="border border-gray-400 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-400 max-h-32 resize-y"
                                    />
                                </div>
                                <div className="flex flex-col gap-1">
                                    <label className="text-black font-semibold">Flag Managerial</label>
                                    <textarea
                                        type="text"
                                        name="flag_mgr"
                                        rows={8}
                                        value={newEntry.flag_mgr}
                                        onChange={handleChange}
                                        required
                                        className="border border-gray-400 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-400 max-h-32 resize-y"
                                    />
                                </div>
                                <div className="flex flex-col gap-1">
                                    <label className="text-black font-semibold">Beginning Date</label>
                                    <input
                                        type="text"
                                        name="begda"
                                        value={newEntry.befda}
                                        onChange={handleChange}
                                        className="border border-gray-400 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-400 max-h-32 resize-y"
                                    />
                                </div>
                                <div className="flex flex-col gap-1">
                                    <label className="text-black font-semibold">End Date</label>
                                    <input
                                        type="text"
                                        name="endda"
                                        value={newEntry.endda}
                                        onChange={handleChange}
                                        className="border border-gray-400 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-400 max-h-32 resize-y"
                                    />
                                </div>
                            </>
                        )}
                        {endpoint === 'mj' && (
                            <>
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
                                    <label className="text-black font-semibold">Short Posisi</label>
                                    <input
                                        type="text"
                                        name="short_posisi"
                                        value={newEntry.short_posisi}
                                        onChange={handleChange}
                                        required
                                        className="border border-gray-400 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-400 max-h-32 resize-y"
                                    />
                                </div>
                                <div className="flex flex-col gap-1">
                                    <label className="text-black font-semibold">Company Code</label>
                                    <textarea
                                        name="company_code"
                                        rows={8}
                                        value={newEntry.company_code}
                                        onChange={handleChange}
                                        required
                                        className="border border-gray-400 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-400 max-h-32 resize-y"
                                    />
                                </div>
                                <div className="flex flex-col gap-1">
                                    <label className="text-black font-semibold">Obj Id Posisi</label>
                                    <textarea
                                        name="obid_posisi"
                                        rows={8}
                                        value={newEntry.obid_posisi}
                                        onChange={handleChange}
                                        required
                                        className="border border-gray-400 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-400 max-h-32 resize-y"
                                    />
                                </div>
                                <div className="flex flex-col gap-1">
                                    <label className="text-black font-semibold">Nama Pemangku</label>
                                    <textarea
                                        type="text"
                                        name="nama_pemangku"
                                        rows={8}
                                        value={newEntry.nama_pemangku}
                                        onChange={handleChange}
                                        required
                                        className="border border-gray-400 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-400 max-h-32 resize-y"
                                    />
                                </div>
                                <div className="flex flex-col gap-1">
                                    <label className="text-black font-semibold">NIK Pemangku</label>
                                    <textarea
                                        name="nik_pemangku"
                                        rows={8}
                                        value={newEntry.nik_pemangku}
                                        onChange={handleChange}
                                        required
                                        className="border border-gray-400 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-400 max-h-32 resize-y"
                                    />
                                </div>
                                <div className="flex flex-col gap-1">
                                    <label className="text-black font-semibold">Beginning Date</label>
                                    <input
                                        type="text"
                                        name="begda"
                                        value={newEntry.befda}
                                        onChange={handleChange}
                                        className="border border-gray-400 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-400 max-h-32 resize-y"
                                    />
                                </div>
                                <div className="flex flex-col gap-1">
                                    <label className="text-black font-semibold">End Date</label>
                                    <input
                                        type="text"
                                        name="endda"
                                        value={newEntry.endda}
                                        onChange={handleChange}
                                        className="border border-gray-400 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-400 max-h-32 resize-y"
                                    />
                                </div>
                            </>
                        )}

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

export default CreateEntryModalJob;
