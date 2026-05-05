import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStateContext, useToast } from '../context';
import { submitContactForm } from '../api';

function Contact() {
    const navigate = useNavigate();
    const { walletAddress } = useStateContext();
    const { showToast } = useToast();
    const [form, setForm] = useState({ 
        subject: '', 
        message: '', 
        email: '' 
    });
    const [isLoading, setIsLoading] = useState(false);

    const handleFormFieldChange = (fieldName, e) => setForm({ ...form, [fieldName]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const payload = {
                ...form,
                // Include the connected wallet address for context
                walletAddress: walletAddress || 'Not Connected' 
            };
            
            // Send the data to the Flask backend for email processing
            await submitContactForm(payload);

            showToast('success', 'Your message has been successfully sent to the admin!');
            setForm({ subject: '', message: '', email: '' });
            navigate('/');
        } catch (error) {
            console.error("Contact form submission failed:", error);
            // Inform the user, especially since the Flask email endpoint needs to be implemented.
            showToast('error', `Error: Failed to send message. Please ensure your backend is running with a /contact endpoint configured for email sending.`);
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
        <div className="flex justify-center items-center min-h-[calc(100vh-80px)] p-4">
            <div className="w-full max-w-2xl bg-gray-900/50 backdrop-blur-md border border-gray-700 p-8 rounded-2xl shadow-2xl">
                <h2 className="text-3xl font-bold text-white mb-6 text-center">💬 Contact Support</h2>
                <p className="text-gray-400 text-center mb-8">
                    Have a complaint about a campaign? Fill out the form below. 
                    Your wallet address ({walletAddress || 'Not Connected'}) will be included for context.
                </p>
                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-300">Your Email Address</label>
                        <input 
                            id="email" 
                            type="email" 
                            placeholder="you@example.com" 
                            value={form.email} 
                            onChange={(e) => handleFormFieldChange('email', e)} 
                            className="mt-1 bg-gray-700 border border-gray-600 text-white p-3 w-full rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
                            required 
                        />
                    </div>
                    <div>
                        <label htmlFor="subject" className="block text-sm font-medium text-gray-300">Subject</label>
                        <input 
                            id="subject" 
                            type="text" 
                            placeholder="e.g., Complaint about campaign 0x..." 
                            value={form.subject} 
                            onChange={(e) => handleFormFieldChange('subject', e)} 
                            className="mt-1 bg-gray-700 border border-gray-600 text-white p-3 w-full rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
                            required 
                        />
                    </div>
                    <div>
                        <label htmlFor="message" className="block text-sm font-medium text-gray-300">Message/Complaint</label>
                        <textarea 
                            id="message" 
                            placeholder="Describe your complaint or issue..." 
                            rows="6" 
                            value={form.message} 
                            onChange={(e) => handleFormFieldChange('message', e)} 
                            className="mt-1 bg-gray-700 border border-gray-600 text-white p-3 w-full rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
                            required
                        ></textarea>
                    </div>
                    <button 
                        type="submit" 
                        disabled={isLoading} 
                        className="bg-blue-600 text-white px-6 py-3 w-full rounded-lg hover:bg-blue-700 transition font-semibold text-lg disabled:opacity-60"
                    >
                        {isLoading ? 'Sending...' : 'Send Message'}
                    </button>
                </form>
            </div>
        </div>
    );
}

export default Contact;