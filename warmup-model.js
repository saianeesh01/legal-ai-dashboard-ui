#!/usr/bin/env node

/**
 * Simple CLI utility to warm up the Ollama model before document uploads
 */

import fetch from 'node-fetch';

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:5001';
const OLLAMA_URL = 'http://localhost:11434';

async function checkOllamaStatus() {
  try {
    console.log('🔍 Checking Ollama status...');
    const response = await fetch(`${OLLAMA_URL}/api/tags`);
    if (response.ok) {
      const data = await response.json();
      const models = data.models || [];
      console.log(`✅ Ollama is running with ${models.length} models available`);
      return true;
    }
    return false;
  } catch (error) {
    console.log('❌ Ollama is not running on port 11434');
    return false;
  }
}

async function warmupModel() {
  try {
    console.log('🔥 Warming up AI model...');
    
    // Direct Ollama warmup
    const warmupPayload = {
      model: 'mistral:latest',
      prompt: 'You are a legal document analysis AI. Analyze this sample: "NOTICE TO APPEAR - Immigration Court proceedings." Provide a brief analysis. This is a warmup request.',
      stream: false,
      options: {
        temperature: 0.3,
        num_predict: 100
      }
    };
    
    const response = await fetch(`${OLLAMA_URL}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(warmupPayload)
    });
    
    if (response.ok) {
      const result = await response.text();
      console.log('✅ Model warmed up successfully!');
      console.log('📋 Model is ready for legal document analysis');
      return true;
    } else {
      console.log('❌ Warmup failed:', await response.text());
      return false;
    }
    
  } catch (error) {
    console.log('❌ Warmup error:', error.message);
    return false;
  }
}

async function main() {
  console.log('🚀 Legal AI Model Warmup Utility');
  console.log('================================');
  
  const ollamaRunning = await checkOllamaStatus();
  
  if (!ollamaRunning) {
    console.log('\n📝 To start Ollama with Mistral:');
    console.log('   ollama serve');
    console.log('   ollama pull mistral:latest');
    console.log('   ollama run mistral:latest');
    process.exit(1);
  }
  
  const warmupSuccess = await warmupModel();
  
  if (warmupSuccess) {
    console.log('\n🎯 Ready to process legal documents!');
    console.log('   Your AI model is warmed up and should respond faster now.');
  } else {
    console.log('\n⚠️  Warmup completed with issues');
    console.log('   The model should still work, but may be slower on first use.');
  }
}