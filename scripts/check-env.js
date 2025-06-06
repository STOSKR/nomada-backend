#!/usr/bin/env node

/**
 * Script de verificación de variables de entorno para Render
 */
const requiredEnvVars = [
  'SUPABASE_URL',
  'SUPABASE_KEY', // o SUPABASE_SERVICE_KEY
  'JWT_SECRET'
];

const optionalEnvVars = [
  'EMAIL_USER',
  'EMAIL_PASSWORD',
  'CLOUDINARY_NAME',
  'CLOUDINARY_API_KEY',
  'CLOUDINARY_API_SECRET',
  'PORT',
  'HOST',
  'NODE_ENV'
];

function checkEnvironmentVariables() {
  console.log('🔍 Verificando variables de entorno...\n');
  
  let hasErrors = false;
  
  // Verificar variables requeridas
  console.log('📋 Variables REQUERIDAS:');
  for (const envVar of requiredEnvVars) {
    if (envVar === 'SUPABASE_KEY') {
      // Para SUPABASE_KEY, verificar si existe SUPABASE_KEY o SUPABASE_SERVICE_KEY
      const hasSupabaseKey = process.env.SUPABASE_KEY || process.env.SUPABASE_SERVICE_KEY;
      if (hasSupabaseKey) {
        const keyType = process.env.SUPABASE_SERVICE_KEY ? 'SUPABASE_SERVICE_KEY' : 'SUPABASE_KEY';
        console.log(`  ✅ ${keyType}: ${hasSupabaseKey.slice(0, 10)}...`);
      } else {
        console.log(`  ❌ ${envVar}: NO DEFINIDA`);
        hasErrors = true;
      }
    } else {
      const value = process.env[envVar];
      if (value) {
        const displayValue = envVar.includes('SECRET') || envVar.includes('KEY') 
          ? `${value.slice(0, 10)}...` 
          : value;
        console.log(`  ✅ ${envVar}: ${displayValue}`);
      } else {
        console.log(`  ❌ ${envVar}: NO DEFINIDA`);
        hasErrors = true;
      }
    }
  }
  
  // Verificar variables opcionales
  console.log('\n📋 Variables OPCIONALES:');
  for (const envVar of optionalEnvVars) {
    const value = process.env[envVar];
    if (value) {
      const displayValue = envVar.includes('PASSWORD') || envVar.includes('SECRET') || envVar.includes('KEY')
        ? `${value.slice(0, 10)}...` 
        : value;
      console.log(`  ✅ ${envVar}: ${displayValue}`);
    } else {
      console.log(`  ⚠️  ${envVar}: no definida (opcional)`);
    }
  }
  
  console.log('\n' + '='.repeat(50));
  
  if (hasErrors) {
    console.log('❌ FALTAN VARIABLES DE ENTORNO REQUERIDAS');
    console.log('👉 Configura estas variables en Render antes del despliegue');
    process.exit(1);
  } else {
    console.log('✅ TODAS LAS VARIABLES REQUERIDAS ESTÁN CONFIGURADAS');
    console.log('🚀 El servidor puede iniciarse correctamente');
  }
}

// Solo ejecutar si es llamado directamente
if (require.main === module) {
  checkEnvironmentVariables();
}

module.exports = { checkEnvironmentVariables };
