import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { documentService } from '@services/document.service';
import { useAuthStore } from '@store/auth.store';
import Card from '@components/common/Card';
import Button from '@components/common/Button';
import Table from '@components/common/Table';
import Badge from '@components/common/Badge';
import Pagination from '@components/common/Pagination';
import Modal from '@components/common/Modal';
import Input from '@components/common/Input';
import {
  DocumentIcon,
  PlusIcon,
  ArrowUpTrayIcon,
  MagnifyingGlassIcon,
  TrashIcon,
  ArrowDownTrayIcon
} from '@heroicons/react/24/outline';
import { formatDate, formatFileSize } from '@utils/formatters';
import toast from 'react-hot-toast';
import clsx from 'clsx';

const Documents = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0 });
  const [search, setSearch] = useState('');
  const [showUpload, setShowUpload] = useState(false);
  const [uploadFiles, setUploadFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  // Champs pour le formulaire d'upload
  const [documentType, setDocumentType] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [accessLevel, setAccessLevel] = useState('INTERNAL');
  const [tagInput, setTagInput] = useState('');
  const [tagList, setTagList] = useState([]);

  const { getRootProps, getInputProps } = useDropzone({
    onDrop: (acceptedFiles) => {
      setUploadFiles(acceptedFiles);
    },
    accept: {
      '*/*': []  // ✅ Accepter tous les types de fichiers
    }
  });

  useEffect(() => {
    fetchDocuments();
  }, [pagination.page, search]);

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const response = await documentService.getDocuments({
        page: pagination.page,
        limit: pagination.limit,
        search
      });
      setDocuments(response.data.data.documents);
      setPagination(prev => ({ ...prev, total: response.data.data.pagination.total }));
    } catch (error) {
      console.error('Erreur chargement documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !tagList.includes(tagInput.trim())) {
      setTagList([...tagList, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag) => {
    setTagList(tagList.filter(t => t !== tag));
  };

  const handleUpload = async () => {
    if (uploadFiles.length === 0) return;

    setUploading(true);
    try {
      for (const file of uploadFiles) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('title', file.name);
        if (description) formData.append('description', description);
        if (documentType) formData.append('documentType', documentType);
        if (category) formData.append('category', category);
        formData.append('accessLevel', accessLevel);
        if (tagList.length > 0) formData.append('tags', JSON.stringify(tagList));
        
        await documentService.uploadDocument(formData);
      }
      toast.success(`${uploadFiles.length} document(s) uploadé(s)`);
      setShowUpload(false);
      setUploadFiles([]);
      setDocumentType('');
      setCategory('');
      setDescription('');
      setAccessLevel('INTERNAL');
      setTagList([]);
      fetchDocuments();
    } catch (error) {
      toast.error('Erreur lors de l\'upload');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer ce document ?')) return;

    try {
      await documentService.deleteDocument(id);
      toast.success('Document supprimé');
      fetchDocuments();
    } catch (error) {
      toast.error('Erreur lors de la suppression');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!window.confirm(`Supprimer ${selectedIds.length} document(s) ?`)) return;

    try {
      for (const id of selectedIds) {
        await documentService.deleteDocument(id);
      }
      toast.success(`${selectedIds.length} document(s) supprimé(s)`);
      setSelectedIds([]);
      fetchDocuments();
    } catch (error) {
      toast.error('Erreur lors de la suppression');
    }
  };

  const columns = [
    {
      key: 'title',
      title: 'Nom',
      render: (row) => (
        <div className="flex items-center">
          <DocumentIcon className="w-5 h-5 text-gray-400 mr-3" />
          <div>
            <p className="font-medium text-gray-900">{row.title}</p>
            <p className="text-sm text-gray-500">{row.originalFilename}</p>
          </div>
        </div>
      )
    },
    {
      key: 'documentType',
      title: 'Type',
      render: (row) => row.documentType || '-'
    },
    {
      key: 'fileSize',
      title: 'Taille',
      render: (row) => formatFileSize(row.fileSize)
    },
    {
      key: 'uploadedBy',
      title: 'Uploadé par',
      render: (row) => row.uploader?.fullName || '-'
    },
    {
      key: 'company',
      title: 'Entreprise',
      render: (row) => row.company?.name || 'Système'
    },
    {
      key: 'createdAt',
      title: 'Date',
      render: (row) => formatDate(row.createdAt)
    },
    {
      key: 'accessLevel',
      title: 'Accès',
      render: (row) => <Badge size="sm">{row.accessLevel}</Badge>
    },
    {
      key: 'actions',
      title: '',
      render: (row) => (
        <div className="flex space-x-2">
          <button
            onClick={(e) => { e.stopPropagation(); documentService.downloadDocument(row.id); }}
            className="p-1 hover:bg-gray-100 rounded"
            title="Télécharger"
          >
            <ArrowDownTrayIcon className="w-4 h-4 text-gray-600" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); handleDelete(row.id); }}
            className="p-1 hover:bg-gray-100 rounded"
            title="Supprimer"
          >
            <TrashIcon className="w-4 h-4 text-red-600" />
          </button>
        </div>
      )
    }
  ];

  const documentTypes = [
    'CONTRAT', 'FACTURE', 'DEVIS', 'RAPPORT', 'PRESENTATION', 'IMAGE', 'PDF', 'TABLEUR', 'AUTRE'
  ];

  const categories = [
    'Administratif', 'Commercial', 'Financier', 'Juridique', 'Marketing', 'Ressources Humaines', 'Technique', 'Autre'
  ];

  const accessLevels = [
    { value: 'PUBLIC', label: 'Public - Visible par tous' },
    { value: 'INTERNAL', label: 'Interne - Visible par les employés' },
    { value: 'RESTRICTED', label: 'Restreint - Visible par vous et les admins' },
    { value: 'CONFIDENTIAL', label: 'Confidentiel - Visible par les admins uniquement' }
  ];

  return (
    <div className="page-container">
      <div className="page-header flex items-center justify-between">
        <div>
          <h1 className="page-title">Documents</h1>
          <p className="page-description">Gérez vos documents et fichiers</p>
        </div>
        <Button onClick={() => setShowUpload(true)}>
          <PlusIcon className="w-4 h-4 mr-2" />
          Uploader
        </Button>
      </div>

      <Card>
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center space-x-4 flex-1">
            <div className="relative flex-1 max-w-md">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input pl-9"
              />
            </div>
            {selectedIds.length > 0 && (
              <Button variant="danger" size="sm" onClick={handleBulkDelete}>
                <TrashIcon className="w-4 h-4 mr-1" />
                Supprimer ({selectedIds.length})
              </Button>
            )}
          </div>
        </div>

        <Table
          columns={columns}
          data={documents}
          loading={loading}
          selectable
          selectedRows={selectedIds}
          onSelectRow={(id) => setSelectedIds(prev => 
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
          )}
          onSelectAll={() => setSelectedIds(
            selectedIds.length === documents.length ? [] : documents.map(d => d.id)
          )}
          onRowClick={(row) => navigate(`/documents/${row.id}`)}
          emptyMessage="Aucun document"
        />

        {pagination.total > pagination.limit && (
          <div className="p-4 border-t border-gray-200">
            <Pagination
              currentPage={pagination.page}
              totalPages={Math.ceil(pagination.total / pagination.limit)}
              totalItems={pagination.total}
              pageSize={pagination.limit}
              onPageChange={(page) => setPagination({ ...pagination, page })}
            />
          </div>
        )}
      </Card>

      <Modal isOpen={showUpload} onClose={() => setShowUpload(false)} title="Uploader des documents" size="xl">
        <div className="space-y-4">
          {/* Zone de drop */}
          <div {...getRootProps()} className={clsx(
            'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors',
            uploadFiles.length > 0 ? 'border-green-500 bg-green-50' : 'border-gray-300 hover:border-blue-500'
          )}>
            <input {...getInputProps()} />
            <ArrowUpTrayIcon className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600">Glissez-déposez des fichiers ou cliquez pour sélectionner</p>
            <p className="text-sm text-gray-400 mt-2">Tous types de fichiers acceptés • Taille max: 100MB</p>
          </div>

          {/* Fichiers sélectionnés */}
          {uploadFiles.length > 0 && (
            <div className="border rounded-lg p-3">
              <p className="font-medium mb-2">{uploadFiles.length} fichier(s) sélectionné(s)</p>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {uploadFiles.map((file, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <div className="flex items-center">
                      <DocumentIcon className="w-4 h-4 mr-2 text-gray-400" />
                      <span>{file.name}</span>
                      <span className="ml-2 text-gray-400">({formatFileSize(file.size)})</span>
                    </div>
                    <button
                      onClick={() => setUploadFiles(files => files.filter((_, j) => j !== i))}
                      className="text-red-500"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Formulaire de métadonnées */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Type de document</label>
              <select
                value={documentType}
                onChange={(e) => setDocumentType(e.target.value)}
                className="input"
              >
                <option value="">Sélectionner un type</option>
                {documentTypes.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">Catégorie</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="input"
              >
                <option value="">Sélectionner une catégorie</option>
                {categories.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div className="col-span-2">
              <label className="label">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="input"
                rows={2}
                placeholder="Description du document..."
              />
            </div>

            <div className="col-span-2">
              <label className="label">Niveau d'accès</label>
              <select
                value={accessLevel}
                onChange={(e) => setAccessLevel(e.target.value)}
                className="input"
              >
                {accessLevels.map(a => (
                  <option key={a.value} value={a.value}>{a.label}</option>
                ))}
              </select>
            </div>

            <div className="col-span-2">
              <label className="label">Tags</label>
              <div className="flex space-x-2">
                <Input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  placeholder="Ajouter un tag"
                  className="flex-1"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                />
                <Button type="button" variant="secondary" onClick={handleAddTag}>
                  Ajouter
                </Button>
              </div>
              {tagList.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {tagList.map((tag, i) => (
                    <span key={i} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm flex items-center">
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="ml-2 text-blue-600 hover:text-blue-800"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="ghost" onClick={() => {
              setShowUpload(false);
              setUploadFiles([]);
              setDocumentType('');
              setCategory('');
              setDescription('');
              setAccessLevel('INTERNAL');
              setTagList([]);
            }}>
              Annuler
            </Button>
            <Button onClick={handleUpload} loading={uploading} disabled={uploadFiles.length === 0}>
              Uploader
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Documents;