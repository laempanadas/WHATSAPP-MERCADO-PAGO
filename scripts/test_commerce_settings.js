#!/usr/bin/env node

import 'dotenv/config';
import { configurarVisibilidadeCommerce } from '../src/services/commerce-settings.service.js';
import { PHONE_NUMBER_ID, WA_TOKEN } from '../src/config/whatsapp.js';

async function verificarConfiguracoes() {
  console.log('📋 Verificando configurações de commerce settings...\n');
  
  if (!PHONE_NUMBER_ID) {
    console.error('❌ PHONE_NUMBER_ID não configurado.');
    process.exit(1);
  }

  if (!WA_TOKEN) {
    console.error('❌ WA_TOKEN não configurado.');
    process.exit(1);
  }

  console.log(`📱 Número do WhatsApp: ${PHONE_NUMBER_ID}`);
  console.log(`🔐 Token: ${WA_TOKEN.slice(0, 20)}...`);
  console.log(`🌐 Endpoint: https://graph.facebook.com/v25.0/${PHONE_NUMBER_ID}/whatsapp_commerce_settings\n`);

  try {
    console.log('⏳ Aplicando configurações (catálogo visível + carrinho habilitado)...\n');
    
    const resultado = await configurarVisibilidadeCommerce({
      phoneNumberId: PHONE_NUMBER_ID,
      accessToken: WA_TOKEN,
      isCatalogVisible: true,
      isCartEnabled: true
    });

    if (resultado) {
      console.log('✅ Configurações aplicadas com sucesso!');
      console.log('   • Catálogo visível: true');
      console.log('   • Carrinho habilitado: true');
    }
  } catch (error) {
    console.error('❌ Erro ao aplicar configurações:');
    console.error(`   ${error.message}`);
    
    // Tenta obter mais detalhes da resposta
    if (error.message.includes('403')) {
      console.error('\n💡 Dica: Erro 403 geralmente significa que o token não tem permissão.');
      console.error('   Verifique se o token é do app correto com permissões de comércio.');
    }
    
    if (error.message.includes('400')) {
      console.error('\n💡 Dica: Erro 400 pode indicar que o número comercial não existe ou');
      console.error('   não está associado ao catálogo.');
    }
    
    process.exit(1);
  }
}

verificarConfiguracoes();
