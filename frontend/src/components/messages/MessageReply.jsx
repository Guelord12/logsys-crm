import React, { useState } from 'react';
import { messageService } from '@services/message.service';
import Button from '@components/common/Button';
import { PaperAirplaneIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const MessageReply = ({ messageId, onSuccess, onCancel }) => {
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!body.trim()) return;

    setLoading(true);
    try {
      await messageService.replyToMessage(messageId, { body });
      toast.success('Réponse envoyée');
      onSuccess?.();
    } catch (error) {
      toast.error('Erreur lors de l\'envoi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="border-t p-4 bg-gray-50">
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Votre réponse..."
        rows={3}
        className="input w-full resize-none mb-3"
      />
      <div className="flex justify-end space-x-2">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Annuler
        </Button>
        <Button type="submit" loading={loading} disabled={!body.trim()}>
          <PaperAirplaneIcon className="w-4 h-4 mr-2" />
          Envoyer
        </Button>
      </div>
    </form>
  );
};

export default MessageReply;