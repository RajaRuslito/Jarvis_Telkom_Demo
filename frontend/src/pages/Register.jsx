import React, { useState } from "react";
import axios from "axios"; // Import axios

const Register = () => {
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [rePassword, setRePassword] = useState("");
    const [errorMessage, setErrorMessage] = useState("");
    const [successMessage, setSuccessMessage] = useState("");

    const baseUrl = `${import.meta.env.VITE_REACT_APP_BACKEND_BASEURL}/account`; // Backend base URL

    const handleRegister = async (e) => {
        e.preventDefault();
        
        // Validasi jika password dan rePassword tidak cocok
        if (password !== rePassword) {
            setErrorMessage("Passwords do not match");
            return;
        }

        if (firstName && lastName && email && password && rePassword) {
            const name = `${firstName} ${lastName}`;

            try {
                const response = await axios.post(`${baseUrl}/signup`, {
                    name: name,
                    email: email,
                    password: password,
                    roles: "User", // Default role is 'User'
                });

                if (response.status === 201) {
                    setSuccessMessage("Registration successful! Please login.");
                    setErrorMessage(""); // Clear any previous errors
                    window.location.href = "/"; // Redirect to login page
                }
            } catch (error) {
                if (error.response) {
                    setErrorMessage(error.response.data.error); // Display error from server
                } else {
                    setErrorMessage("An error occurred. Please try again.");
                }
            }
        } else {
            setErrorMessage("Please fill out all fields");
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <div className="bg-white p-8 rounded-lg shadow-lg w-1/3 pb-20 flex flex-col justify-center">
                <h1 className="text-2xl font-bold text-gray-700 text-center mb-4">Register</h1>
                <form onSubmit={handleRegister}>
                    <div className="flex gap-5">
                        <div className="mb-4 w-1/2">
                            <label htmlFor="firstName" className="block text-gray-600 mb-2">
                                First Name
                            </label>
                            <input
                                type="text"
                                id="firstName"
                                value={firstName}
                                onChange={(e) => setFirstName(e.target.value)}
                                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Enter your first name"
                                required
                            />
                        </div>

                        <div className="mb-4 w-1/2">
                            <label htmlFor="lastName" className="block text-gray-600 mb-2">
                                Last Name
                            </label>
                            <input
                                type="text"
                                id="lastName"
                                value={lastName}
                                onChange={(e) => setLastName(e.target.value)}
                                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Enter your last name"
                                required
                            />
                        </div>
                    </div>

                    <div className="mb-4">
                        <label htmlFor="email" className="block text-gray-600 mb-2">
                            Email
                        </label>
                        <input
                            type="email"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter your email"
                            required
                        />
                    </div>

                    <div className="mb-4">
                        <label htmlFor="password" className="block text-gray-600 mb-2">
                            Password
                        </label>
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter your password"
                            required
                        />
                    </div>

                    <div className="mb-4">
                        <label htmlFor="rePassword" className="block text-gray-600 mb-2">
                            Re-enter Password
                        </label>
                        <input
                            type="password"
                            id="rePassword"
                            value={rePassword}
                            onChange={(e) => setRePassword(e.target.value)}
                            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Re-enter your password"
                            required
                        />
                    </div>

                    {errorMessage && (
                        <div className="text-red-500 text-sm mb-4">
                            {errorMessage}
                        </div>
                    )}

                    {successMessage && (
                        <div className="text-green-500 text-sm mb-4">
                            {successMessage}
                        </div>
                    )}

                    <button
                        type="submit"
                        className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        Register
                    </button>
                </form>

                <p className="text-sm text-gray-600 text-center mt-4">
                    Already have an account?{" "}
                    <a href="/" className="text-blue-500 hover:underline">
                        Login here
                    </a>
                </p>
            </div>
        </div>
    );
};

export default Register;
