import test from 'node:test';
import assert from 'node:assert/strict';

import { configurarVisibilidadeCommerce } from '../src/services/commerce-settings.service.js';

test('configura visibilidade do catálogo e carrinho no número do WhatsApp', async () => {
  let captured;

  global.fetch = async (url, options) => {
    captured = { url, options };
    return {
      ok: true,
      json: async () => ({ success: true })
    };
  };

  const resultado = await configurarVisibilidadeCommerce({
    phoneNumberId: '123456789',
    accessToken: 'token-teste',
    isCatalogVisible: true,
    isCartEnabled: true
  });

  assert.equal(resultado, true);
  assert.match(captured.url, /\/123456789\/whatsapp_commerce_settings/);
  assert.match(captured.url, /is_catalog_visible=true/);
  assert.match(captured.url, /is_cart_enabled=true/);
  assert.equal(captured.options.method, 'POST');
  assert.equal(captured.options.headers.Authorization, 'Bearer token-teste');
});
