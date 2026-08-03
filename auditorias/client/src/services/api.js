const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const getHeaders = (isFormData = false) => {
  const token = localStorage.getItem('token');
  const headers = {};
  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

const handleResponse = async (response, path = '') => {
  if (response.status === 401 && !path.includes('/auth/login') && !path.includes('/auth/google')) {
    localStorage.removeItem('token');
    window.location.href = '/login';
    throw new Error('No autorizado');
  }
  if (!response.ok) {
    let errorMsg = 'Error en la petición';
    try {
      const data = await response.json();
      errorMsg = data.message || errorMsg;
    } catch (e) {}
    throw new Error(errorMsg);
  }
  return response.json();
};

const api = {
  get: async (path) => {
    const response = await fetch(`${API_URL}${path}`, {
      method: 'GET',
      headers: getHeaders()
    });
    return handleResponse(response, path);
  },
  post: async (path, body) => {
    const response = await fetch(`${API_URL}${path}`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(body)
    });
    return handleResponse(response, path);
  },
  patch: async (path, body) => {
    const response = await fetch(`${API_URL}${path}`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify(body)
    });
    return handleResponse(response);
  },
  delete: async (path) => {
    const response = await fetch(`${API_URL}${path}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    return handleResponse(response);
  },
  upload: (path, formData, onProgress) => {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', `${API_URL}${path}`);
      
      const token = localStorage.getItem('token');
      if (token) {
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      }

      if (xhr.upload && onProgress) {
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const percent = Math.round((event.loaded / event.total) * 100);
            onProgress(percent);
          }
        };
      }

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            resolve(JSON.parse(xhr.responseText));
          } catch (e) {
            resolve(xhr.responseText);
          }
        } else {
          if (xhr.status === 401) {
            localStorage.removeItem('token');
            window.location.href = '/login';
          }
          let errorMsg = 'Error al subir archivo';
          try {
            const data = JSON.parse(xhr.responseText);
            errorMsg = data.message || errorMsg;
          } catch(e) {}
          reject(new Error(errorMsg));
        }
      };

      xhr.onerror = () => reject(new Error('Error de red al subir archivo'));
      xhr.send(formData);
    });
  }
};

export default api;
