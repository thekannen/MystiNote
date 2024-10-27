import fs from 'fs';
import path from 'path';
import { generateSummary } from '../utils/whisper.js';
import { fileURLToPath } from 'url';
import { logger } from '../utils/logger.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const transcriptsDir = path.join(__dirname, '../transcripts');

export async function revealSummary(interaction) {
  try {
    const sessionName = interaction.options.getString('session');
    if (!sessionName) {
      await interaction.reply('Please provide a session name to summarize.');
      return;
    }

    const sessionTranscriptDir = path.join(transcriptsDir, sessionName);
    if (!fs.existsSync(sessionTranscriptDir)) {
      await interaction.reply(`No session named "${sessionName}" found.`);
      return;
    }

    // Find the latest summary file for the session
    const summaryFiles = fs.readdirSync(sessionTranscriptDir)
      .filter(file => file.startsWith('summary_') && file.endsWith('.txt'));

    if (summaryFiles.length === 0) {
      await interaction.reply('No summary found for the specified session.');
      return;
    }

    // Sort summary files by modification time to get the most recent
    const latestSummaryFile = summaryFiles
      .map(file => ({ file, time: fs.statSync(path.join(sessionTranscriptDir, file)).mtime }))
      .sort((a, b) => b.time - a.time)[0].file;

    const summaryFilePath = path.join(sessionTranscriptDir, latestSummaryFile);
    const summaryText = fs.readFileSync(summaryFilePath, 'utf-8');

    if (summaryText) {
      await interaction.reply(`A brief vision appears… Here is the essence of what was revealed:\n\n${summaryText}`);
    } else {
      await interaction.reply('Unable to reveal the summary of the vision.');
    }
  } catch (error) {
    logger('Error revealing summary:', 'error');
    await interaction.reply('An error occurred while attempting to reveal the summary.');
  }
}

export async function retrieveFullTranscription(interaction) {
  try {
    const sessionName = interaction.options.getString('session');
    if (!sessionName) {
      await interaction.reply('Please provide a session name to retrieve the transcription.');
      return;
    }

    const sessionTranscriptDir = path.join(transcriptsDir, sessionName);
    if (!fs.existsSync(sessionTranscriptDir)) {
      await interaction.reply(`No session named "${sessionName}" found.`);
      return;
    }

    const files = fs.readdirSync(sessionTranscriptDir).filter(file => file.endsWith('.txt'));
    if (files.length === 0) {
      await interaction.reply('No transcripts found for the specified session.');
      return;
    }

    const sortedFiles = files
      .map(file => ({ file, time: fs.statSync(path.join(sessionTranscriptDir, file)).mtime }))
      .sort((a, b) => b.time - a.time);

    const transcriptionFile = path.join(sessionTranscriptDir, sortedFiles[0].file);
    const transcriptionText = fs.readFileSync(transcriptionFile, 'utf-8');
    await interaction.reply(`The orb reveals every word it has transcribed… the complete vision awaits:\n\n${transcriptionText}`);
  } catch (error) {
    logger('Error retrieving full transcription:', 'error');
    await interaction.reply('An error occurred while attempting to retrieve the full transcription.');
  }
}
