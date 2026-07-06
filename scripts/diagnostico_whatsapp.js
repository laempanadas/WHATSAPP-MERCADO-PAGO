#!/usr/bin/env node

import 'dotenv/config';
import { WA_TOKEN, PHONE_NUMBER_ID } from '../src/config/whatsapp.js';

async function explorarConta() {
  console.log('🔎 Explorando estrutura da conta WhatsApp...\n');

  if (!WA_TOKEN) {
    console.error('❌ WA_TOKEN não configurado.');
    process.exit(1);
  }

  // 1. Tentar listar números comerciais
  console.log('1️⃣  Tentando listar números comerciais...');
  try {
    const response = await fetch('https://graph.facebook.com/v25.0/me/phone_numbers', {
      headers: {
        Authorization: `Bearer ${WA_TOKEN}`
      }
    });

    const data = await response.json();
    
    if (response.ok && data.data) {
      console.log('✅ Números encontrados:');
      data.data.forEach((numero, idx) => {
        console.log(`   ${idx + 1}. ID: ${numero.id}`);
        console.log(`      Número: ${numero.phone_number || 'N/A'}`);
        console.log(`      Display: ${numero.display_phone_number || 'N/A'}`);
      });
    } else {
      console.error('❌ Erro:', data.error?.message || 'Resposta inesperada');
    }
  } catch (err) {
    console.error('❌ Erro na requisição:', err.message);
  }

  console.log('\n2️⃣  Tentando acessar informações do número atual...');
  if (PHONE_NUMBER_ID) {
    try {
      const response = await fetch(`https://graph.facebook.com/v25.0/${PHONE_NUMBER_ID}`, {
        headers: {
          Authorization: `Bearer ${WA_TOKEN}`
        }
      });

      const data = await response.json();

      if (response.ok) {
        console.log('✅ Informações do número:');
        console.log(JSON.stringify(data, null, 2));
      } else {
        console.error('❌ Erro:', data.error?.message || 'Resposta inesperada');
      }
    } catch (err) {
      console.error('❌ Erro na requisição:', err.message);
    }
  }

  console.log('\n3️⃣  Tentando encontrar a WhatsApp Business Account...');
  try {
    const response = await fetch('https://graph.facebook.com/v25.0/me/whatsapp_business_accounts', {
      headers: {
        Authorization: `Bearer ${WA_TOKEN}`
      }
    });

    const data = await response.json();

    if (response.ok && data.data) {
      console.log('✅ WhatsApp Business Accounts encontradas:');
      data.data.forEach((account, idx) => {
        console.log(`   ${idx + 1}. ID: ${account.id}`);
        console.log(`      Name: ${account.name || 'N/A'}`);
      });
    } else {
      console.error('❌ Erro:', data.error?.message || 'Resposta inesperada');
    }
  } catch (err) {
    console.error('❌ Erro na requisição:', err.message);
  }
}

explorarConta();
