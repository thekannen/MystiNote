import { transcribeAndSaveSessionFolder } from '../utils/whisper.js';
import { stopRecording, getSessionName, setSessionName, setScryingSessionActive } from '../utils/recording.js';
import { logger } from '../utils/logger.js';

export async function stopRecordingAndTranscribe(interaction, channel) {
  // Use the provided channel directly if interaction is not provided
  const targetChannel = interaction?.channel || channel;

  if (!targetChannel) {
    logger(`Channel not found. Unable to proceed with transcription.`, 'error');
    return;
  }

  try {
    const sessionName = getSessionName();
    if (!sessionName) {
      if (interaction) {
        await interaction.reply('No active scrying session found. Please start a session first.');
      } else {
        await targetChannel.send('No active scrying session found. Please start a session first.');
      }
      setScryingSessionActive(false);
      return;
    }

    // Initial message asking for patience
    if (interaction) {
      await interaction.reply({
        content: 'Stopping the scrying and processing the vision… This may take a while. Please remain patient and do not leave.',
        ephemeral: false
      });
    } else {
      await targetChannel.send('Stopping the scrying and processing the vision… This may take a while. Please remain patient and do not leave.');
    }
    logger('Stopping recording and processing transcription...', 'info');

    // Stop all active recordings
    await stopRecording();

    const { summary, transcriptionFile } = await transcribeAndSaveSessionFolder(sessionName);
    if (summary) {
      if (interaction) {
        await interaction.editReply(`The orb dims, and the vision is now sealed in writing…\nSummary: ${summary}`);
      } else {
        await targetChannel.send(`The orb dims, and the vision is now sealed in writing…\nSummary: ${summary}`);
      }
      logger(`Transcription saved to ${transcriptionFile}`, 'info');
    } else {
      if (interaction) {
        await interaction.editReply('Transcription or summary failed.');
      } else {
        await targetChannel.send('Transcription or summary failed.');
      }
      logger('Transcription or summary failed.', 'error');
    }

    // Clear session state to prevent further recording
    setSessionName(null);
    setScryingSessionActive(false);

  } catch (error) {
    logger(`Error during stop and transcribe process: ${error.message}`, 'error');
    if (interaction) {
      await interaction.editReply('An error occurred while processing the transcription and summary.');
    } else {
      await targetChannel.send('An error occurred while processing the transcription and summary.');
    }
    setScryingSessionActive(false);
  }
}