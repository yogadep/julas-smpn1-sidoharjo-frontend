import { HeartIcon } from 'lucide-react';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="bg-white shadow-md py-4 px-6 flex flex-col md:flex-row justify-between items-center text-gray-600 text-sm">
      <div className="mb-2 md:mb-0">
        &copy; {currentYear} My Store. All rights reserved.
      </div>
      
      <div className="flex items-center space-x-6">
        <a href="#" className="hover:text-blue-500 transition-colors">Privacy Policy</a>
        <a href="#" className="hover:text-blue-500 transition-colors">Terms of Service</a>
        <div className="flex items-center">
          Made with <HeartIcon className="h-4 w-4 text-red-500 mx-1" /> in Indonesia
        </div>
      </div>
    </footer>
  );
};

export default Footer;