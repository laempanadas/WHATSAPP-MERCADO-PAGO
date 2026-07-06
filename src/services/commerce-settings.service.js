import { PHONE_NUMBER_ID, WA_TOKEN } from '../config/whatsapp.js';

function buildCommerceSettingsUrl(phoneNumberId, params) {
  const searchParams = new URLSearchParams(params);
  return `https://graph.facebook.com/v25.0/${phoneNumberId}/whatsapp_commerce_settings?${searchParams.toString()}`;
}

export async function configurarVisibilidadeCommerce({
  phoneNumberId = PHONE_NUMBER_ID,
  accessToken = WA_TOKEN,
  isCatalogVisible = true,
  isCartEnabled = true
} = {}) {
  if (!phoneNumberId || !accessToken) {
    throw new Error('PHONE_NUMBER_ID e WA_TOKEN são obrigatórios para configurar o commerce settings.');
  }

  const response = await fetch(buildCommerceSettingsUrl(phoneNumberId, {
    is_catalog_visible: String(isCatalogVisible),
    is_cart_enabled: String(isCartEnabled)
  }), {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    }
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(`Erro ao configurar commerce settings: ${JSON.stringify(data)}`);
  }

  return data.success === true;
}

export async function aplicarConfiguracaoCommercePadrao() {
  if (process.env.COMMERCE_SETTINGS_ENABLED !== 'true' && process.env.COMMERCE_SETTINGS_ENABLED !== '1') {
    return false;
  }

  try {
    return await configurarVisibilidadeCommerce({
      isCatalogVisible: true,
      isCartEnabled: true
    });
  } catch (error) {
    console.warn('Não foi possível aplicar a configuração padrão de commerce settings:', error.message);
    return false;
  }
}
