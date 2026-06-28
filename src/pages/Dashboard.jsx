import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Dashboard.css';

function Dashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('files');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Navigation states
  const [currentFolderId, setCurrentFolderId] = useState(() => {
    return localStorage.getItem('parentfolderId') || '';
  });
  const [currentFolderInfo, setCurrentFolderInfo] = useState(null);
  const [breadcrumbs, setBreadcrumbs] = useState([]);
  
  // Folder explorer state
  const [folders, setFolders] = useState([]);
  const [files, setFiles] = useState([]);
  
  // Trash state
  const [trashFolders, setTrashFolders] = useState([]);
  const [trashFiles, setTrashFiles] = useState([]);
  
  // Recent files state
  const [recentFilesList, setRecentFilesList] = useState([]);

  // Selected item for Rename/Delete from toolbar
  const [selectedItem, setSelectedItem] = useState(null); // { id, type, name }
  const [previewFile, setPreviewFile] = useState(null);

  const [showSettings, setShowSettings] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showNewDropdown, setShowNewDropdown] = useState(false);
  const [showCreateFolderModal, setShowCreateFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [uploadProgress, setUploadProgress] = useState(null);
  const [storageUsed, setStorageUsed] = useState('0 Bytes');
  const [storageUsedBytes, setStorageUsedBytes] = useState(0);
  const [sharingFile, setSharingFile] = useState(null);
  const [shareDuration, setShareDuration] = useState('5m');
  const [shareUrl, setShareUrl] = useState('');
  const [isGeneratingShareLink, setIsGeneratingShareLink] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [activeMobileMenu, setActiveMobileMenu] = useState(null);
  const [mobileNewMenuOpen, setMobileNewMenuOpen] = useState(false);

  const [isDark, setIsDark] = useState(() => {
    const theme = localStorage.getItem('theme');
    if (theme) return theme === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  const token = localStorage.getItem('accessToken');
  
  // Redirect to login if token is missing
  useEffect(() => {
    if (!token) {
      navigate('/');
    }
  }, [token, navigate]);

  // Dark mode effect
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  const [user, setUser] = useState(() => {
    return {
      name: localStorage.getItem('name') || 'Sarah Jenkins',
      email: localStorage.getItem('email') || 'user@aerodrive.com'
    };
  });

  // Load parent folder id on startup if not set
  useEffect(() => {
    const storedParent = localStorage.getItem('parentfolderId');
    if (storedParent && !currentFolderId) {
      setCurrentFolderId(storedParent);
    }
  }, [currentFolderId]);

  // Main Fetch: gets folders and files for the active folder
  const fetchFolderContents = async (folderId) => {
    if (!folderId || !token) return;
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/allFolders?folderId=${folderId}`, {
        method: "GET",
        headers: {
          'authorization': token
        }
      });
      if (res.status === 401) {
        handleLogout();
        return;
      }
      const data = await res.json();
      if (data) {
        setFolders(data.folders || []);
        setFiles(data.files || []);
        if (data.totalStorageUsed !== undefined) {
          setStorageUsed(data.totalStorageUsed);
        }
        if (data.totalStorageUsedBytes !== undefined) {
          setStorageUsedBytes(data.totalStorageUsedBytes);
        }
        if (data.currentFolderInfo) {
          setCurrentFolderInfo(data.currentFolderInfo);
          const folderName = data.currentFolderInfo.typeOfFolder === 'root' ? 'Personal Vault' : data.currentFolderInfo.folderName;
          
          // Manage navigation breadcrumbs chain
          setBreadcrumbs(prev => {
            const idx = prev.findIndex(b => b.id === folderId);
            if (idx !== -1) {
              return prev.slice(0, idx + 1);
            } else {
              if (prev.length === 0) {
                return [{ id: folderId, name: folderName }];
              }
              return [...prev, { id: folderId, name: folderName }];
            }
          });
        }
      }
    } catch (err) {
      console.error("Failed to fetch folder contents:", err);
    }
  };

  // Fetch trash items
  const fetchTrash = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/trash`, {
        method: "GET",
        headers: { 'authorization': token }
      });
      if (res.status === 401) {
        handleLogout();
        return;
      }
      const data = await res.json();
      setTrashFolders(data.folders || []);
      setTrashFiles(data.files || []);
    } catch (err) {
      console.error("Failed to fetch trash items:", err);
    }
  };

  // Fetch recent files
  const fetchRecentFiles = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/recentFiles`, {
        method: "GET",
        headers: { 'authorization': token }
      });
      if (res.status === 401) {
        handleLogout();
        return;
      }
      const data = await res.json();
      setRecentFilesList(data.files || []);
    } catch (err) {
      console.error("Failed to fetch recent files:", err);
    }
  };

  // Trigger folder content fetching on folder changes
  useEffect(() => {
    if (activeTab === 'files' && currentFolderId) {
      fetchFolderContents(currentFolderId);
      setSelectedItem(null);
    }
  }, [currentFolderId, activeTab]);

  // Trigger tab change loading
  useEffect(() => {
    setSelectedItem(null);
    if (activeTab === 'trash') {
      fetchTrash();
    } else if (activeTab === 'recent') {
      fetchRecentFiles();
    }
  }, [activeTab]);

  // Onboarding promo cards state
  const [promoCards, setPromoCards] = useState([
    {
      id: 'vault',
      title: 'Welcome to Personal Vault',
      desc: 'Personal Vault is your place within AeroDrive with an extra layer of security. Get started by moving your files here.',
      actionText: 'Get Started',
      icon: (
        <svg viewBox="0 0 24 24">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
      )
    },
    {
      id: 'suggested',
      title: 'Suggested files',
      desc: 'See a list of files that we suggest you add to your Personal Vault for safe keeping and easy backup access.',
      actionText: 'View list',
      icon: (
        <svg viewBox="0 0 24 24">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
          <polyline points="10 9 9 9 8 9" />
        </svg>
      )
    }
  ]);

  const getFileIcon = (fileName) => {
    const ext = fileName.split('.').pop().toLowerCase();
    if (ext === 'pdf') {
      return (
        <div className="db-file-icon-wrapper file-pdf" title="PDF document">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
          </svg>
        </div>
      );
    }
    if (['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp'].includes(ext)) {
      return (
        <div className="db-file-icon-wrapper file-image" title="Image file">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21 15 16 10 5 21" />
          </svg>
        </div>
      );
    }
    return (
      <div className="db-file-icon-wrapper file-doc" title="Document">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
          <line x1="10" y1="9" x2="9" y2="9" />
        </svg>
      </div>
    );
  };

  const handleClosePromo = (id) => {
    setPromoCards(promoCards.filter(card => card.id !== id));
  };

  const handleLogout = async () => {
    try {
      await fetch(`${import.meta.env.VITE_API_URL}/logout`, {
        method: 'PUT',
        credentials: 'include'
      });
    } catch (err) {
      console.error("Failed to call logout API:", err);
    }
    localStorage.removeItem('accessToken');
    localStorage.removeItem('parentfolderId');
    localStorage.removeItem('name');
    navigate('/');
  };

  // Create folder inside current folder
  const handleCreateFolder = async (e) => {
    if (e) e.preventDefault();
    const folderName = newFolderName.trim() || 'New Folder';

    if (folders.some(f => f.folderName.toLowerCase() === folderName.toLowerCase())) {
      alert('A folder with this name already exists.');
      return;
    }

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/createFolder`, {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
          'authorization': token
        },
        body: JSON.stringify({
          folderName,
          parentFolderId: currentFolderId
        })
      });
      if (res.ok) {
        setNewFolderName('');
        setShowCreateFolderModal(false);
        fetchFolderContents(currentFolderId);
      } else {
        alert("Failed to create folder.");
      }
    } catch (err) {
      console.error("Error creating folder:", err);
    }
  };

  // Trigger upload file picker
  const handleUploadClick = () => {
    setShowNewDropdown(false);
    document.getElementById('file-upload-input').click();
  };

  // Handle actual file upload
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Limit check: 2 GB = 2147483648 bytes
    if (storageUsedBytes + file.size > 2147483648) {
      alert("Storage limit exceeded! You cannot upload more files. Please upgrade to Pro.");
      navigate('/upgrade');
      return;
    }

    // Helper to format file size
    const formatBytes = (bytes) => {
      if (bytes === 0) return '0 Bytes';
      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    };

    const fileSizeStr = formatBytes(file.size);

    setUploadProgress({
      fileName: file.name,
      fileSize: fileSizeStr,
      percentage: 0,
      status: 'uploading',
      uploadedBytes: '0 Bytes'
    });

    const formData = new FormData();
    formData.append('file', file);
    formData.append('parentFolderId', currentFolderId);

    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${import.meta.env.VITE_API_URL}/uploadFile`, true);
    xhr.setRequestHeader('authorization', token);

    // Track upload progress
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        const percentComplete = Math.round((event.loaded / event.total) * 100);
        const uploadedBytesStr = formatBytes(event.loaded);
        setUploadProgress({
          fileName: file.name,
          fileSize: fileSizeStr,
          percentage: percentComplete,
          status: percentComplete === 100 ? 'processing' : 'uploading',
          uploadedBytes: uploadedBytesStr
        });
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        setUploadProgress(prev => ({
          ...prev,
          percentage: 100,
          status: 'success'
        }));
        fetchFolderContents(currentFolderId);
        // Clear progress after 3 seconds
        setTimeout(() => {
          setUploadProgress(null);
        }, 3000);
      } else {
        setUploadProgress(prev => ({
          ...prev,
          status: 'error'
        }));
        setTimeout(() => {
          setUploadProgress(null);
        }, 4000);
      }
    };

    xhr.onerror = () => {
      setUploadProgress(prev => ({
        ...prev,
        status: 'error'
      }));
      setTimeout(() => {
        setUploadProgress(null);
      }, 4000);
    };

    xhr.send(formData);
  };

  // Handle sharing of a file
  const handleShareClick = (file) => {
    setSharingFile(file);
    setShareDuration('5m');
    setShareUrl('');
    setCopiedUrl(false);
  };

  const handleGenerateShareLink = async (e) => {
    if (e) e.preventDefault();
    if (!sharingFile) return;

    setIsGeneratingShareLink(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/shareFile`, {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
          'authorization': token
        },
        body: JSON.stringify({
          fileId: sharingFile._id,
          expiresIn: shareDuration
        })
      });
      if (res.ok) {
        const data = await res.json();
        setShareUrl(data.shareUrl);
      } else {
        alert("Failed to generate share link.");
      }
    } catch (err) {
      console.error("Error generating share link:", err);
    } finally {
      setIsGeneratingShareLink(false);
    }
  };

  const handleCopyShareLink = () => {
    if (!shareUrl) return;
    navigator.clipboard.writeText(shareUrl);
    setCopiedUrl(true);
    setTimeout(() => {
      setCopiedUrl(false);
    }, 2000);
  };

  // Handle renaming of active selected item
  const handleRename = async () => {
    if (!selectedItem) return;
    const newName = prompt(`Rename "${selectedItem.name}" to:`, selectedItem.name);
    if (!newName || newName.trim() === '' || newName === selectedItem.name) return;

    try {
      const isFolder = selectedItem.type === 'folder';
      const endpoint = isFolder ? 'renameFolder' : 'renameFile';
      const payload = isFolder 
        ? { folderId: selectedItem.id, newName: newName.trim() }
        : { fileId: selectedItem.id, newName: newName.trim() };

      const res = await fetch(`${import.meta.env.VITE_API_URL}/${endpoint}`, {
        method: "PUT",
        headers: {
          'Content-Type': 'application/json',
          'authorization': token
        },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setSelectedItem(null);
        fetchFolderContents(currentFolderId);
      } else {
        alert("Failed to rename item.");
      }
    } catch (err) {
      console.error("Error renaming:", err);
    }
  };

  // Handle soft deleting of selected item
  const handleDelete = async (itemId = null, itemType = null) => {
    const id = itemId || (selectedItem && selectedItem.id);
    const type = itemType || (selectedItem && selectedItem.type);
    if (!id || !type) return;

    const confirmMsg = `Are you sure you want to move this ${type} to the recycle bin?`;
    if (!window.confirm(confirmMsg)) return;

    try {
      const endpoint = type === 'folder' ? 'deleteFolder' : 'deleteFile';
      const payload = type === 'folder' ? { folderId: id } : { fileId: id };

      const res = await fetch(`${import.meta.env.VITE_API_URL}/${endpoint}`, {
        method: "PUT",
        headers: {
          'Content-Type': 'application/json',
          'authorization': token
        },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setSelectedItem(null);
        fetchFolderContents(currentFolderId);
      } else {
        alert("Failed to delete item.");
      }
    } catch (err) {
      console.error("Error deleting:", err);
    }
  };

  // Handle download of file
  const handleDownloadFile = (fileId) => {
    window.open(`${import.meta.env.VITE_API_URL}/downloadFile/${fileId}?token=${token}`);
  };

  const handleViewFile = (file) => {
    setPreviewFile(file);
  };

  const renderPreviewContent = (file) => {
    const ext = file.fileName.split('.').pop().toLowerCase();
    const fileUrl = `${import.meta.env.VITE_API_URL}/viewFile/${file._id}?token=${token}`;
    
    if (['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp'].includes(ext)) {
      return <img src={fileUrl} alt={file.fileName} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />;
    }
    if (ext === 'pdf') {
      return <iframe src={fileUrl} width="100%" height="100%" style={{ border: 'none' }} title={file.fileName}></iframe>;
    }
    if (['mp4', 'webm', 'ogg'].includes(ext)) {
      return <video src={fileUrl} controls autoPlay style={{ maxWidth: '100%', maxHeight: '100%' }} />;
    }
    if (['mp3', 'wav', 'ogg'].includes(ext)) {
      return <audio src={fileUrl} controls autoPlay style={{ width: '80%' }} />;
    }
    if (['txt', 'html', 'json', 'js', 'css'].includes(ext)) {
      return <iframe src={fileUrl} width="100%" height="100%" style={{ border: 'none', background: 'white' }} title={file.fileName}></iframe>;
    }
    
    return (
      <div style={{ textAlign: 'center', color: '#a1a1aa', padding: '40px' }}>
        <svg viewBox="0 0 24 24" width="64" height="64" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ marginBottom: '16px', opacity: 0.5 }}>
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
        </svg>
        <h4>Preview not available for this file type</h4>
        <p style={{ fontSize: '13px', margin: '8px 0 16px 0' }}>{file.fileSize}</p>
        <button className="db-btn-primary" onClick={() => handleDownloadFile(file._id)}>
          Download File
        </button>
      </div>
    );
  };

  // Restore trash items
  const handleRestore = async (id, type) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/restoreItem`, {
        method: "PUT",
        headers: {
          'Content-Type': 'application/json',
          'authorization': token
        },
        body: JSON.stringify({ itemId: id, type })
      });
      if (res.ok) {
        fetchTrash();
        fetchFolderContents(currentFolderId);
        alert("Item restored successfully!");
      }
    } catch (err) {
      console.error("Error restoring item:", err);
    }
  };

  // Permanent deletion
  const handlePermanentDelete = async (id, type) => {
    if (!window.confirm("Are you sure you want to permanently delete this item? This action is irreversible and will physically delete files from the disk.")) return;
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/permanentDeleteItem`, {
        method: "DELETE",
        headers: {
          'Content-Type': 'application/json',
          'authorization': token
        },
        body: JSON.stringify({ itemId: id, type })
      });
      if (res.ok) {
        fetchTrash();
        fetchFolderContents(currentFolderId);
        alert("Item permanently deleted.");
      }
    } catch (err) {
      console.error("Error permanently deleting item:", err);
    }
  };

  // Filter lists based on search bar
  const filteredFolders = folders.filter(folder =>
    folder.folderName.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const filteredFiles = files.filter(file =>
    file.fileName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Compute storage utilization size visually
  const totalUsedPercent = Math.min(Math.round((storageUsedBytes / 2147483648) * 100), 100);

  return (
    <div className="dashboard-root">
      {/* Hidden upload input */}
      <input
        type="file"
        id="file-upload-input"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />

      {/* Top Header */}
      <header className="db-header">
        {mobileSearchOpen && (
          <div className="db-mobile-search-overlay">
            <div className="db-mobile-search-wrapper">
              <svg className="db-search-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                className="db-mobile-search-input"
                placeholder="Search everything in your cloud..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
              />
              <button 
                className="db-mobile-search-close" 
                onClick={() => { setMobileSearchOpen(false); setSearchQuery(''); }}
              >
                &times;
              </button>
            </div>
          </div>
        )}
        <div className="db-header-left">
          <Link to="/dashboard" className="db-logo-wrapper" onClick={() => { setActiveTab('files'); setCurrentFolderId(localStorage.getItem('parentfolderId')); }}>
            <div className="db-logo">
              <svg viewBox="0 0 24 24">
                <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z" />
              </svg>
            </div>
            <h1 className="db-title">AeroDrive</h1>
          </Link>
        </div>

        <div className="db-search-container">
          <div className="db-search-wrapper">
            <svg className="db-search-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              className="db-search-input"
              placeholder="Search everything in your cloud..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="db-header-right">
          <button 
            className="db-icon-btn db-mobile-search-toggle" 
            title="Search" 
            onClick={() => setMobileSearchOpen(true)}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>
          <button className="db-icon-btn" title="Help" onClick={() => setShowHelpModal(true)}>
            <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          </button>
          <button className="db-icon-btn" title="Settings" onClick={() => setShowSettings(true)}>
            <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
          </button>
          <div
            className="db-user-avatar"
            onClick={handleLogout}
            title={`Log Out (${user.name})`}
          >
            {user.name.trim().charAt(0).toUpperCase()}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="db-main-container">
        {/* Sidebar */}
        <aside className="db-sidebar">
          <ul className="db-nav-list">
            <li>
              <button
                className={`db-nav-link ${activeTab === 'files' ? 'active' : ''}`}
                onClick={() => { setActiveTab('files'); setCurrentFolderId(localStorage.getItem('parentfolderId')); }}
              >
                <svg viewBox="0 0 24 24"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
                <span className="db-nav-text">Files</span>
              </button>
            </li>
            <li>
              <button
                className={`db-nav-link ${activeTab === 'recent' ? 'active' : ''}`}
                onClick={() => setActiveTab('recent')}
              >
                <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                <span className="db-nav-text">Recent</span>
              </button>
            </li>

            <li>
              <button
                className={`db-nav-link ${activeTab === 'trash' ? 'active' : ''}`}
                onClick={() => setActiveTab('trash')}
              >
                <svg viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                <span className="db-nav-text">Recycle bin</span>
              </button>
            </li>
          </ul>

          <div className="db-sidebar-footer">
            <div className="db-storage-card">
              <div className="db-storage-info">
                <span>Storage</span>
                <span>{totalUsedPercent}% used</span>
              </div>
              <div className="db-storage-bar-bg">
                <div className="db-storage-bar-fill" style={{ width: `${totalUsedPercent}%` }}></div>
              </div>
              <span style={{ fontSize: '11px', display: 'block', marginTop: '6px', marginBottom: '12px', color: 'var(--text)' }}>
                {storageUsed} used of 2 GB
              </span>
              <button className="db-premium-btn" onClick={() => navigate('/upgrade')}>Upgrade to Pro</button>
            </div>
          </div>
        </aside>

        {/* Content Explorer Panel */}
        <main className="db-content-area">
          {/* Action Toolbar */}
          <div className="db-toolbar">
            <div className="db-toolbar-left">
              <div className="db-new-dropdown-container db-desktop-only-btn">
                <button 
                  className="db-btn-primary" 
                  disabled={activeTab !== 'files'}
                  onClick={() => setShowNewDropdown(!showNewDropdown)}
                >
                  <svg viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                  New
                </button>
                {showNewDropdown && (
                  <>
                    <div className="db-dropdown-backdrop" onClick={() => setShowNewDropdown(false)}></div>
                    <div className="db-new-dropdown">
                      <div 
                        className="db-dropdown-item" 
                        onClick={() => { setShowNewDropdown(false); setShowCreateFolderModal(true); }}
                      >
                        <svg className="db-dropdown-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
                        <span>New Folder</span>
                      </div>
                      <div 
                        className="db-dropdown-item" 
                        onClick={handleUploadClick}
                      >
                        <svg className="db-dropdown-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
                        <span>Upload File</span>
                      </div>
                    </div>
                  </>
                )}
              </div>
              <button 
                className="db-btn-secondary db-desktop-only-btn" 
                disabled={activeTab !== 'files'}
                onClick={handleUploadClick}
              >
                <svg viewBox="0 0 24 24"><polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/></svg>
                Upload
              </button>
              <button 
                className="db-btn-secondary" 
                disabled={!selectedItem || activeTab !== 'files'} 
                onClick={handleRename}
              >
                <svg viewBox="0 0 24 24"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                <span>Rename</span>
              </button>
              <button 
                className="db-btn-secondary" 
                disabled={!selectedItem || activeTab !== 'files'} 
                onClick={() => handleDelete()}
                style={{ color: '#ef4444' }}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                <span>Delete</span>
              </button>
            </div>

            <div className="db-toolbar-right">
              <button className="db-icon-btn" title="Sort options" onClick={() => alert('Sorted automatically by name.')}>
                <svg viewBox="0 0 24 24"><line x1="4" y1="9" x2="20" y2="9"/><line x1="4" y1="15" x2="14" y2="15"/><polyline points="14 15 18 11 18 19"/></svg>
              </button>
            </div>
          </div>

          {/* Body content */}
          <div className="db-body">
            {/* Breadcrumbs (only show in 'files' tab) */}
            {activeTab === 'files' && (
              <nav className="db-breadcrumbs">
                <button
                  className="db-breadcrumb-item"
                  style={{ background: 'none', border: 'none', font: 'inherit', padding: 0, cursor: 'pointer' }}
                  onClick={() => setCurrentFolderId(localStorage.getItem('parentfolderId'))}
                >
                  Files
                </button>
                {breadcrumbs.map((crumb, idx) => (
                  <React.Fragment key={crumb.id}>
                    <span className="db-breadcrumb-separator">&gt;</span>
                    <button
                      className={`db-breadcrumb-item ${idx === breadcrumbs.length - 1 ? 'active' : ''}`}
                      style={{ background: 'none', border: 'none', font: 'inherit', padding: 0, cursor: idx === breadcrumbs.length - 1 ? 'default' : 'pointer' }}
                      onClick={() => setCurrentFolderId(crumb.id)}
                    >
                      {crumb.name}
                    </button>
                  </React.Fragment>
                ))}
              </nav>
            )}

            {/* Onboarding Promo Cards */}
            {promoCards.length > 0 && activeTab === 'files' && breadcrumbs.length === 1 && (
              <div className="db-promo-grid">
                {promoCards.map((promo) => (
                  <div className="db-promo-card" key={promo.id}>
                    <button className="db-promo-close" onClick={() => handleClosePromo(promo.id)} title="Dismiss">
                      &times;
                    </button>
                    <div className="db-promo-icon">
                      {promo.icon}
                    </div>
                    <h3 className="db-promo-title">{promo.title}</h3>
                    <p className="db-promo-desc">{promo.desc}</p>
                    <a href={`#${promo.id}`} className="db-promo-action" onClick={(e) => { e.preventDefault(); handleUploadClick(); }}>
                      {promo.actionText}
                    </a>
                  </div>
                ))}
              </div>
            )}

            {/* Render tabs */}
            {activeTab === 'files' ? (
              <div>
                {/* Folders Section */}
                {filteredFolders.length > 0 && (
                  <div style={{ marginBottom: '32px' }}>
                    <h2 className="db-section-title">Folders</h2>
                    <div className="db-explorer-grid">
                      {filteredFolders.map((folder) => (
                        <div
                          className={`db-folder-card ${selectedItem?.id === folder._id ? 'selected' : ''}`}
                          key={folder._id}
                          onClick={() => setSelectedItem({ id: folder._id, type: 'folder', name: folder.folderName })}
                          onDoubleClick={() => setCurrentFolderId(folder._id)}
                        >
                          <div className="db-folder-top">
                            <div className="db-folder-icon-wrapper" onDoubleClick={(e) => { e.stopPropagation(); setCurrentFolderId(folder._id); }} style={{ cursor: 'pointer' }}>
                              <svg viewBox="0 0 48 48" fill="none">
                                <path d="M4 10C4 7.79086 5.79086 6 8 6H18.5858C19.6467 6 20.6641 6.42143 21.4142 7.17157L25.8284 11.5858C26.5786 12.3359 27.596 12.7574 28.6569 12.7574H40C42.2091 12.7574 44 14.5482 44 16.7574V40C44 42.2091 42.2091 44 40 44H8C5.79086 44 4 42.2091 4 40V10Z" fill="url(#folder-gradient)" />
                                <path opacity="0.15" d="M4 18H44V40C44 42.2091 42.2091 44 40 44H8C5.79086 44 4 42.2091 4 40V18Z" fill="white" />
                                <defs>
                                  <linearGradient id="folder-gradient" x1="4" y1="6" x2="44" y2="44" gradientUnits="userSpaceOnUse">
                                    <stop stopColor="var(--accent)" />
                                    <stop offset="1" stopColor="#3b82f6" />
                                  </linearGradient>
                                </defs>
                              </svg>
                            </div>
                            <button 
                              className="db-folder-more-btn-mobile" 
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveMobileMenu({ item: folder, type: 'folder' });
                              }}
                              title="Folder Actions"
                            >
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/>
                              </svg>
                            </button>
                          </div>
                          <h4 className="db-folder-name" title={folder.folderName}>{folder.folderName}</h4>
                          <span className="db-folder-date">{new Date(folder.modifiedDate).toLocaleDateString()}</span>
                          
                          <div className="db-folder-actions" onClick={(e) => e.stopPropagation()}>
                            <button className="db-folder-action-btn" title="Open Folder" onClick={() => setCurrentFolderId(folder._id)}>
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13l5-5-5-5M23 8H8a4 4 0 0 0-4 4v9"/></svg>
                            </button>
                            <button className="db-folder-action-btn" title="Rename" onClick={() => { setSelectedItem({ id: folder._id, type: 'folder', name: folder.folderName }); handleRename(); }}>
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                            </button>
                            <button className="db-folder-action-btn" title="Delete" onClick={() => handleDelete(folder._id, 'folder')}>
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Files Section */}
                <div>
                  <h2 className="db-section-title">Files</h2>
                  {filteredFiles.length > 0 ? (
                    <div className="db-file-list">
                      {filteredFiles.map((file) => (
                        <div
                          className={`db-file-row ${selectedItem?.id === file._id ? 'selected' : ''} ${sharingFile?._id === file._id ? 'sharing-active' : ''}`}
                          key={file._id}
                          onClick={() => setSelectedItem({ id: file._id, type: 'file', name: file.fileName })}
                          onDoubleClick={() => handleViewFile(file)}
                        >
                          <div className="db-file-row-main" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                            <div className="db-file-left">
                              {getFileIcon(file.fileName)}
                              <span className="db-file-name">{file.fileName}</span>
                            </div>
                            
                            <div className="db-file-right">
                              <div className="db-file-actions" onClick={(e) => e.stopPropagation()}>
                                <button className="db-file-action-btn" title="Preview" onClick={() => handleViewFile(file)}>
                                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                                </button>
                                <button className="db-file-action-btn" title="Download" onClick={() => handleDownloadFile(file._id)}>
                                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                                </button>
                                <button className="db-file-action-btn" title="Share" onClick={() => handleShareClick(file)}>
                                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
                                </button>
                                <button className="db-file-action-btn" title="Rename" onClick={() => { setSelectedItem({ id: file._id, type: 'file', name: file.fileName }); handleRename(); }}>
                                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                                </button>
                                <button className="db-file-action-btn" title="Delete" onClick={() => handleDelete(file._id, 'file')}>
                                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                                </button>
                              </div>
                              <button 
                                className="db-file-action-btn db-mobile-more-btn"
                                title="More actions"
                                onClick={(e) => { 
                                  e.stopPropagation(); 
                                  setActiveMobileMenu({ item: file, type: 'file' }); 
                                }}
                              >
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                  <circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/>
                                </svg>
                              </button>
                              <span className="db-file-size">{file.fileSize}</span>
                              <span className="db-file-date">{new Date(file.modifiedDate).toLocaleDateString()}</span>
                            </div>
                          </div>

                          {sharingFile?._id === file._id && (
                            <div className="db-file-row-share-panel" onClick={(e) => e.stopPropagation()}>
                              <div className="db-inline-share-desc">
                                Generate a temporary public link. Anyone with this link can access this file without logging in.
                              </div>
                              {!shareUrl ? (
                                <form onSubmit={handleGenerateShareLink} className="db-inline-share-form">
                                  <div className="db-inline-share-controls">
                                    <div className="db-inline-share-select-wrapper">
                                      <label className="db-inline-share-label">Expires in:</label>
                                      <select 
                                        className="db-inline-share-select" 
                                        value={shareDuration} 
                                        onChange={(e) => setShareDuration(e.target.value)}
                                      >
                                        <option value="5s">5 Seconds (Testing)</option>
                                        <option value="5m">5 Minutes</option>
                                        <option value="1h">1 Hour</option>
                                        <option value="1d">1 Day</option>
                                        <option value="7d">7 Days</option>
                                      </select>
                                    </div>
                                    <div className="db-inline-share-actions">
                                      <button 
                                        type="button" 
                                        className="db-inline-share-btn cancel" 
                                        onClick={() => setSharingFile(null)}
                                      >
                                        Cancel
                                      </button>
                                      <button 
                                        type="submit" 
                                        className="db-inline-share-btn generate" 
                                        disabled={isGeneratingShareLink}
                                      >
                                        {isGeneratingShareLink ? 'Generating...' : 'Generate Link'}
                                      </button>
                                    </div>
                                  </div>
                                </form>
                              ) : (
                                <div className="db-inline-share-result">
                                  <div className="db-inline-share-link-wrapper">
                                    <input
                                      type="text"
                                      readOnly
                                      value={shareUrl}
                                      className="db-inline-share-input"
                                      onClick={(e) => e.target.select()}
                                    />
                                    <button
                                      type="button"
                                      className="db-inline-share-btn copy"
                                      onClick={handleCopyShareLink}
                                    >
                                      {copiedUrl ? 'Copied!' : 'Copy Link'}
                                    </button>
                                    <button
                                      type="button"
                                      className="db-inline-share-btn close"
                                      onClick={() => setSharingFile(null)}
                                    >
                                      Close
                                    </button>
                                  </div>
                                  <span className="db-inline-share-expiry-info">
                                    Valid for {shareDuration === '5s' ? '5 seconds' : shareDuration === '5m' ? '5 minutes' : shareDuration === '1h' ? '1 hour' : shareDuration === '1d' ? '1 day' : '7 days'}.
                                  </span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    filteredFolders.length === 0 && (
                      <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text)' }}>
                        <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ marginBottom: '16px', opacity: 0.5 }}>
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
                        </svg>
                        <h3>This folder is empty</h3>
                        <p style={{ fontSize: '14px' }}>Click "New" or "Upload" to get started adding folders and files!</p>
                      </div>
                    )
                  )}
                </div>
              </div>
            ) : activeTab === 'recent' ? (
              /* Recent files tab */
              <div>
                <h2 className="db-section-title">Recent Files</h2>
                {recentFilesList.length > 0 ? (
                  <div className="db-file-list">
                    {recentFilesList.map((file) => (
                      <div
                        className={`db-file-row ${selectedItem?.id === file._id ? 'selected' : ''} ${sharingFile?._id === file._id ? 'sharing-active' : ''}`}
                        key={file._id}
                        onClick={() => setSelectedItem({ id: file._id, type: 'file', name: file.fileName })}
                        onDoubleClick={() => handleViewFile(file)}
                      >
                        <div className="db-file-row-main" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                          <div className="db-file-left">
                            {getFileIcon(file.fileName)}
                            <span className="db-file-name">{file.fileName}</span>
                          </div>
                           <div className="db-file-right">
                            <div className="db-file-actions" onClick={(e) => e.stopPropagation()}>
                              <button className="db-file-action-btn" title="Preview" onClick={() => handleViewFile(file)}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                              </button>
                              <button className="db-file-action-btn" title="Download" onClick={() => handleDownloadFile(file._id)}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                              </button>
                              <button className="db-file-action-btn" title="Share" onClick={() => handleShareClick(file)}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
                              </button>
                            </div>
                            <button 
                              className="db-file-action-btn db-mobile-more-btn"
                              title="More actions"
                              onClick={(e) => { 
                                e.stopPropagation(); 
                                setActiveMobileMenu({ item: file, type: 'file' }); 
                              }}
                            >
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/>
                              </svg>
                            </button>
                            <span className="db-file-size">{file.fileSize}</span>
                            <span className="db-file-date">{new Date(file.modifiedDate).toLocaleDateString()}</span>
                          </div>
                        </div>

                        {sharingFile?._id === file._id && (
                          <div className="db-file-row-share-panel" onClick={(e) => e.stopPropagation()}>
                            <div className="db-inline-share-desc">
                              Generate a temporary public link. Anyone with this link can access this file without logging in.
                            </div>
                            {!shareUrl ? (
                              <form onSubmit={handleGenerateShareLink} className="db-inline-share-form">
                                <div className="db-inline-share-controls">
                                  <div className="db-inline-share-select-wrapper">
                                    <label className="db-inline-share-label">Expires in:</label>
                                    <select 
                                      className="db-inline-share-select" 
                                      value={shareDuration} 
                                      onChange={(e) => setShareDuration(e.target.value)}
                                    >
                                      <option value="5s">5 Seconds (Testing)</option>
                                      <option value="5m">5 Minutes</option>
                                      <option value="1h">1 Hour</option>
                                      <option value="1d">1 Day</option>
                                      <option value="7d">7 Days</option>
                                    </select>
                                  </div>
                                  <div className="db-inline-share-actions">
                                    <button 
                                      type="button" 
                                      className="db-inline-share-btn cancel" 
                                      onClick={() => setSharingFile(null)}
                                    >
                                      Cancel
                                    </button>
                                    <button 
                                      type="submit" 
                                      className="db-inline-share-btn generate" 
                                      disabled={isGeneratingShareLink}
                                    >
                                      {isGeneratingShareLink ? 'Generating...' : 'Generate Link'}
                                    </button>
                                  </div>
                                </div>
                              </form>
                            ) : (
                              <div className="db-inline-share-result">
                                <div className="db-inline-share-link-wrapper">
                                  <input
                                    type="text"
                                    readOnly
                                    value={shareUrl}
                                    className="db-inline-share-input"
                                    onClick={(e) => e.target.select()}
                                  />
                                  <button
                                    type="button"
                                    className="db-inline-share-btn copy"
                                    onClick={handleCopyShareLink}
                                  >
                                    {copiedUrl ? 'Copied!' : 'Copy Link'}
                                  </button>
                                  <button
                                    type="button"
                                    className="db-inline-share-btn close"
                                    onClick={() => setSharingFile(null)}
                                  >
                                    Close
                                  </button>
                                </div>
                                <span className="db-inline-share-expiry-info">
                                  Valid for {shareDuration === '5s' ? '5 seconds' : shareDuration === '5m' ? '5 minutes' : shareDuration === '1h' ? '1 hour' : shareDuration === '1d' ? '1 day' : '7 days'}.
                                </span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text)' }}>
                    <h3>No recent files found</h3>
                  </div>
                )}
              </div>
            ) : (
              /* Trash Recycle Bin tab */
              <div>
                <h2 className="db-section-title">Recycle Bin</h2>
                {(trashFolders.length > 0 || trashFiles.length > 0) ? (
                  <div className="db-file-list">
                    {trashFolders.map((folder) => (
                      <div className="db-file-row" key={folder._id}>
                        <div className="db-file-left">
                          <div className="db-file-icon-wrapper file-doc">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
                          </div>
                          <span className="db-file-name" style={{ color: 'var(--text)' }}>{folder.folderName} (Folder)</span>
                        </div>
                        <div className="db-file-right">
                          <div className="db-file-actions" onClick={(e) => e.stopPropagation()}>
                            <button className="db-trash-action-btn restore" title="Restore" onClick={() => handleRestore(folder._id, 'folder')}>
                              Restore
                            </button>
                            <button className="db-trash-action-btn delete-perm" title="Delete Permanently" onClick={() => handlePermanentDelete(folder._id, 'folder')}>
                              Delete Permanently
                            </button>
                          </div>
                          <button 
                            className="db-file-action-btn db-mobile-more-btn"
                            title="More actions"
                            onClick={(e) => { 
                              e.stopPropagation(); 
                              setActiveMobileMenu({ item: folder, type: 'trash-folder' }); 
                            }}
                          >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                              <circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/>
                            </svg>
                          </button>
                          <span className="db-file-size">--</span>
                          <span className="db-file-date">{new Date(folder.modifiedDate).toLocaleDateString()}</span>
                        </div>
                      </div>
                    ))}
                    {trashFiles.map((file) => (
                      <div className="db-file-row" key={file._id}>
                        <div className="db-file-left">
                          {getFileIcon(file.fileName)}
                          <span className="db-file-name">{file.fileName}</span>
                        </div>
                        <div className="db-file-right">
                          <div className="db-file-actions" onClick={(e) => e.stopPropagation()}>
                            <button className="db-trash-action-btn restore" title="Restore" onClick={() => handleRestore(file._id, 'file')}>
                              Restore
                            </button>
                            <button className="db-trash-action-btn delete-perm" title="Delete Permanently" onClick={() => handlePermanentDelete(file._id, 'file')}>
                              Delete Permanently
                            </button>
                          </div>
                          <button 
                            className="db-file-action-btn db-mobile-more-btn"
                            title="More actions"
                            onClick={(e) => { 
                              e.stopPropagation(); 
                              setActiveMobileMenu({ item: file, type: 'trash-file' }); 
                            }}
                          >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                              <circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/>
                            </svg>
                          </button>
                          <span className="db-file-size">{file.fileSize}</span>
                          <span className="db-file-date">{new Date(file.modifiedDate).toLocaleDateString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text)' }}>
                    <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ marginBottom: '16px', opacity: 0.5 }}>
                      <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                    </svg>
                    <h3>Recycle bin is empty</h3>
                  </div>
                )}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Settings Panel Backdrop */}
      {showSettings && (
        <div className="db-settings-backdrop" onClick={() => setShowSettings(false)}></div>
      )}

      {/* Settings Drawer Panel */}
      <div className={`db-settings-drawer ${showSettings ? 'open' : ''}`}>
        <div className="db-settings-header">
          <h2>Settings</h2>
          <button className="db-settings-close" onClick={() => setShowSettings(false)} title="Close settings">
            &times;
          </button>
        </div>

        <div className="db-settings-drawer-body" style={{ padding: '20px' }}>
          <div className="settings-item">
            <div className="settings-section-title">Account Details</div>
            <div className="settings-profile" style={{ display: 'flex', gap: '12px', alignItems: 'center', margin: '12px 0' }}>
              <div className="settings-profile-avatar">
                {user.name.trim().charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="settings-profile-name" style={{ fontWeight: 600, color: 'var(--text-h)' }}>{user.name}</div>
                <div className="settings-profile-email" style={{ fontSize: '12px', color: 'var(--text)' }}>{user.email}</div>
              </div>
            </div>
          </div>

          <div className="settings-item" style={{ marginTop: '24px' }}>
            <div className="settings-section-title">General Preferences</div>
            <label className="settings-option" style={{ display: 'flex', justifyContent: 'space-between', margin: '12px 0', cursor: 'pointer' }}>
              <span style={{ color: 'var(--text-h)' }}>Dark Mode</span>
              <input
                type="checkbox"
                className="settings-toggle-checkbox"
                checked={isDark}
                onChange={(e) => setIsDark(e.target.checked)}
              />
            </label>
          </div>

          <div className="settings-item db-mobile-only-storage" style={{ marginTop: '24px' }}>
            <div className="settings-section-title">Storage Space</div>
            <div className="db-storage-card" style={{ padding: '12px 0 0 0' }}>
              <div className="db-storage-info">
                <span>Storage</span>
                <span>{totalUsedPercent}% used</span>
              </div>
              <div className="db-storage-bar-bg">
                <div className="db-storage-bar-fill" style={{ width: `${totalUsedPercent}%` }}></div>
              </div>
              <span style={{ fontSize: '11px', display: 'block', marginTop: '6px', marginBottom: '12px', color: 'var(--text)' }}>
                {storageUsed} used of 2 GB
              </span>
              <button className="db-premium-btn" onClick={() => { setShowSettings(false); navigate('/upgrade'); }}>Upgrade to Pro</button>
            </div>
          </div>

          <div className="settings-item" style={{ marginTop: '32px' }}>
            <button className="auth-submit-btn" style={{ padding: '10px', width: '100%', borderRadius: '8px', cursor: 'pointer' }} onClick={handleLogout}>
              Sign Out
            </button>
          </div>
        </div>
      </div>

      {/* File Preview Modal */}
      {previewFile && (
        <div className="db-modal-overlay">
          <div className="db-modal-backdrop" onClick={() => setPreviewFile(null)}></div>
          <div className="db-modal-content" style={{ maxWidth: '80%', width: '900px', height: '80vh', display: 'flex', flexDirection: 'column', padding: 0 }}>
            <div className="db-modal-header" style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: 0 }}>
                {getFileIcon(previewFile.fileName)}
                <span style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-h)' }}>{previewFile.fileName}</span>
              </h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <button className="db-btn-secondary" style={{ padding: '6px 12px', fontSize: '13px' }} onClick={() => handleDownloadFile(previewFile._id)}>
                  Download
                </button>
                <button className="db-modal-close-btn" style={{ fontSize: '24px', cursor: 'pointer', background: 'none', border: 'none', color: 'var(--text)' }} onClick={() => setPreviewFile(null)}>&times;</button>
              </div>
            </div>
            <div className="db-modal-body" style={{ flexGrow: 1, padding: 0, background: '#121214', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
              {renderPreviewContent(previewFile)}
            </div>
          </div>
        </div>
      )}

      {/* Create Folder Modal */}
      {showCreateFolderModal && (
        <div className="db-modal-overlay">
          <div className="db-modal-backdrop" onClick={() => setShowCreateFolderModal(false)}></div>
          <div className="db-modal-content">
            <div className="db-modal-header">
              <h3>Create New Folder</h3>
              <button className="db-modal-close-btn" onClick={() => setShowCreateFolderModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleCreateFolder}>
              <div className="db-modal-body">
                <div className="db-modal-input-wrapper">
                  <input
                    type="text"
                    className="db-modal-input"
                    placeholder="Folder name"
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    autoFocus
                  />
                </div>
              </div>
              <div className="db-modal-footer">
                <button type="button" className="db-modal-btn db-modal-btn-secondary" onClick={() => setShowCreateFolderModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="db-modal-btn db-modal-btn-primary">
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Upload Progress Widget */}
      {uploadProgress && (
        <div className={`db-upload-progress-widget ${uploadProgress.status}`}>
          <div className="db-upload-progress-header">
            <span className="db-upload-progress-status-icon">
              {uploadProgress.status === 'uploading' && (
                <svg className="db-spinner" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <circle cx="12" cy="12" r="10" strokeDasharray="30" strokeDashoffset="0"></circle>
                </svg>
              )}
              {uploadProgress.status === 'processing' && (
                <svg className="db-spinner processing" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <circle cx="12" cy="12" r="10" strokeDasharray="30" strokeDashoffset="0"></circle>
                </svg>
              )}
              {uploadProgress.status === 'success' && (
                <svg viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              )}
              {uploadProgress.status === 'error' && (
                <svg viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              )}
            </span>
            <div className="db-upload-progress-info">
              <div className="db-upload-progress-filename" title={uploadProgress.fileName}>
                {uploadProgress.fileName}
              </div>
              <div className="db-upload-progress-status-text">
                {uploadProgress.status === 'uploading' && `Uploading... (${uploadProgress.uploadedBytes} of ${uploadProgress.fileSize})`}
                {uploadProgress.status === 'processing' && 'Processing file...'}
                {uploadProgress.status === 'success' && 'Upload complete!'}
                {uploadProgress.status === 'error' && 'Upload failed'}
              </div>
            </div>
            {uploadProgress.status !== 'uploading' && uploadProgress.status !== 'processing' && (
              <button className="db-upload-progress-close" onClick={() => setUploadProgress(null)} title="Dismiss">
                &times;
              </button>
            )}
          </div>
          <div className="db-upload-progress-bar-container">
            <div 
              className="db-upload-progress-bar" 
              style={{ width: `${uploadProgress.percentage}%` }}
            ></div>
          </div>
          <div className="db-upload-progress-footer">
            <span className="db-upload-progress-percent">{uploadProgress.percentage}%</span>
            <span className="db-upload-progress-filesize">{uploadProgress.fileSize}</span>
          </div>
        </div>
      )}

      {/* Help Quick Guide Modal */}
      {showHelpModal && (
        <div className="db-modal-overlay">
          <div className="db-modal-backdrop" onClick={() => setShowHelpModal(false)}></div>
          <div className="db-modal-content" style={{ maxWidth: '420px', padding: '24px' }}>
            <div className="db-modal-header" style={{ borderBottom: 'none', padding: 0, marginBottom: '16px' }}>
              <h3 style={{ margin: 0, color: 'var(--text-h)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
                Quick Help Guide
              </h3>
              <button className="db-modal-close-btn" onClick={() => setShowHelpModal(false)} style={{ fontSize: '24px', cursor: 'pointer', background: 'none', border: 'none', color: 'var(--text)' }}>&times;</button>
            </div>
            <div className="db-modal-body" style={{ padding: 0, fontSize: '14px', lineHeight: '1.6', color: 'var(--text)' }}>
              <ul style={{ margin: 0, paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <li><strong>Select Items:</strong> Single click on folders or files to highlight them and reveal operations like rename and delete in the toolbar.</li>
                <li><strong>Navigate Folders:</strong> Double click on any folder card to explore its contents. Use the breadcrumb bar to go back.</li>
                <li><strong>Preview Files:</strong> Double click on any file row or click the preview eye icon to play audio/video or view PDF documents inline.</li>
                <li><strong>Manage Settings:</strong> Click the gear icon to toggle Dark Mode or sign out of your account.</li>
              </ul>
            </div>
            <div className="db-modal-footer" style={{ borderTop: 'none', padding: 0, marginTop: '24px', justifyContent: 'flex-end' }}>
              <button className="db-modal-btn db-modal-btn-primary" onClick={() => setShowHelpModal(false)} style={{ padding: '8px 16px', borderRadius: '8px' }}>
                Got it!
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Bottom Navigation */}
      <nav className="db-mobile-nav">
        <button 
          className={`db-mobile-nav-item ${activeTab === 'files' ? 'active' : ''}`}
          onClick={() => { setActiveTab('files'); setCurrentFolderId(localStorage.getItem('parentfolderId') || ''); }}
        >
          <svg viewBox="0 0 24 24"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
          <span className="db-mobile-nav-text">Files</span>
        </button>
        <button 
          className={`db-mobile-nav-item ${activeTab === 'recent' ? 'active' : ''}`}
          onClick={() => setActiveTab('recent')}
        >
          <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          <span className="db-mobile-nav-text">Recent</span>
        </button>
        <button 
          className={`db-mobile-nav-item ${activeTab === 'trash' ? 'active' : ''}`}
          onClick={() => setActiveTab('trash')}
        >
          <svg viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
          <span className="db-mobile-nav-text">Recycle</span>
        </button>
      </nav>

      {/* Mobile Floating Action Button (FAB) */}
      {activeTab === 'files' && (
        <div className="db-mobile-fab-container">
          {mobileNewMenuOpen && (
            <>
              <div className="db-fab-backdrop" onClick={() => setMobileNewMenuOpen(false)}></div>
              <div className="db-fab-menu">
                <button 
                  className="db-fab-menu-item" 
                  onClick={() => { setMobileNewMenuOpen(false); setShowCreateFolderModal(true); }}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
                  <span>New Folder</span>
                </button>
                <button 
                  className="db-fab-menu-item" 
                  onClick={() => { setMobileNewMenuOpen(false); handleUploadClick(); }}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
                  <span>Upload File</span>
                </button>
              </div>
            </>
          )}
          <button 
            className={`db-mobile-fab ${mobileNewMenuOpen ? 'open' : ''}`}
            onClick={() => setMobileNewMenuOpen(!mobileNewMenuOpen)}
            title="New Item"
          >
            <svg viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          </button>
        </div>
      )}

      {/* Mobile Bottom Action Sheet */}
      {activeMobileMenu && (
        <>
          <div className="db-mobile-menu-backdrop" onClick={() => setActiveMobileMenu(null)}></div>
          <div className="db-mobile-menu-sheet">
            <div className="db-mobile-menu-header">
              <div className="db-mobile-menu-title-wrapper">
                {(activeMobileMenu.type === 'file' || activeMobileMenu.type === 'trash-file') ? getFileIcon(activeMobileMenu.item.fileName) : (
                  <svg className="db-mobile-menu-folder-icon" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
                )}
                <span className="db-mobile-menu-title">
                  {activeMobileMenu.type.includes('file') ? activeMobileMenu.item.fileName : activeMobileMenu.item.folderName}
                </span>
              </div>
              <button className="db-mobile-menu-close-btn" onClick={() => setActiveMobileMenu(null)}>&times;</button>
            </div>
            
            <div className="db-mobile-menu-body">
              {activeMobileMenu.type === 'folder' && (
                <button 
                  className="db-mobile-menu-action"
                  onClick={() => { 
                    setCurrentFolderId(activeMobileMenu.item._id); 
                    setActiveMobileMenu(null); 
                  }}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13l5-5-5-5M23 8H8a4 4 0 0 0-4 4v9"/></svg>
                  <span>Open Folder</span>
                </button>
              )}
              
              {activeMobileMenu.type === 'file' && (
                <>
                  <button 
                    className="db-mobile-menu-action"
                    onClick={() => { 
                      handleViewFile(activeMobileMenu.item); 
                      setActiveMobileMenu(null); 
                    }}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    <span>Preview</span>
                  </button>
                  <button 
                    className="db-mobile-menu-action"
                    onClick={() => { 
                      handleDownloadFile(activeMobileMenu.item._id); 
                      setActiveMobileMenu(null); 
                    }}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                    <span>Download</span>
                  </button>
                  <button 
                    className="db-mobile-menu-action"
                    onClick={() => { 
                      handleShareClick(activeMobileMenu.item); 
                      setActiveMobileMenu(null); 
                    }}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
                    <span>Share Link</span>
                  </button>
                </>
              )}
              
              {(activeMobileMenu.type === 'file' || activeMobileMenu.type === 'folder') && (
                <>
                  <button 
                    className="db-mobile-menu-action"
                    onClick={() => { 
                      setSelectedItem({ 
                        id: activeMobileMenu.item._id, 
                        type: activeMobileMenu.type, 
                        name: activeMobileMenu.type === 'file' ? activeMobileMenu.item.fileName : activeMobileMenu.item.folderName 
                      }); 
                      setActiveMobileMenu(null); 
                      handleRename(); 
                    }}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                    <span>Rename</span>
                  </button>
                  
                  <button 
                    className="db-mobile-menu-action"
                    style={{ color: '#ef4444' }}
                    onClick={() => { 
                      handleDelete(activeMobileMenu.item._id, activeMobileMenu.type); 
                      setActiveMobileMenu(null); 
                    }}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                    <span>Delete</span>
                  </button>
                </>
              )}

              {(activeMobileMenu.type === 'trash-file' || activeMobileMenu.type === 'trash-folder') && (
                <>
                  <button 
                    className="db-mobile-menu-action"
                    onClick={() => { 
                      handleRestore(activeMobileMenu.item._id, activeMobileMenu.type === 'trash-file' ? 'file' : 'folder'); 
                      setActiveMobileMenu(null); 
                    }}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
                    <span>Restore</span>
                  </button>
                  <button 
                    className="db-mobile-menu-action"
                    style={{ color: '#ef4444' }}
                    onClick={() => { 
                      handlePermanentDelete(activeMobileMenu.item._id, activeMobileMenu.type === 'trash-file' ? 'file' : 'folder'); 
                      setActiveMobileMenu(null); 
                    }}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                    <span>Delete Permanently</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </>
      )}

    </div>
  );
}

export default Dashboard;

