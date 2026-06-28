import { useState } from "react";
import { Link } from "react-router-dom";

const DropdownPage = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const toggleDropdown = () => {
    setIsOpen((prev) => !prev);
  };

  const toggleModal = () => {
    setShowModal((prev) => !prev);
    setIsOpen(false);
  };

  return (
    <div className="container mx-auto flex justify-center items-center min-h-screen">
      <button
        className="px-6 py-3 bg-primary text-white font-bold rounded-lg hover:bg-primary-dark transition duration-200"
        onClick={toggleModal}
      >
        Get Started
      </button>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
          <div className="bg-white rounded-lg p-6 w-96 relative">
            <button
              onClick={toggleModal}
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
            >
              ×
            </button>
            <h2 className="text-2xl font-bold mb-4">Choose Your Role</h2>
            <div className="relative">
              <button
                className="w-full px-4 py-2 text-left bg-gray-100 hover:bg-gray-200 rounded-lg mb-2"
                onClick={toggleDropdown}
              >
                Select Role
              </button>

              {isOpen && (
                <ul
                  className="absolute w-full bg-white shadow-lg rounded-lg mt-1"
                  role="menu"
                >
                  <li role="menuitem">
                    <Link
                      to="/solution-seeker"
                      className="block py-2 px-4 text-gray-700 hover:bg-gray-200"
                      onClick={toggleModal}
                    >
                      Solution Seeker
                    </Link>
                  </li>
                  <li role="menuitem">
                    <Link
                      to="/expert"
                      className="block py-2 px-4 text-gray-700 hover:bg-gray-200"
                      onClick={toggleModal}
                    >
                      Expert
                    </Link>
                  </li>
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DropdownPage;