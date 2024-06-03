import React, { useState, useContext, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Tooltip } from 'react-tooltip';
import Modal from 'react-modal';
import axios from 'axios';
import './EditLink.css';
import { UserContext } from '../contexts/UserContext'; // Adjust the path as necessary
import './EditLink.css'; // Import the CSS file for custom styles
import ConversionChart from '../components/ConversionChart'; // Adjust the path as necessary

Modal.setAppElement('#root'); // Ensure this matches the root element in your HTML

const apiUrl = process.env.REACT_APP_API_URL;

function popup(url) {
  window.open(url, 'Share on Twitter', 'height=150,width=550');
}

const EditLink = () => {
  const { permalink } = useParams();
  const navigate = useNavigate(); // Use useNavigate instead of useHistory
  const { user, setUser } = useContext(UserContext); // Access user context
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    url: '',
    previewUrl: '',
    description: '',
    downloadLimit: 0,
    views: 0,
    conversion: 0,
    numberOfDownloads: 0,
    totalProfit: 0,
  });
  const [file, setFile] = useState(null);
  const [previewFile, setPreviewFile] = useState(null);
  const [isFileModalOpen, setIsFileModalOpen] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [productLink, setProductLink] = useState(''); 

  useEffect(() => {
    const checkLoggedIn = async () => {
      try {
        const response = await axios.get(`${apiUrl}/api/check_logged_in`, { withCredentials: true });
        if (response.data.loggedIn) {
          setUser(response.data.user);
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error('Check logged in error:', error);
      }
    };

    const fetchLink = async () => {
      try {
        const response = await axios.get(`${apiUrl}/api/links/${permalink}`, { withCredentials: true });
        setFormData(response.data);
        setProductLink(`${window.location.origin}/product/${response.data.unique_permalink}`); // Set product link
      } catch (error) {
        console.error('Error fetching link:', error);
      }
    };

    checkLoggedIn();
    fetchLink();
  }, [setUser, permalink]);

  const handleFileUpload = async (event, field) => {
    const file = event.target.files[0];
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post(`${apiUrl}/api/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      const fileUrl = response.data.url;
      if (field === 'url') {
        setFile(file);
        setFormData((prevFormData) => ({ ...prevFormData, url: fileUrl }));
      } else if (field === 'previewUrl') {
        setPreviewFile(file);
        setFormData((prevFormData) => ({ ...prevFormData, previewUrl: fileUrl }));
      }
    } catch (error) {
      console.error('File upload error:', error);
      setShowError(true);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      setShowError(true);
      setErrorMessage('User is not logged in');
      return;
    }

    if (!formData.url) {
      setShowError(true);
      setErrorMessage('URL cannot be blank');
      return;
    }

    const method = 'PUT';
    const endpoint = `/api/links/${permalink}`;
    const url = `${apiUrl}${endpoint}`;

    const form = new FormData();
    form.append('link[name]', formData.name);
    form.append('link[price]', formData.price);
    form.append('link[url]', formData.url);
    form.append('link[preview_url]', formData.previewUrl);
    form.append('link[description]', formData.description);
    form.append('link[download_limit]', formData.downloadLimit);

    if (file) form.append('file', file);
    if (previewFile) form.append('preview_file', previewFile);

    try {
      const response = await axios({
        method: method,
        url: url,
        data: form,
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        withCredentials: true // Ensure credentials are sent with the request
      });

      if (response.status === 200) {
        setProductLink(`${window.location.origin}/product/${response.data.unique_permalink}`);
        navigate(`/edit/${response.data.unique_permalink}`);
      } else {
        setShowError(true);
      }
    } catch (error) {
      console.error('Submit error:', error);
      setShowError(true);
    }
  };

  const handleDelete = async () => {
    try {
      await axios.delete(`${apiUrl}/api/links/${permalink}`, { withCredentials: true });
      navigate('/links');
    } catch (error) {
      console.error('Delete error:', error);
    }
  };

  return (
    <div>
      <form id="large-form" onSubmit={handleSubmit} className='editing-link'>
        <a href="#" id="delete_link" onClick={(e) => { e.preventDefault(); setIsDeleteModalOpen(true); }}>delete this link</a>
        <h3>Edit link {showError && <small className="error">{errorMessage}</small>}</h3>

        <p>
          <label htmlFor="name">Name:</label>
          <input id="name" name="name" type="text" placeholder="name" value={formData.name} onChange={handleChange} />
          <Tooltip />
        </p>
        <p>
          <label htmlFor="price">Price:</label>
          <input id="price" name="price" type="text" placeholder="$10" value={formData.price} onChange={handleChange} />
          <Tooltip />
        </p>
        <div className="upload-container">
          <label htmlFor="url">URL:</label>
          <input id="url" name="url" type="text" placeholder="http://" value={formData.url} onChange={handleChange} />
          <div id="container">
            <input type="file" id='file-button' onChange={(e) => handleFileUpload(e, 'url')} />
          </div>
          <Tooltip />
        </div>
        <div className="upload-container">
          <label htmlFor="preview_url">Preview URL:</label>
          <input id="preview_url" name="preview_url" type="text" placeholder="http://" value={formData.previewUrl} onChange={handleChange} />
          <div id="preview_container">
            <input type="file" id='file-button' onChange={(e) => handleFileUpload(e, 'previewUrl')} />
          </div>
          <Tooltip />
        </div>
        <p>
          <label htmlFor="description">Description:<br /><span className="faint">(optional)</span></label>
          <textarea id="description" name="description" value={formData.description} onChange={handleChange}></textarea>
          <Tooltip />
        </p>

        <p><button type="submit">Save changes</button></p>

        <div className="mini-rule"></div>
        <div id="link-options">
          <h4>Additional link options:</h4>
          <p>
            <label htmlFor="download_limit">Download limit:</label>
            <input id="download_limit" name="download_limit" type="text" placeholder="0" value={formData.downloadLimit} onChange={handleChange} />
            <Tooltip />
          </p>
        </div>

        <div className="rainbow bar"></div>
      </form>

      <div id="share-box">
        {productLink && (
          <div className="generated-link">
            <h3>Share this link with your customers:</h3>
            <a href={productLink} target="_blank" rel="noopener noreferrer">{productLink}</a>
          </div>
        )}
        <button type="button" onClick={() => window.open(`http://www.facebook.com/dialog/feed?app_id=114816261931958&redirect_uri=http://gumroad.com/home&display=popup&message=Buy%20${encodeURIComponent(formData.name)}%20on%20Gumroad!&link=${productLink}`, 'Share', 'width=400,height=200,scrollbars=yes')} className="facebook button">Share on Facebook</button>
        <button type="button" onClick={() => popup(`http://twitter.com/share?text=Buy%20${encodeURIComponent(formData.name)}%20on%20Gumroad!&via=gumroad&url=${productLink}`)} className="twitter button">Share on Twitter</button>
      </div>

      <Modal
        isOpen={isFileModalOpen}
        onRequestClose={() => setIsFileModalOpen(false)}
        contentLabel="File Upload Modal"
        className="modal"
        overlayClassName="overlay"
      >
        <h2>Upload a File</h2>
        <input type="file" onChange={(e) => handleFileUpload(e, 'url')} />
        <button onClick={() => setIsFileModalOpen(false)}>Cancel</button>
      </Modal>

      <Modal
        isOpen={isPreviewModalOpen}
        onRequestClose={() => setIsPreviewModalOpen(false)}
        contentLabel="Preview Upload Modal"
        className="modal"
        overlayClassName="overlay"
      >
        <h2>Upload a Preview File</h2>
        <input type="file" onChange={(e) => handleFileUpload(e, 'previewUrl')} />
        <button onClick={() => setIsPreviewModalOpen(false)}>Cancel</button>
      </Modal>

      <Modal
        isOpen={isDeleteModalOpen}
        onRequestClose={() => setIsDeleteModalOpen(false)}
        contentLabel="Confirm Delete"
        className="delete-modal"
        overlayClassName="delete-overlay"
      >
        <h2>Are you sure you want to delete this link?</h2>
        <div className='delete-modal-buttons'>
          <button onClick={() => { setIsDeleteModalOpen(false); handleDelete(); }}>Yes</button>
          <button onClick={() => setIsDeleteModalOpen(false)}>No</button>
        </div>
      </Modal>

      <p id="below-form-p">&nbsp;</p>
    </div>
  );
};

export default EditLink;
