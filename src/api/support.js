import { protectedClient } from './client';

function normalizeListResponse(res) {
  return {
    items: res?.data?.data ?? [],
    meta: res?.data?.meta ?? {},
    raw: res?.data,
  };
}

function normalizeDetailResponse(res) {
  return {
    item: res?.data?.data ?? null,
    raw: res?.data,
  };
}

export const getClientTickets = async (params = {}) => {
  const res = await protectedClient.get('/client/support/tickets', { params });
  return normalizeListResponse(res);
};

export const getClientTicketDetail = async (ticketId) => {
  const res = await protectedClient.get(`/client/support/${ticketId}`);
  return normalizeDetailResponse(res);
};

export const createClientTicket = async ({
  subject,
  description,
  category = 'other',
  priority = 'medium',
}) => {
  const res = await protectedClient.post('/client/support/tickets', {
    subject,
    description,
    category,
    priority,
  });

  return {
    item: res?.data?.data ?? null,
    raw: res?.data,
  };
};

export const addClientTicketMessage = async (ticketId, { message }) => {
  const res = await protectedClient.post(`/client/support/${ticketId}/messages`, {
    message,
  });

  return {
    item: res?.data?.data ?? null,
    raw: res?.data,
  };
};

export const uploadClientTicketAttachments = async ({
  ticketId,
  files = [],
  messageId = null,
}) => {
  const formData = new FormData();

  if (messageId) {
    formData.append('messageId', messageId);
  }

  files.forEach((file, index) => {
    const uri = file.uri;
    const name =
      file.fileName ||
      file.name ||
      uri?.split('/').pop() ||
      `support-file-${Date.now()}-${index}.jpg`;

    const type = file.mimeType || file.type || 'image/jpeg';

    formData.append('files', {
      uri,
      name,
      type,
    });
  });

  const res = await protectedClient.post(
    `/client/support/${ticketId}/attachments`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );

  return {
    items: res?.data?.data ?? [],
    raw: res?.data,
  };
};

/**
 * Helper pratique pour le bouton flottant support :
 * crée un ticket puis retourne son id
 */
export const openQuickSupportTicket = async ({
  subject,
  description,
  category = 'other',
  priority = 'medium',
}) => {
  const { item } = await createClientTicket({
    subject,
    description,
    category,
    priority,
  });

  return item;
};