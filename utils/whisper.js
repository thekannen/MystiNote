import fetch from 'node-fetch';
import FormData from 'form-data';
import fs from 'fs';

export async function transcribeAndSummarize(filePath, username) {
  if (!fs.existsSync(filePath)) {
    console.error(`Audio file not found for transcription: ${filePath}`);
    return null;
  }

  const formData = new FormData();
  formData.append('file', fs.createReadStream(filePath));
  formData.append('model', 'whisper-1');

  try {
    // Transcribe audio
    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        ...formData.getHeaders(),
      },
      body: formData,
    });

    const data = await response.json();
    if (data.text) {
      const now = new Date();
      const timestamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
      const transcriptionText = `${timestamp} - ${username}: ${data.text}`;
      const transcriptionFile = `transcription_${username}.txt`;

      // Save transcription with timestamp
      fs.writeFileSync(transcriptionFile, transcriptionText);
      console.log(`Transcription saved as ${transcriptionFile}`);

      // Generate summary
      const summary = await generateSummary(data.text);
      return { summary, transcriptionFile };
    } else {
      console.error('Transcription failed:', data.error);
      return null;
    }
  } catch (error) {
    console.error('Failed to transcribe audio:', error);
    return null;
  }
}

// Function to generate a summary of the transcription
export async function generateSummary(transcriptionText) {
  const prompt = `
    Here is a conversation transcript. Please summarize the conversation, ignoring any background noise, music, or non-speech sounds. Focus only on the spoken content and relevant dialog.

    Transcript:
    ${transcriptionText}

    Summary:
  `;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4-turbo',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 150,
        temperature: 0.5,
      }),
    });

    const data = await response.json();
    if (data.choices && data.choices.length > 0) {
      return data.choices[0].message.content.trim();
    } else {
      console.error('No summary available.');
      return 'No summary available';
    }
  } catch (error) {
    console.error('Failed to generate summary:', error);
    return 'Summary generation failed';
  }
}
