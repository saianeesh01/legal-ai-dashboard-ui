import fetch from 'node-fetch';
import fs from 'fs';
import FormData from 'form-data';

const API_BASE_URL = 'http://localhost:5000';

async function testFullPipeline() {
  console.log('=== Testing Full Document Upload and AI Summary Pipeline ===');

  try {
    const filePath = './Legal_docs/19-897_c07d.pdf';
    console.log(`\nTesting with file: ${filePath}`);

    // 1. Upload the file
    console.log('\n--- Step 1: Uploading file ---');
    const fileStream = fs.createReadStream(filePath);
    const formData = new FormData();
    formData.append('file', fileStream);

    const uploadResponse = await fetch(`${API_BASE_URL}/api/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!uploadResponse.ok) {
      throw new Error(`Upload failed with status: ${uploadResponse.status}`);
    }

    const uploadResult = await uploadResponse.json();
    const { job_id } = uploadResult;
    console.log(`✓ File uploaded successfully. Job ID: ${job_id}`);

    // 2. Poll for job status
    console.log('\n--- Step 2: Polling for job status ---');
    let jobStatus = '';
    while (jobStatus !== 'DONE') {
      const statusResponse = await fetch(`${API_BASE_URL}/api/status/${job_id}`);
      const statusResult = await statusResponse.json();
      jobStatus = statusResult.state;
      console.log(`  Job status: ${jobStatus}, Progress: ${statusResult.pct}%`);
      if (jobStatus === 'ERROR') {
        throw new Error('Job processing failed');
      }
      if (jobStatus !== 'DONE') {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    console.log('✓ Job processing complete.');

    // 3. Get AI analysis
    console.log('\n--- Step 3: Getting AI analysis ---');
    const analyzeResponse = await fetch(`${API_BASE_URL}/api/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ job_id }),
    });

    if (!analyzeResponse.ok) {
      throw new Error(`Analysis failed with status: ${analyzeResponse.status}`);
    }

    const analyzeResult = await analyzeResponse.json();
    console.log('✓ AI analysis received.');
    console.log('\n--- AI Summary ---');
    console.log(analyzeResult.summary);
    console.log('--------------------');

    console.log('\n🎉 Full pipeline test completed successfully!');

  } catch (error) {
    console.error('\n✗ Full pipeline test failed:', error.message);
  }
}

testFullPipeline().catch(console.error);
