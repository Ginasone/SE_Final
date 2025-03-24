import Link from "next/link";
import { FaEnvelope, FaPhone, FaMapMarkerAlt } from "react-icons/fa";

const Footer = () => {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
            <div className="container mx-auto px-4 py-12">
                <div className="flex flex-col md:flex-row justify-between">
                    <div className="mb-8 md:mb-0 md:w-1/3">
                        <Link 
                        href="/" 
                        className="font-bold text-2xl text-primary dark:text-tertiary-light"
                        >
                            EduHub
                        </Link>
                        <p className="mt-4 text-gray-600 dark:text-gray-300 max-w-xs">
                            Bringing quality education to Ghanaian students no matter where they are
                        </p>
                        <div className="mt-6 flex items-center">
                            <FaMapMarkerAlt className="text-primary dark:text-tertiary-light mr-2"/>
                            <p className="text-gray-600 dark:text-gray-300">
                                123 Edu Road, Accra
                            </p>
                        </div>
                        <div className="mt-3 flex items-center">
                            <FaPhone className="text-primary dark:text-tertiary-light mr-2"/>
                            <p className="text-gray-600 dark:text-gray-300">
                                000-000-000
                            </p>
                        </div>
                        <div className="mt-3 flex items-center">
                            <FaEnvelope className="text-primary dark:text-tertiary-light mr-2"/>
                            <p className="text-gray-600 dark:text-gray-300">
                                info@eduhub.com
                            </p>
                        </div>
                    </div>

                    <div className="md:w-1/4">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                            Quick Links
                        </h3>
                        <ul className="space-y-2">
                            <li>
                                <Link href="/" className="text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-tertiary-light transition-colors">
                                    Home
                                </Link>
                            </li>
                            <li>
                                <Link href="/about" className="text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-tertiary-light transition-colors">
                                    About Us
                                </Link>
                            </li>
                            <li>
                                <Link href="/contact" className="text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-tertiary-light transition-colors">
                                    Contact
                                </Link>
                            </li>
                        </ul>
                    </div>

                    <div className="md:w-1/4">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                            Resources
                        </h3>
                        <ul className="space-y-2">
                            <li>
                                <Link href="/help" className="text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-tertiary-light transition-colors">
                                    Help Center
                                </Link>
                            </li>
                            <li>
                                <Link href="/faq" className="text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-tertiary-light transition-colors">
                                    FAQ
                                </Link>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>

            <div className="bg-blue-50 dark:bg-gray-900 py-4">
                <div className="cnotainer mx-auto px-4 text-center">
                    <p className="text-gray-600 dark:text-gray-400">
                        &copy; {currentYear} EduHub. All rights reserved
                    </p>
                </div>
            </div>
        </footer>
    ); 
};

export default Footer;