export function normalizeTerrain(raw = {}) {
  const hero = raw.hero ?? {};
  const locationDetails = raw.locationDetails ?? {};
  const media = raw.media ?? {};
  const payment = raw.payment ?? {};
  const legal = raw.legal ?? {};
  const features = raw.features ?? {};
  const cta = raw.cta ?? {};
  const reassurance = raw.reassurance ?? {};

  const flatPrice = Number(raw.price ?? hero?.price?.amount ?? 0);

  const mainImage =
    hero?.mainImage?.url ??
    media?.mainImage?.url ??
    (typeof raw.mainImage === 'string' ? raw.mainImage : raw.mainImage?.url) ??
    (typeof raw.images?.[0] === 'string' ? raw.images[0] : raw.images?.[0]?.url) ??
    null;

  const gallery =
    Array.isArray(media?.images) ? media.images :
    Array.isArray(hero?.gallery) ? hero.gallery :
    Array.isArray(raw.images) ? raw.images :
    [];

  const normalizedImages = gallery
    .map((img) => (typeof img === 'string' ? img : img?.url))
    .filter(Boolean);

  const rawDocuments =
    Array.isArray(media?.documents) ? media.documents :
    Array.isArray(raw.documents) ? raw.documents :
    [];

  const documents = rawDocuments.map((doc) => ({
    id: doc.id,
    name: doc.name ?? 'Document',
    originalName: doc.originalName ?? doc.original_name ?? null,
    type: doc.type ?? 'other',
    mimeType: doc.mimeType ?? doc.mime_type ?? null,
    sizeBytes: doc.sizeBytes ?? doc.size_bytes ?? null,
    url: doc.url ?? null,
    isPreviewable:
      doc.isPreviewable ??
      doc.is_previewable ??
      ((doc.mimeType ?? doc.mime_type ?? '') === 'application/pdf' ||
        String(doc.mimeType ?? doc.mime_type ?? '').startsWith('image/')),
    createdAt: doc.createdAt ?? doc.created_at ?? null,
  }));

  const zoneObj =
    raw.zone ??
    locationDetails?.zone ??
    null;

  const zoneName =
    typeof zoneObj === 'string'
      ? zoneObj
      : zoneObj?.name ?? zoneObj?.label ?? '—';

  const latitude =
    raw.latitude ??
    locationDetails?.coordinates?.latitude ??
    raw.lat ??
    null;

  const longitude =
    raw.longitude ??
    locationDetails?.coordinates?.longitude ??
    raw.lng ??
    null;

  const surfaceValue =
    raw.surfaceM2 ??
    hero?.surface?.value ??
    raw.surface_m2 ??
    null;

  const formattedSurface =
    raw.surface ??
    hero?.surface?.formatted ??
    (surfaceValue ? `${Number(surfaceValue).toLocaleString('fr-FR')} m²` : '—');

  const formattedPrice =
    hero?.price?.formatted ??
    (flatPrice
      ? `${Number(flatPrice).toLocaleString('fr-FR')} ${raw.currency ?? hero?.price?.currency ?? 'FCFA'}`
      : '—');

  const availability =
    hero?.availability?.value ??
    raw.availability ??
    raw.status ??
    'available';

  const availabilityLabel =
    hero?.availability?.label ??
    reassurance?.availabilityLabel ??
    (availability === 'available'
      ? 'Disponible'
      : availability === 'reserved'
      ? 'Réservé'
      : 'Indisponible');

  return {
    id: raw.id,
    ref: raw.ref ?? raw.reference ?? null,
    title: raw.title ?? hero?.title ?? raw.name ?? 'Terrain',
    subtitle: hero?.subtitle ?? null,

    location:
      raw.location ??
      locationDetails?.label ??
      raw.city ??
      raw.address ??
      'Localisation indisponible',

    surface: formattedSurface,
    surfaceM2: surfaceValue,

    zone: zoneName,
    zoneId: raw.zone_id ?? raw.zoneId ?? zoneObj?.id ?? null,
    zoneRegion: zoneObj?.region ?? null,

    price: flatPrice,
    formattedPrice,
    currency: raw.currency ?? hero?.price?.currency ?? 'FCFA',

    imageUrl: mainImage,
    mainImage,
    images: normalizedImages,

    documents,

    latitude,
    longitude,
    hasCoordinates: latitude != null && longitude != null,

    availability,
    availabilityLabel,

    badges:
      hero?.badges ??
      reassurance?.badges ??
      raw.badges ??
      [],

    trustPoints:
      reassurance?.trustPoints ??
      [],

    description:
      raw.description ??
      raw.descriptionBlock?.full ??
      raw.descriptionBlock?.short ??
      '',

    shortDescription:
      raw.descriptionBlock?.short ??
      raw.description ??
      '',

    amenities:
      features?.amenities ??
      raw.amenities ??
      [],

    highlights:
      features?.highlights ??
      [],

    legal: {
      titleDeed: legal?.titleDeed ?? false,
      surveyPlan: legal?.surveyPlan ?? false,
      contractAvailable: legal?.contractAvailable ?? false,
      highlights: legal?.highlights ?? [],
    },

    payment: {
      cash: {
        enabled: payment?.cash?.enabled ?? false,
        label: payment?.cash?.label ?? 'Cash',
        benefit: payment?.cash?.benefit ?? null,
      },
      installment: {
        enabled: payment?.installment?.enabled ?? false,
        label: payment?.installment?.label ?? 'Échelonné',
        benefit: payment?.installment?.benefit ?? null,
        minimumDownPaymentPercent:
          payment?.installment?.minimumDownPaymentPercent ?? null,
        maxDurationMonths:
          payment?.installment?.maxDurationMonths ?? null,
        note: payment?.installment?.note ?? null,
      },
    },

    cta: {
      contactEnabled: cta?.contactEnabled ?? true,
      visitEnabled: cta?.visitEnabled ?? true,
      requiresAccountForVisit: cta?.requiresAccountForVisit ?? true,
      primary: cta?.primary ?? { type: 'contact', label: 'Contacter un conseiller' },
      secondary: cta?.secondary ?? { type: 'visit', label: 'Planifier une visite' },
    },

    isVerified:
      raw.isVerified ??
      raw.verified ??
      raw.titleVerified ??
      false,

    raw,
  };
}

export function normalizeTerrainsResponse(payload) {
  const root = payload ?? {};
  const rawItems =
    Array.isArray(root?.data) ? root.data :
    Array.isArray(root?.items) ? root.items :
    Array.isArray(root?.terrains) ? root.terrains :
    Array.isArray(root?.data?.items) ? root.data.items :
    Array.isArray(root?.data?.terrains) ? root.data.terrains :
    [];

  const meta = root?.meta ?? root?.data?.meta ?? {};

  return {
    items: rawItems.map(normalizeTerrain),
    total: root?.total ?? meta?.total ?? rawItems.length ?? 0,
    page: root?.page ?? meta?.page ?? 1,
    pages: root?.pages ?? meta?.pages ?? 1,
  };
}

export function normalizeMapTerrains(payload) {
  const root = payload?.data ?? payload ?? {};
  const items =
    root?.items ??
    root?.terrains ??
    root?.data ??
    root ??
    [];

  if (!Array.isArray(items)) return [];

  return items
    .map((item) => normalizeTerrain(item))
    .filter((item) => item.latitude != null && item.longitude != null);
}