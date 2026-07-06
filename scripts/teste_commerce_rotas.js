#!/usr/bin/env node

import 'dotenv/config';
import { WA_TOKEN, PHONE_NUMBER_ID } from '../src/config/whatsapp.js';

async function testarCommerceAlternativo() {
  console.log('🔄 Testando rotas alternativas para commerce settings...\n');

  if (!WA_TOKEN || !PHONE_NUMBER_ID) {
    console.error('❌ Variáveis não configuradas.');
    process.exit(1);
  }

  // Rota 1: Direto no phone_number com GET
  console.log('1️⃣  GET /<PHONE_NUMBER_ID>/whatsapp_commerce_settings');
  try {
    const response = await fetch(
      `https://graph.facebook.com/v25.0/${PHONE_NUMBER_ID}/whatsapp_commerce_settings`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${WA_TOKEN}`
        }
      }
    );
    const data = await response.json();
    if (response.ok) {
      console.log('✅ Sucesso!');
      console.log(JSON.stringify(data, null, 2));
    } else {
      console.log(`❌ Erro ${response.status}:`, data.error?.message);
    }
  } catch (err) {
    console.error('❌ Erro:', err.message);
  }

  // Rota 2: Com parâmetros de fields
  console.log('\n2️⃣  GET /<PHONE_NUMBER_ID>?fields=whatsapp_commerce_settings');
  try {
    const response = await fetch(
      `https://graph.facebook.com/v25.0/${PHONE_NUMBER_ID}?fields=whatsapp_commerce_settings`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${WA_TOKEN}`
        }
      }
    );
    const data = await response.json();
    if (response.ok) {
      console.log('✅ Sucesso!');
      console.log(JSON.stringify(data, null, 2));
    } else {
      console.log(`❌ Erro ${response.status}:`, data.error?.message);
    }
  } catch (err) {
    console.error('❌ Erro:', err.message);
  }

  // Rota 3: Listar todos os campos disponíveis
  console.log('\n3️⃣  GET /<PHONE_NUMBER_ID>?fields=catalog_status,commerce');
  try {
    const response = await fetch(
      `https://graph.facebook.com/v25.0/${PHONE_NUMBER_ID}?fields=catalog_status,commerce,catalog`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${WA_TOKEN}`
        }
      }
    );
    const data = await response.json();
    console.log(`Status: ${response.status}`);
    console.log(JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('❌ Erro:', err.message);
  }
}

testarCommerceAlternativo();
