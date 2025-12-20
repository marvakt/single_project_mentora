
// import React, { useState, useEffect } from 'react';
// import { ChevronRight } from 'lucide-react';
// import { USER_API } from '../../config/api'

// const UserProfile = ({ user, token, setCurrentView }) => {
//   const [profile, setProfile] = useState(null);
//   const [name, setName] = useState('');
//   const [phone, setPhone] = useState('');
//   const [gender, setGender] = useState('');
//   const [address, setAddress] = useState('');
//   const [loading, setLoading] = useState(false);

//   useEffect(() => {
//     fetchProfile();
//   }, []);

//   const fetchProfile = async () => {
//     try {
//       const response = await fetch(`${USER_API}/profile/${user.user_id}/`, {
//         headers: { 'Authorization': `Bearer ${token}` }
//       });
//       if (response.ok) {
//         const data = await response.json();
//         setProfile(data);
//         setName(data.name || '');
//         setPhone(data.phone || '');
//         setGender(data.gender || '');
//         setAddress(data.address || '');
//       }
//     } catch (err) {
//       console.error('Failed to fetch profile', err);
//     }
//   };

//   const handleUpdate = async (e) => {
//     e.preventDefault();
//     setLoading(true);

//     try {
//       const response = await fetch(`${USER_API}/profile/${user.user_id}/update/`, {
//         method: 'PUT',
//         headers: {
//           'Authorization': `Bearer ${token}`,
//           'Content-Type': 'application/json'
//         },
//         body: JSON.stringify({ name, phone, gender, address })
//       });

//       if (response.ok) {
//         alert('Profile updated successfully!');
//         fetchProfile();
//       }
//     } catch (err) {
//       alert('Failed to update profile');
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="min-h-screen">
//       <nav className="bg-white shadow-lg">
//         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//           <div className="flex justify-between items-center h-16">
//             <button 
//               onClick={() => setCurrentView('user-dashboard')} 
//               className="text-purple-600 hover:text-purple-800 flex items-center space-x-2"
//             >
//               <ChevronRight className="w-5 h-5 transform rotate-180" />
//               <span>Back to Dashboard</span>
//             </button>
//           </div>
//         </div>
//       </nav>

//       <div className="max-w-3xl mx-auto px-4 py-8">
//         <h1 className="text-3xl font-bold mb-8 text-gray-800">My Profile</h1>

//         <div className="bg-white rounded-xl p-8 shadow-lg">
//           <form onSubmit={handleUpdate} className="space-y-6">
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
//               <input
//                 type="text"
//                 value={name}
//                 onChange={(e) => setName(e.target.value)}
//                 className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
//               />
//             </div>

//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
//               <input
//                 type="tel"
//                 value={phone}
//                 onChange={(e) => setPhone(e.target.value)}
//                 className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
//               />
//             </div>

//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-2">Gender</label>
//               <select
//                 value={gender}
//                 onChange={(e) => setGender(e.target.value)}
//                 className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
//               >
//                 <option value="">Select Gender</option>
//                 <option value="male">Male</option>
//                 <option value="female">Female</option>
//                 <option value="other">Other</option>
//               </select>
//             </div>

//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
//               <textarea
//                 value={address}
//                 onChange={(e) => setAddress(e.target.value)}
//                 rows={3}
//                 className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
//               />
//             </div>

//             <button
//               type="submit"
//               disabled={loading}
//               className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-lg font-semibold hover:shadow-lg transform hover:scale-105 transition disabled:opacity-50"
//             >
//               {loading ? 'Updating...' : 'Update Profile'}
//             </button>
//           </form>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default UserProfile;


import React, { useState, useEffect } from 'react';
import { ChevronRight } from 'lucide-react';
import { USER_API } from '../../config/api';

const UserProfile = ({ user, token, setCurrentView }) => {
  const [profile, setProfile] = useState(null);

  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [gender, setGender] = useState('');
  const [address, setAddress] = useState('');

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchProfile = async () => {
    try {
      const accessToken = sessionStorage.getItem('access_token');
      const response = await fetch(
        `${USER_API}/profile/${user.user_id}/`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch profile');
      }

      const data = await response.json();

      setProfile(data);
      setEmail(data.email || '');
      setName(data.name || '');
      setPhone(data.phone || '');
      setGender(data.gender || '');
      setAddress(data.address || '');
    } catch (err) {
      console.error('Failed to fetch profile', err);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(
        `${USER_API}/profile/${user.user_id}/update/`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${sessionStorage.getItem('access_token')}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name,
            phone,
            gender,
            address,
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Update failed');
      }

      alert('Profile updated successfully!');
      fetchProfile();
    } catch (err) {
      alert('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      <nav className="bg-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <button
              onClick={() => setCurrentView('user-dashboard')}
              className="text-purple-600 hover:text-purple-800 flex items-center space-x-2"
            >
              <ChevronRight className="w-5 h-5 transform rotate-180" />
              <span>Back to Dashboard</span>
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8 text-gray-800">
          My Profile
        </h1>

        <div className="bg-white rounded-xl p-8 shadow-lg">
          <form onSubmit={handleUpdate} className="space-y-6">
            {/* EMAIL (READ ONLY) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                disabled
                className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed text-gray-600"
              />
            </div>

            {/* NAME */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
              />
            </div>

            {/* PHONE */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
              />
            </div>

            {/* GENDER */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Gender
              </label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
              >
                <option value="">Select Gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>

            {/* ADDRESS */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Address
              </label>
              <textarea
                rows={3}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-lg font-semibold hover:shadow-lg transform hover:scale-105 transition disabled:opacity-50"
            >
              {loading ? 'Updating...' : 'Update Profile'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
