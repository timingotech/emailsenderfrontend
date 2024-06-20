import React, { useState } from 'react';
import axios from 'axios';
import { useDropzone } from 'react-dropzone';
import ReactQuill from 'react-quill';
import TurndownService from 'turndown';
import 'react-quill/dist/quill.snow.css';

const turndownService = new TurndownService();

const EmailForm = () => {
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [recipients, setRecipients] = useState('');
  const [message, setMessage] = useState('');
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);

  const { getRootProps, getInputProps } = useDropzone({
    onDrop: (acceptedFiles) => {
      setFiles([...files, ...acceptedFiles.map(file => ({ file, description: '' }))]);
    }
  });

  const handleDescriptionChange = (index, description) => {
    const newFiles = [...files];
    newFiles[index].description = description;
    setFiles(newFiles);
  };

  const handleRemoveFile = (index) => {
    const newFiles = files.filter((_, i) => i !== index);
    setFiles(newFiles);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);

    const markdownBody = turndownService.turndown(body); // Convert HTML to Markdown

    const formData = new FormData();
    formData.append('subject', subject);
    formData.append('body', markdownBody);
    formData.append('recipients', recipients);
    files.forEach(({ file, description }, index) => {
      formData.append(`files`, file);
      formData.append(`descriptions`, description);
    });

    try {
      await axios.post('http://localhost:8000/api/send-email/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      setMessage('Emails sent successfully!');
      setSubject('');
      setBody('');
      setRecipients('');
      setFiles([]);
    } catch (error) {
      setMessage('Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-r from-blue-100 to-purple-200 p-4">
      <h1 className="text-4xl font-bold text-gray-800 mb-8">Send Custom Email</h1>
      <div className="md:flex w-full max-w-6xl ">
        <form onSubmit={handleSubmit} className="w-full max-w-lg p-8 bg-white rounded-lg shadow-lg md:mb-0 mb-5">
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Subject"
            required
            className="p-3 border border-gray-300 rounded mb-4 w-full"
          />
          <ReactQuill
            value={body}
            onChange={setBody}
            placeholder="Compose your email..."
            className="mb-4"
          />
          <input
            type="text"
            value={recipients}
            onChange={(e) => setRecipients(e.target.value)}
            placeholder="Comma-separated recipients"
            required
            className="p-3 border border-gray-300 rounded mb-4 w-full"
          />
          <div {...getRootProps()} className="border-2 border-dashed border-gray-300 p-6 rounded mb-4 cursor-pointer text-center">
            <input {...getInputProps()} />
            <p className="text-gray-500">Drag 'n' drop files here, or click to select</p>
          </div>
          {files.map((fileWrapper, index) => (
            <div key={index} className="mb-4 border border-gray-300 p-4 rounded">
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-700">{fileWrapper.file.name}</span>
                <button type="button" onClick={() => handleRemoveFile(index)} className="text-red-500">Remove</button>
              </div>
              <textarea
                value={fileWrapper.description}
                onChange={(e) => handleDescriptionChange(index, e.target.value)}
                placeholder="Add a description"
                className="p-2 border border-gray-300 rounded w-full"
              />
            </div>
          ))}
          <button type="submit" className="p-3 bg-blue-500 text-white rounded w-full hover:bg-blue-600">
            Send Email
          </button>
        </form>
        <div className="w-full max-w-lg p-8 bg-white rounded-lg shadow-lg md:ml-4">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Email Preview</h2>
          <div className="border border-gray-300 p-4 rounded mb-4">
            <h3 className="font-bold text-lg mb-2">{subject}</h3>
            <div className="mb-4">
              <p>{turndownService.turndown(body)}</p>
            </div>
            {files.map((fileWrapper, index) => (
              <div key={index} className="mb-4">
                <p className="font-semibold text-gray-700 mb-1">{fileWrapper.file.name}</p>
                <p className="text-gray-600 mb-2">{fileWrapper.description}</p>
                {fileWrapper.file.type.startsWith('image/') && (
                  <img src={URL.createObjectURL(fileWrapper.file)} alt="Uploaded" className="max-w-full h-auto mb-4" />
                )}
              </div>
            ))}
          </div>
          <div className="text-gray-600">
            <p><strong>Recipients:</strong> {recipients}</p>
          </div>
        </div>
      </div> 
      {loading && (
        <div className="fixed top-0 left-0 w-full h-full bg-gray-800 bg-opacity-50 flex items-center justify-center z-50">
          <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-gray-900"></div>
          <div className="ml-4 text-xl font-semibold text-white">Sending...</div>
        </div>
      )}
      {message && <p className="mt-4 text-lg">{message}</p>}
    </div>
  );
};

export default EmailForm;
