/* =========================================================
   DOCUMENT UPLOAD POPUP
========================================================= */

/**
 * Initialize popup with page ID
 */
async function initializePopup(pageId) {
    // Get form elements AFTER the popup HTML is injected
    const uploadForm = document.getElementById('uploadForm');
    const documentInput = document.getElementById('documentInput');
    const uploadProgress = document.getElementById('uploadProgress');
    const progressBar = document.getElementById('progressBar');
    const progressText = document.getElementById('progressText');
    const uploadMessage = document.getElementById('uploadMessage');
    const documentsUL = document.getElementById('documentsUL');
    const uploadBtn = document.getElementById('uploadBtn');

    document.getElementById('pageId').value = pageId;
    await loadDocuments(pageId);

    // Attach event listener AFTER form exists
    uploadForm.onsubmit = async (e) => {
        e.preventDefault();
        
        const pageId = document.getElementById('pageId').value;
        const file = documentInput.files[0];

        if (!file) {
            showMessage('Please select a file', 'error');
            return;
        }

        // Validate file size (50MB limit)
        const maxSize = 50 * 1024 * 1024;
        if (file.size > maxSize) {
            showMessage('File size exceeds 50MB limit', 'error');
            return;
        }

        const formData = new FormData();
        formData.append('pageId', pageId);
        formData.append('document', file);

        uploadProgress.style.display = 'block';
        progressBar.style.width = '0%';
        progressText.textContent = '0%';
        uploadBtn.disabled = true;

        try {
            const xhr = new XMLHttpRequest();

            // Track upload progress
            xhr.upload.addEventListener('progress', (e) => {
                if (e.lengthComputable) {
                    const percent = (e.loaded / e.total) * 100;
                    progressBar.style.width = percent + '%';
                    progressText.textContent = Math.round(percent) + '%';
                }
            });

            xhr.onload = () => {
                uploadBtn.disabled = false;
                uploadProgress.style.display = 'none';

                if (xhr.status === 200) {
                    const response = JSON.parse(xhr.responseText);
                    showMessage('Document uploaded successfully!', 'success');
                    documentInput.value = '';
                    loadDocuments(pageId);
                } else {
                    const error = JSON.parse(xhr.responseText);
                    showMessage('Upload failed: ' + (error.error || 'Unknown error'), 'error');
                }
            };

            xhr.onerror = () => {
                uploadBtn.disabled = false;
                uploadProgress.style.display = 'none';
                showMessage('Network error during upload', 'error');
            };

            xhr.ontimeout = () => {
                uploadBtn.disabled = false;
                uploadProgress.style.display = 'none';
                showMessage('Upload timeout - file too large', 'error');
            };

            xhr.open('POST', '/uploadDocument');
            xhr.timeout = 300000; // 5 minute timeout
            xhr.send(formData);

        } catch (err) {
            uploadBtn.disabled = false;
            uploadProgress.style.display = 'none';
            showMessage('Error: ' + err.message, 'error');
        }
    };
}

/**
 * Display a message to the user
 */
function showMessage(msg, type) {
    const uploadMessage = document.getElementById('uploadMessage');
    uploadMessage.style.display = 'block';
    uploadMessage.textContent = msg;
    uploadMessage.className = 'upload-message ' + type;
}

/**
 * Load and display all documents for a page
 */
async function loadDocuments(pageId) {
    try {
        const response = await fetch(`/getDocuments/${pageId}`);
        const data = await response.json();

        const documentsUL = document.getElementById('documentsUL');
        documentsUL.innerHTML = '';

        if (!data.documents || data.documents.length === 0) {
            const li = document.createElement('li');
            li.style.color = '#999';
            li.textContent = 'No documents uploaded yet';
            documentsUL.appendChild(li);
            return;
        }

        data.documents.forEach(doc => {
            const li = document.createElement('li');
            
            const fileSize = (doc.file_size / 1024).toFixed(2);
            const uploadDate = new Date(doc.upload_date).toLocaleDateString();

            const docInfo = document.createElement('div');
            docInfo.innerHTML = `
                <strong>${escapeHtml(doc.original_name)}</strong>
                <small>${fileSize} KB - ${uploadDate}</small>
            `;

            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'btn-delete';
            deleteBtn.textContent = 'Delete';
            deleteBtn.type = 'button';
            deleteBtn.onclick = () => deleteDocument(doc.document_id, pageId);

            li.appendChild(docInfo);
            li.appendChild(deleteBtn);
            documentsUL.appendChild(li);
        });

    } catch (err) {
        console.error('Error loading documents:', err);
        showMessage('Failed to load documents', 'error');
    }
}

/**
 * Delete a document
 */
async function deleteDocument(documentId, pageId) {
    if (!confirm('Are you sure you want to delete this document?')) return;

    try {
        const response = await fetch(`/document/${documentId}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            showMessage('Document deleted successfully', 'success');
            loadDocuments(pageId);
        } else {
            const error = await response.json();
            showMessage('Delete failed: ' + (error.error || 'Unknown error'), 'error');
        }
    } catch (err) {
        console.error('Error deleting document:', err);
        showMessage('Error: ' + err.message, 'error');
    }
}

/**
 * Escape HTML special characters for security
 */
function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}
