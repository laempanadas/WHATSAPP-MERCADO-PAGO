#!/usr/bin/env node

import 'dotenv/config';
import { PHONE_NUMBER_ID, WA_TOKEN } from '../src/config/whatsapp.js';

async function verificarStatus() {
  console.log('🔍 Consultando status atual das configurações de commerce...\n');
  
  if (!PHONE_NUMBER_ID) {
    console.error('❌ PHONE_NUMBER_ID não configurado.');
    process.exit(1);
  }

  if (!WA_TOKEN) {
    console.error('❌ WA_TOKEN não configurado.');
    process.exit(1);
  }

  const url = `https://graph.facebook.com/v25.0/${PHONE_NUMBER_ID}/whatsapp_commerce_settings`;

  console.log(`📱 Número: ${PHONE_NUMBER_ID}`);
  console.log(`🔐 Token: ${WA_TOKEN.slice(0, 20)}...`);
  console.log(`📍 URL: ${url}\n`);

  try {
    console.log('⏳ Consultando API da Meta...\n');
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${WA_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('❌ Erro na API da Meta:');
      console.error(`   Status: ${response.status}`);
      console.error(`   Resposta: ${JSON.stringify(data, null, 2)}`);
      
      if (response.status === 403) {
        console.error('\n💡 Erro 403: Token sem permissão.');
      } else if (response.status === 404) {
        console.error('\n💡 Erro 404: Número comercial não encontrado.');
      }
      
      process.exit(1);
    }

    console.log('✅ Configurações atuais:\n');
    
    if (data.data && data.data.length > 0) {
      const config = data.data[0];
      console.log(`   ID: ${config.id}`);
      console.log(`   Catálogo visível: ${config.is_catalog_visible ? '✅ Sim' : '❌ Não'}`);
      console.log(`   Carrinho habilitado: ${config.is_cart_enabled ? '✅ Sim' : '❌ Não'}`);
      
      if (!config.is_catalog_visible || !config.is_cart_enabled) {
        console.log('\n⚠️  Para habilitar, execute:');
        console.log('   node scripts/test_commerce_settings.js');
      }
    } else {
      console.log('   Nenhuma configuração encontrada para este número.');
    }
    
    console.log('\n📊 Resposta completa da API:');
    console.log(JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('❌ Erro ao consultar API:');
    console.error(`   ${error.message}`);
    process.exit(1);
  }
}

verificarStatus();
