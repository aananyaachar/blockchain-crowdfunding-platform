import React, { useRef } from 'react';
import { Routes, Route } from 'react-router-dom';
import { StateContextProvider, ToastProvider, ThemeProvider } from './context';

import Background3D from './Background3D';
import Navbar from './pages/Navbar';
import AllCampaigns from './pages/AllCampaigns';
import CreateCampaign from './pages/CreateCampaign';
import CampaignDetail from './pages/CampaignDetails';
import Profile from './pages/Profile';
import Contact from './pages/Contact'; 

const Footer = () => (
    <footer className="bg-gray-900/50 backdrop-blur-sm text-white mt-12 py-8">
        <div className="container mx-auto text-center">
            <p>&copy; 2025 CryptoFund. All Rights Reserved.</p>
            <p className="text-sm text-gray-400 mt-2">Funding the future, one block at a time.</p>
        </div>
    </footer>
);

function App() {
    const contentRef = useRef();
    return (
        <ThemeProvider>
            <ToastProvider>
                <StateContextProvider>
                    <Background3D eventSource={contentRef} />
                    <div ref={contentRef} className="content-wrapper bg-transparent min-h-screen font-sans flex flex-col relative z-10">
                        <Navbar />
                        <main className="flex-grow">
                            <Routes>
                                <Route path="/" element={<AllCampaigns />} />
                                <Route path="/create" element={<CreateCampaign />} />
                                <Route path="/campaign/:address" element={<CampaignDetail />} />
                                <Route path="/profile" element={<Profile />} />
                                <Route path="/contact" element={<Contact />} /> {/* <--- NEW ROUTE */}
                            </Routes>
                        </main>
                        <Footer />
                    </div>
                </StateContextProvider>
            </ToastProvider>
        </ThemeProvider>
    );
}

export default App;