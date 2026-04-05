import React, { useState, useEffect } from 'react';
import { useToast } from '../context/ToastContext';
import { getAllDocumentWritersApi, deleteDocumentWriterApi, getCodeValuesApi } from '../services/api';
import TableSkeleton from '../components/skeletons/TableSkeleton';
import DocumentWriterModal from '../components/DocumentWriterModal';
import cache from '../utils/cache';

const CODE_IDS = {
  PROVINCE: 1001,
  DISTRICT: 1002,
  MUNICIPALITY: 1,
  WARD: 2,
  GENDER: 1004,
};

const extractArray = (data) => {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (data.data && Array.isArray(data.data)) return data.data;
  if (data.content && Array.isArray(data.content)) return data.content;
  if (data.data && data.data.content && Array.isArray(data.data.content)) return data.data.content;
  return [];
};

const DocumentWriterManagement = () => {
  const toast = useToast();
  
  const [writers, setWriters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedWriter, setSelectedWriter] = useState(null);

  // Mappings for displaying labels instead of IDs
  const [codesLoaded, setCodesLoaded] = useState(false);
  const [provinces, setProvinces] = useState([]);
  const [genders, setGenders] = useState([]);

  useEffect(() => {
    const fetchCodes = async () => {
      try {
        const cachedCode = (codeId) => {
          const key = `codeValues:${codeId}`;
          const hit = cache.get(key);
          if (hit) return Promise.resolve(hit);
          return getCodeValuesApi(codeId).catch(() => []).then((data) => {
            cache.set(key, data); // indefinite TTL — static data
            return data;
          });
        };

        const [prov, g] = await Promise.all([
          cachedCode(CODE_IDS.PROVINCE),
          cachedCode(CODE_IDS.GENDER),
        ]);
        setProvinces(extractArray(prov));
        setGenders(extractArray(g));
        setCodesLoaded(true);
      } catch(err) {
        setCodesLoaded(true);
      }
    };
    fetchCodes();
  }, []);

  const fetchWriters = async (forceRefresh = false) => {
    const cacheKey = `documentWriters:list:${page}:${size}`;
    if (!forceRefresh) {
      const cached = cache.get(cacheKey);
      if (cached) {
        setWriters(cached.content || []);
        setTotalPages(cached.totalPages || 0);
        setLoading(false);
        return;
      }
    }
    setLoading(true);
    try {
      const data = await getAllDocumentWritersApi({ page, size, sort: 'id,desc' });
      cache.set(cacheKey, data, 300);
      setWriters(data.content || []);
      setTotalPages(data.totalPages || 0);
    } catch (err) {
      toast.error(err.message || 'Failed to load document writers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWriters();
  }, [page, size]);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this document writer?')) return;
    try {
      await deleteDocumentWriterApi(id);
      toast.success('Document Writer deleted successfully');
      cache.invalidateByPrefix('documentWriters:');
      if (writers.length === 1 && page > 0) {
        setPage(page - 1);
      } else {
        fetchWriters(true);
      }
    } catch (err) {
      toast.error(err.message || 'Failed to delete document writer');
    }
  };

  const openAddModal = () => {
    setSelectedWriter(null);
    setIsModalOpen(true);
  };

  const openEditModal = (writer) => {
    setSelectedWriter(writer);
    setIsModalOpen(true);
  };

  const handleNextPage = () => {
    if (page < totalPages - 1) setPage(p => p + 1);
  };

  const handlePrevPage = () => {
    if (page > 0) setPage(p => p - 1);
  };

  const getLabel = (id, list) => {
    // If it's already a string/nepali test instead of ID, return it 
    if (id && isNaN(Number(id))) return id;
    const found = list.find(item => String(item.id) === String(id));
    return found ? (found.codeValueOptional || found.codeValue) : id;
  };

  // onSuccess is called by DocumentWriterModal after add or edit
  const handleWriterSuccess = () => {
    cache.invalidateByPrefix('documentWriters:');
    fetchWriters(true);
  };

  if (loading && writers.length === 0) return <TableSkeleton cols={7} rows={5} />;

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h1>Document Writer Management</h1>
          <p className="page-subtitle">Manage list of document writers</p>
        </div>
        <div>
          <button className="btn btn-primary" onClick={openAddModal}>+ Add Document Writer</button>
        </div>
      </div>

      <DocumentWriterModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleWriterSuccess}
        initialData={selectedWriter}
      />

      <div className="card">
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Full Name (Nepali)</th>
                <th>Age</th>
                <th>Gender</th>
                <th>Province</th>
                <th>Address</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {writers.length === 0 ? (
                <tr>
                  <td colSpan="7" className="empty-state">
                    No document writers found.
                  </td>
                </tr>
              ) : (
                writers.map((w) => (
                  <tr key={w.id}>
                    <td>{w.id}</td>
                    <td>{w.fullNameNepali}</td>
                    <td>{w.age}</td>
                    <td>{codesLoaded ? getLabel(w.gender, genders) : w.gender}</td>
                    <td>{codesLoaded ? getLabel(w.province, provinces) : w.province}</td>
                    <td>{w.address || '-'}</td>
                    <td>
                      <div className="action-btns">
                        <button className="btn btn-sm btn-outline" onClick={() => openEditModal(w)}>
                          Edit
                        </button>
                        <button className="btn btn-sm btn-danger" onClick={() => handleDelete(w.id)}>
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="pagination" style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '1rem', marginTop: '1rem' }}>
            <button className="btn btn-outline btn-sm" disabled={page === 0} onClick={handlePrevPage}>Previous</button>
            <span>Page {page + 1} of {totalPages}</span>
            <button className="btn btn-outline btn-sm" disabled={page >= totalPages - 1} onClick={handleNextPage}>Next</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default DocumentWriterManagement;
