import { protectedClient, publicClient } from './client';
import { createClientTicket, uploadClientTicketAttachments } from './support';

export const getClientPayments = (params = {}) =>
  protectedClient.get('/client/payments', { params });

export const getClientPaymentReference = (paymentId) =>
  protectedClient.get(`/client/payments/${paymentId}/reference`);

export const getClientPaymentOptions = (params = {}) =>
  protectedClient.get('/client/payments/options', { params });

export const searchTerrainsForPayment = async (params = {}) => {
  const res = await publicClient.get('/public/terrains', {
    params: {
      page: 1,
      limit: 20,
      search: params.search?.trim() || undefined,
      location: params.location || undefined,
    },
  });

  return {
    items: res?.data?.data ?? [],
    meta: res?.data?.meta ?? {},
    raw: res?.data,
  };
};

export const createClientPayment = (payload) =>
  protectedClient.post('/client/payments', payload);

export const submitPaymentProof = async ({ paymentId, note, files = [] }) => {
  const formData = new FormData();

  if (note?.trim()) {
    formData.append('note', note.trim());
  }

  files.forEach((file, index) => {
    const uri = file.uri;
    const name =
      file.name ||
      file.fileName ||
      uri?.split('/').pop() ||
      `payment-proof-${Date.now()}-${index}`;

    const type = file.mimeType || file.type || 'application/octet-stream';

    formData.append('files', {
      uri,
      name,
      type,
    });
  });

  const res = await protectedClient.post(
    `/client/payments/${paymentId}/proofs`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );

  return {
    item: res?.data?.data ?? null,
    raw: res?.data,
  };
};

export const submitPaymentProofWithSupport = async ({
  paymentId,
  payment,
  note,
  files = [],
}) => {
  const proofRes = await submitPaymentProof({
    paymentId,
    note,
    files,
  });

  const ticket = await createClientTicket({
    subject: `Preuve de paiement — ${payment?.reference_code ?? payment?.ref ?? paymentId}`,
    description: [
      'Nouvelle preuve de paiement envoyée depuis l’application mobile.',
      '',
      `Référence : ${payment?.reference_code ?? payment?.ref ?? '—'}`,
      `Paiement ID : ${paymentId}`,
      `Montant : ${Number(
        payment?.amount_xof ?? payment?.amountXof ?? payment?.amount ?? 0
      ).toLocaleString('fr-FR')} FCFA`,
      `Terrain : ${payment?.terrain_title ?? payment?.terrain_ref ?? '—'}`,
      '',
      'Note client :',
      note?.trim() || 'Aucune note',
    ].join('\n'),
    category: 'payment',
    priority: 'medium',
  });

  if (ticket?.id && files.length > 0) {
    await uploadClientTicketAttachments({
      ticketId: ticket.id,
      files,
    });
  }

  return {
    proof: proofRes?.item ?? null,
    ticket,
  };
};