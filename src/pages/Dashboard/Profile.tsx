import React, { useState, useEffect, useRef } from 'react';
import { useAuth, axiosInstance } from '../../shared/index';
import { Camera, User, Mail, Shield, Key, AlertCircle, CheckCircle, Fingerprint, Upload } from 'lucide-react';
import toast from 'react-hot-toast';
import '../styles/Profile.css';

interface TeacherProfile {
  name: string;
  email: string;
  teacher_id: string;
  department_id: string;
  department_name: string | null;
  national_id_number: string | null;
  national_id_photo_url: string | null;
  profile_photo_url: string | null;
}

const Profile = () => {
  const { user: authUser, login, token } = useAuth();
  const [profile, setProfile] = useState<TeacherProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Form States  
  const [personalInfo, setPersonalInfo] = useState({ name: '', email: '' });
  const [idInfo, setIdInfo] = useState({ national_id_number: '' });
  const [passwordInfo, setPasswordInfo] = useState({ newPassword: '', confirmPassword: '' });

  // File States
  const [profilePhoto, setProfilePhoto] = useState<File | null>(null);
  const [idPhoto, setIdPhoto] = useState<File | null>(null);

  // Preview States
  const [profilePhotoPreview, setProfilePhotoPreview] = useState<string | null>(null);
  const [idPhotoPreview, setIdPhotoPreview] = useState<string | null>(null);

  // Loading States for Buttons
  const [savingPersonal, setSavingPersonal] = useState(false);
  const [savingId, setSavingId] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  // Refs for hidden file inputs
  const profilePicRef = useRef<HTMLInputElement>(null);
  const idPicRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const { data } = await axiosInstance.get('/lecturer/profile');
      setProfile(data);
      setPersonalInfo({ name: data.name, email: data.email });
      setIdInfo({ national_id_number: data.national_id_number || '' });
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to fetch profile info');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'profile' | 'id') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      toast.error('File size must be less than 5MB');
      return;
    }

    const previewUrl = URL.createObjectURL(file);

    if (type === 'profile') {
      setProfilePhoto(file);
      setProfilePhotoPreview(previewUrl);
      uploadProfilePhoto(file); // Auto-upload profile photo on select
    } else {
      setIdPhoto(file);
      setIdPhotoPreview(previewUrl);
    }
  };

  const uploadProfilePhoto = async (file: File) => {
    const formData = new FormData();
    formData.append('profilePhoto', file);

    try {
      setSavingPersonal(true);
      const { data } = await axiosInstance.patch('/lecturer/update-teacher-profile', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      if (data.teacherDetails) {
         setProfile(prev => prev ? { ...prev, profile_photo_url: data.teacherDetails.profile_photo_url } : null);
      }
      toast.success('Profile photo updated');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to upload photo');
    } finally {
      setSavingPersonal(false);
    }
  };

  const handleSavePersonalInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingPersonal(true);
    try {
      const { data } = await axiosInstance.patch('/auth/update-profile', personalInfo);
      toast.success('Personal information updated');
      // Update the auth context so the navbar/header reflects new name
      if (authUser && token) {
        login(token, data.user);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to update personal info');
    } finally {
      setSavingPersonal(false);
    }
  };

  const handleSaveIdInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData();
    if (idInfo.national_id_number) formData.append('national_id_number', idInfo.national_id_number);
    if (idPhoto) formData.append('nationalIdPhoto', idPhoto);

    if (!formData.has('national_id_number') && !formData.has('nationalIdPhoto')) {
       return toast.error("Please provide an ID number or upload an ID photo");
    }

    setSavingId(true);
    try {
      const { data } = await axiosInstance.patch('/lecturer/update-teacher-profile', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success('Identity information updated');
      if (data.teacherDetails) {
         setProfile(prev => prev ? { 
            ...prev, 
            national_id_number: data.teacherDetails.national_id_number,
            national_id_photo_url: data.teacherDetails.national_id_photo_url 
         } : null);
         setIdPhoto(null);
         setIdPhotoPreview(null);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to update identity info');
    } finally {
      setSavingId(false);
    }
  };

  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInfo.newPassword !== passwordInfo.confirmPassword) {
      return toast.error("Passwords do not match");
    }
    if (passwordInfo.newPassword.length < 6) {
      return toast.error("Password must be at least 6 characters");
    }

    setSavingPassword(true);
    try {
      await axiosInstance.patch('/auth/update-profile', { password: passwordInfo.newPassword });
      toast.success('Password updated successfully');
      setPasswordInfo({ newPassword: '', confirmPassword: '' });
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to update password');
    } finally {
      setSavingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p className="loading-text">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-container">
      <div className="profile-header-banner">
        <h1 className="profile-page-title">Profile Settings</h1>
        <p className="profile-page-subtitle">Manage your account and personal information</p>
      </div>

      <div className="profile-layout">
        <div className="profile-sidebar">
           <div className="profile-card user-summary-card">
              <div className="profile-photo-container">
                 <img 
                    src={profilePhotoPreview || profile?.profile_photo_url || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(profile?.name || 'A') + '&background=random'} 
                    alt="Profile" 
                    className="profile-photo-img" 
                 />
                 <button 
                    className="profile-photo-edit-btn"
                    onClick={() => profilePicRef.current?.click()}
                    disabled={savingPersonal}
                 >
                    <Camera size={18} />
                 </button>
                 <input 
                    type="file" 
                    ref={profilePicRef}
                    className="hidden-file-input"
                    accept="image/png, image/jpeg, image/jpg"
                    onChange={(e) => handleFileChange(e, 'profile')}
                 />
              </div>
              
              <h2 className="summary-name">{profile?.name}</h2>
              <div className="badge role-badge">Teacher</div>
              
              <div className="summary-details">
                 <div className="detail-item">
                    <Shield className="detail-icon" size={16} />
                    <span className="detail-text">{profile?.teacher_id}</span>
                 </div>
                 <div className="detail-item">
                    <AlertCircle className="detail-icon" size={16} />
                    <span className="detail-text">{profile?.department_name || 'No Department'}</span>
                 </div>
                 <div className="detail-item">
                    <Mail className="detail-icon" size={16} />
                    <span className="detail-text">{profile?.email}</span>
                 </div>
              </div>
           </div>
        </div>

        <div className="profile-main-content">
          <section className="profile-card">
            <div className="card-header">
               <User className="card-icon" />
               <h3 className="card-title">Personal Information</h3>
            </div>
            <form className="profile-form" onSubmit={handleSavePersonalInfo}>
               <div className="form-group grid-2">
                  <div className="input-group">
                     <label>Full Name</label>
                     <input 
                        type="text" 
                        value={personalInfo.name} 
                        onChange={e => setPersonalInfo({...personalInfo, name: e.target.value})}
                        required
                        className="form-input"
                     />
                  </div>
                  <div className="input-group">
                     <label>Email Address</label>
                     <input 
                        type="email" 
                        value={personalInfo.email} 
                        onChange={e => setPersonalInfo({...personalInfo, email: e.target.value})}
                        required
                        className="form-input"
                     />
                  </div>
               </div>
               <div className="form-actions">
                  <button type="submit" className="btn-primary" disabled={savingPersonal}>
                     {savingPersonal ? 'Saving...' : 'Save Changes'}
                  </button>
               </div>
            </form>
          </section>

          <section className="profile-card">
            <div className="card-header">
               <Fingerprint className="card-icon" />
               <h3 className="card-title">Identity Verification</h3>
            </div>
            <form className="profile-form" onSubmit={handleSaveIdInfo}>
               <div className="form-group">
                  <div className="input-group">
                     <label>National ID Number</label>
                     <input 
                        type="text" 
                        value={idInfo.national_id_number} 
                        onChange={e => setIdInfo({...idInfo, national_id_number: e.target.value})}
                        className="form-input"
                        placeholder="Enter your ID number"
                     />
                  </div>
               </div>

               <div className="form-group">
                  <label>National ID Photo (Optional)</label>
                  <div className="id-upload-area" onClick={() => idPicRef.current?.click()}>
                     {idPhotoPreview || profile?.national_id_photo_url ? (
                        <div className="id-preview-container">
                           <img 
                              src={idPhotoPreview || profile?.national_id_photo_url!} 
                              alt="ID Preview" 
                              className="id-preview-img"
                           />
                           <div className="id-preview-overlay">
                              <Upload size={24} />
                              <span>Click to change</span>
                           </div>
                        </div>
                     ) : (
                        <div className="id-upload-placeholder">
                           <Upload className="upload-icon" size={32} />
                           <span>Click or drag to upload ID photo</span>
                           <span className="upload-hint">PNG, JPG up to 5MB</span>
                        </div>
                     )}
                     <input 
                        type="file" 
                        ref={idPicRef}
                        className="hidden-file-input"
                        accept="image/png, image/jpeg, image/jpg"
                        onChange={(e) => handleFileChange(e, 'id')}
                     />
                  </div>
               </div>

               <div className="form-actions">
                  <button type="submit" className="btn-primary" disabled={savingId}>
                     {savingId ? 'Uploading...' : 'Verify Details'}
                  </button>
               </div>
            </form>
          </section>

          <section className="profile-card">
            <div className="card-header">
               <Key className="card-icon" />
               <h3 className="card-title">Change Password</h3>
            </div>
            <form className="profile-form" onSubmit={handleSavePassword}>
               <div className="form-group grid-2">
                  <div className="input-group">
                     <label>New Password</label>
                     <input 
                        type="password" 
                        value={passwordInfo.newPassword} 
                        onChange={e => setPasswordInfo({...passwordInfo, newPassword: e.target.value})}
                        className="form-input"
                        placeholder="Minimum 6 characters"
                     />
                  </div>
                  <div className="input-group">
                     <label>Confirm Password</label>
                     <input 
                        type="password" 
                        value={passwordInfo.confirmPassword} 
                        onChange={e => setPasswordInfo({...passwordInfo, confirmPassword: e.target.value})}
                        className="form-input"
                        placeholder="Confirm new password"
                     />
                  </div>
               </div>
               <div className="form-actions">
                  <button type="submit" className="btn-primary" disabled={savingPassword || !passwordInfo.newPassword}>
                     {savingPassword ? 'Updating...' : 'Update Password'}
                  </button>
               </div>
            </form>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Profile;
