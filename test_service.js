require('dotenv').config();
const { gerarIdeias } = require('./services/geradorCarrossel');

async function testGerador() {
  console.log('Testing Gerador Service...');
  const nicho = process.env.USER_NICHE || 'Marketing Digital';
  const tom = process.env.USER_TONE || 'Autoridade, Direto, Persuasivo';
  
  const result = await gerarIdeias(nicho, tom, []);
  console.log('Result:', JSON.stringify(result, null, 2));
}

testGerador();
