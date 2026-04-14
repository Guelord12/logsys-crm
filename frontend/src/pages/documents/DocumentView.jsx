import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { documentService } from '@services/document.service';
import { DocumentTextIcon, ArrowDownTrayIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import Card from '@components/common/Card';
import Button from '@components/common/Button';
import Badge from '@components/common/Badge';
import Loader from '@components/common/Loader';
import { formatDate, formatFileSize } from '@utils/formatters';
import toast from 'react-hot-toast';

const DocumentView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [document, setDocument] = useState(null);
  const [loading, setLoading] = useState(true);
  const [versions, setVersions] = useState([]);

  useEffect(() => {
    fetchDocument();
    fetchVersions();
  }, [id]);

  const fetchDocument = async () => {
    try {
      const response = await documentService.getDocument(id);
      setDocument(response.data.data);
    } catch (error) {
      toast.error('Erreur lors du chargement du document');
      navigate('/documents');
    } finally {
      setLoading(false);
    }
  };

  const fetchVersions = async () => {
    try {
      const response = await documentService.getVersions(id);
      setVersions(response.data.data);
    } catch (error) {
      console.error('Erreur chargement versions:', error);
    }
  };

  const handleDownload = async () => {
    try {
      await documentService.downloadDocument(id);
      toast.success('Téléchargement démarré');
    } catch (error) {
      toast.error('Erreur lors du téléchargement');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Supprimer ce document ?')) return;
    
    try {
      await documentService.deleteDocument(id);
      toast.success('Document supprimé');
      navigate('/documents');
    } catch (error) {
      toast.error('Erreur lors de la suppression');
    }
  };

  if (loading) return <Loader size="lg" className="py-12" />;
  if (!document) return null;

  return (
    <div className="page-container max-w-4xl mx-auto">
      <div className="page-header flex items-center justify-between">
        <div>
          <h1 className="page-title">{document.title}</h1>
          <p className="page-description">{document.description}</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="secondary" onClick={handleDownload}>
            <ArrowDownTrayIcon className="w-4 h-4 mr-2" />
            Télécharger
          </Button>
          <Button variant="outline" onClick={() => navigate(`/documents/${id}/edit`)}>
            <PencilIcon className="w-4 h-4 mr-2" />
            Modifier
          </Button>
          <Button variant="danger" onClick={handleDelete}>
            <TrashIcon className="w-4 h-4 mr-2" />
            Supprimer
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2">
          <Card title="Prévisualisation">
            {document.mimeType?.startsWith('image/') ? (
              <img src={document.storagePath} alt={document.title} className="max-w-full rounded" />
            ) : document.mimeType === 'application/pdf' ? (
              <iframe src={document.storagePath} className="w-full h-96 rounded" title={document.title} />
            ) : (
              <div className="text-center py-12">
                <DocumentTextIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Prévisualisation non disponible</p>
                <Button onClick={handleDownload} className="mt-4">
                  Télécharger le fichier
                </Button>
              </div>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          <Card title="Informations">
            <dl className="space-y-3">
              <div>
                <dt className="text-sm text-gray-500">Type</dt>
                <dd className="font-medium">{document.documentType || 'Document'}</dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">Catégorie</dt>
                <dd className="font-medium">{document.category || 'Non classé'}</dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">Taille</dt>
                <dd className="font-medium">{formatFileSize(document.fileSize)}</dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">Ajouté le</dt>
                <dd className="font-medium">{formatDate(document.createdAt)}</dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">Ajouté par</dt>
                <dd className="font-medium">{document.uploader?.fullName}</dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">Version</dt>
                <dd className="font-medium">v{document.versionNumber}</dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">Accès</dt>
                <dd><Badge>{document.accessLevel}</Badge></dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">Vues</dt>
                <dd className="font-medium">{document.viewCount}</dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">Téléchargements</dt>
                <dd className="font-medium">{document.downloadCount}</dd>
              </div>
            </dl>
          </Card>

          {document.tags?.length > 0 && (
            <Card title="Tags">
              <div className="flex flex-wrap gap-2">
                {document.tags.map((tag, i) => (
                  <Badge key={i} variant="secondary">{tag}</Badge>
                ))}
              </div>
            </Card>
          )}

          {versions.length > 1 && (
            <Card title="Versions">
              <div className="space-y-2">
                {versions.map((v) => (
                  <div key={v.id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                    <div>
                      <p className="font-medium">Version {v.versionNumber}</p>
                      <p className="text-xs text-gray-500">{formatDate(v.createdAt)}</p>
                    </div>
                    <Button size="sm" variant="ghost" onClick={() => documentService.downloadDocument(v.id)}>
                      <ArrowDownTrayIcon className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default DocumentView;