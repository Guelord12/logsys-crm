import React, { useState, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import { messageService } from '@services/message.service';
import Modal from '@components/common/Modal';
import Button from '@components/common/Button';
import Input from '@components/common/Input';
import { PaperClipIcon, XMarkIcon, FaceSmileIcon } from '@heroicons/react/24/outline';
import { formatFileSize } from '@utils/formatters';
import toast from 'react-hot-toast';
import clsx from 'clsx';

// Version simplifiée sans emoji-picker pour éviter les dépendances
const ComposeMessage = ({ isOpen, onClose, onSuccess, replyTo, forwardFrom }) => {
  const [subject, setSubject] = useState(replyTo ? `Re: ${replyTo.subject}` : forwardFrom ? `Fwd: ${forwardFrom.subject}` : '');
  const [body, setBody] = useState('');
  const [recipients, setRecipients] = useState([{ email: '', type: 'TO' }]);
  const [attachments, setAttachments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [scheduledFor, setScheduledFor] = useState('');

  const { getRootProps, getInputProps } = useDropzone({
    onDrop: async (acceptedFiles) => {
      const formData = new FormData();
      acceptedFiles.forEach(file => formData.append('attachments', file));
      
      try {
        const response = await messageService.uploadAttachments(formData);
        setAttachments(prev => [...prev, ...response.data.data]);
        toast.success(`${acceptedFiles.length} pièce(s) jointe(s) ajoutée(s)`);
      } catch (error) {
        toast.error('Erreur lors de l\'upload des pièces jointes');
      }
    }
  });

  const addRecipient = (type = 'TO') => {
    setRecipients([...recipients, { email: '', type }]);
  };

  const removeRecipient = (index) => {
    setRecipients(recipients.filter((_, i) => i !== index));
  };

  const updateRecipient = (index, field, value) => {
    const updated = [...recipients];
    updated[index][field] = value;
    setRecipients(updated);
  };

  const removeAttachment = (id) => {
    setAttachments(attachments.filter(a => a.id !== id));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const validRecipients = recipients.filter(r => r.email.trim());
    if (validRecipients.length === 0) {
      toast.error('Au moins un destinataire est requis');
      return;
    }

    setLoading(true);
    try {
      const data = {
        subject,
        body,
        recipients: validRecipients,
        attachments: attachments.map(a => a.id),
        scheduledFor: scheduledFor || undefined
      };

      if (replyTo) {
        await messageService.replyToMessage(replyTo.id, data);
      } else if (forwardFrom) {
        await messageService.forwardMessage(forwardFrom.id, data);
      } else {
        await messageService.sendMessage(data);
      }

      toast.success(scheduledFor ? 'Message programmé' : 'Message envoyé');
      onSuccess?.();
      onClose();
    } catch (error) {
      toast.error('Erreur lors de l\'envoi du message');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDraft = async () => {
    try {
      await messageService.saveDraft({
        subject,
        body,
        recipients: recipients.filter(r => r.email.trim()),
        attachments: attachments.map(a => a.id)
      });
      toast.success('Brouillon sauvegardé');
      onClose();
    } catch (error) {
      toast.error('Erreur lors de la sauvegarde');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Nouveau message" size="xl">
      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
          {recipients.map((recipient, index) => (
            <div key={index} className="flex items-center space-x-2">
              <select
                value={recipient.type}
                onChange={(e) => updateRecipient(index, 'type', e.target.value)}
                className="w-20 rounded-lg border-gray-300 text-sm"
              >
                <option value="TO">À</option>
                <option value="CC">Cc</option>
                <option value="BCC">Cci</option>
              </select>
              <Input
                type="email"
                placeholder="Adresse email"
                value={recipient.email}
                onChange={(e) => updateRecipient(index, 'email', e.target.value)}
                className="flex-1"
              />
              {recipients.length > 1 && (
                <button type="button" onClick={() => removeRecipient(index)} className="p-2 text-gray-400 hover:text-red-500">
                  <XMarkIcon className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
          
          <button type="button" onClick={() => addRecipient('CC')} className="text-sm text-blue-600 hover:text-blue-700">
            + Ajouter Cc/Cci
          </button>

          <Input
            placeholder="Sujet"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
          />

          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Votre message..."
            rows={8}
            className="input w-full resize-none"
          />

          {attachments.length > 0 && (
            <div className="border rounded-lg p-3">
              <p className="text-sm font-medium mb-2">Pièces jointes</p>
              <div className="space-y-2">
                {attachments.map((file) => (
                  <div key={file.id} className="flex items-center justify-between text-sm">
                    <div className="flex items-center">
                      <PaperClipIcon className="w-4 h-4 mr-2 text-gray-400" />
                      <span>{file.originalFilename}</span>
                      <span className="ml-2 text-gray-400">({formatFileSize(file.fileSize)})</span>
                    </div>
                    <button type="button" onClick={() => removeAttachment(file.id)} className="text-red-500">
                      <XMarkIcon className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div {...getRootProps()} className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:border-blue-500 transition-colors">
            <input {...getInputProps()} />
            <PaperClipIcon className="w-6 h-6 mx-auto text-gray-400 mb-2" />
            <p className="text-sm text-gray-600">Glissez-déposez des fichiers ou cliquez pour ajouter des pièces jointes</p>
          </div>

          <div>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={!!scheduledFor}
                onChange={(e) => setScheduledFor(e.target.checked ? new Date().toISOString().slice(0, 16) : '')}
                className="rounded"
              />
              <span className="text-sm">Programmer l'envoi</span>
            </label>
            {scheduledFor && (
              <Input
                type="datetime-local"
                value={scheduledFor}
                onChange={(e) => setScheduledFor(e.target.value)}
                className="mt-2"
                min={new Date().toISOString().slice(0, 16)}
              />
            )}
          </div>
        </div>

        <div className="flex justify-between mt-6 pt-4 border-t">
          <Button type="button" variant="secondary" onClick={handleSaveDraft}>
            Enregistrer comme brouillon
          </Button>
          <div className="flex space-x-2">
            <Button type="button" variant="ghost" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit" loading={loading}>
              {scheduledFor ? 'Programmer' : 'Envoyer'}
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
};

export default ComposeMessage;