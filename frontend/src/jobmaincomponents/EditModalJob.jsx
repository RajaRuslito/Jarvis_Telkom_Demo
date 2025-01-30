import React, { useState } from 'react';
import axios from 'axios';

const EditModalJob = ({ entryData, activeItem, onClose }) => {
    const [currentEntry, setEntryData] = useState(entryData);
    const [isUpdating, setIsUpdating] = useState(false);
    const [error, setError] = useState(null);

    const baseUrl = `http://localhost:5000/job/${activeItem}`;

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

        // Validate fields based on endpoint
        if (activeItem === 'cj') {
            if (!currentEntry.nama_job || !currentEntry.job_prefix) {
                setError('Please fill in all required fields for CJ.');
                setIsUpdating(false);
                return;
            }
        } else if (activeItem === 'mj') {
            if (!currentEntry.short_posisi || !currentEntry.nama_pemangku) { // Replace "some_mj_field" with the actual field(s) for 'mj'
                setError('Please fill in all required fields for MJ.');
                setIsUpdating(false);
                return;
            }
        } else {
            setError('Invalid endpoint.');
            setIsUpdating(false);
            return;
        }

        try {
            const response = await axios.put(
                `${baseUrl}/${currentEntry.obj_id}/update`,
                activeItem === 'cj'
                    ? {
                        nama_job: currentEntry.nama_job,
                        job_prefix: currentEntry.job_prefix,
                        job_id: currentEntry.job_id,
                        company_code: currentEntry.company_code,
                        band: currentEntry.band,
                        flag_mgr: currentEntry.flag_mgr,
                        befda: currentEntry.befda,
                        endda: currentEntry.endda,
                    }
                    : {
                        job_id: currentEntry.job_id,
                        nama_job: currentEntry.nama_job,
                        short_posisi: currentEntry.short_posisi,
                        company_code: currentEntry.company_code,
                        obid_posisi: currentEntry.obid_posisi,
                        nama_pemangku: currentEntry.nama_pemangku,
                        nik_pemangku: currentEntry.nik_pemangku,
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
            <div className='w-full max-w-2xl max-h-[90vh] bg-white rounded-md shadow-lg overflow-y-auto'>
                <div className='w-full h-20 bg-blue-400 flex items-center justify-between px-5 rounded-t-md'>
                    <p className='text-white font-semibold text-xl'>Edit Job</p>
                    <button onClick={onClose} className='text-white font-semibold text-xl'>&times;</button>
                </div>
                <div className='w-full h-full p-5'>
                    <div className='flex flex-col gap-5'>
                        {activeItem === 'cj' && (
                            <>
                                <div className="flex flex-col gap-1">
                                    <label className="text-black font-semibold">Job ID</label>
                                    <input
                                        name="job_id"
                                        value={currentEntry.job_id} // Use state value for job_id
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
                                        value={currentEntry.nama_job}
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
                                        value={currentEntry.job_prefix}
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
                                        value={currentEntry.company_code}
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
                                        value={currentEntry.band}
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
                                        value={currentEntry.flag_mgr}
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
                                        value={currentEntry.befda}
                                        onChange={handleChange}
                                        className="border border-gray-400 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-400 max-h-32 resize-y"
                                    />
                                </div>
                                <div className="flex flex-col gap-1">
                                    <label className="text-black font-semibold">End Date</label>
                                    <input
                                        type="text"
                                        name="endda"
                                        value={currentEntry.endda}
                                        onChange={handleChange}
                                        className="border border-gray-400 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-400 max-h-32 resize-y"
                                    />
                                </div>
                            </>
                        )}
                        {activeItem === 'mj' && (
                            <>
                                <div className="flex flex-col gap-1">
                                    <label className="text-black font-semibold">Job ID</label>
                                    <input
                                        name="job_id"
                                        value={currentEntry.job_id} // Use state value for job_id
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
                                        value={currentEntry.short_posisi}
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
                                        value={currentEntry.company_code}
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
                                        value={currentEntry.obid_posisi}
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
                                        value={currentEntry.nama_pemangku}
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
                                        value={currentEntry.nik_pemangku}
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
                                        value={currentEntry.befda}
                                        onChange={handleChange}
                                        className="border border-gray-400 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-400 max-h-32 resize-y"
                                    />
                                </div>
                                <div className="flex flex-col gap-1">
                                    <label className="text-black font-semibold">End Date</label>
                                    <input
                                        type="text"
                                        name="endda"
                                        value={currentEntry.endda}
                                        onChange={handleChange}
                                        className="border border-gray-400 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-400 max-h-32 resize-y"
                                    />
                                </div>
                            </>
                        )}

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

export default EditModalJob;
