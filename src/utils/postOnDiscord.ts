import axios from 'axios';
import * as fs from 'fs';
import FormData = require('form-data'); // Importação correta do FormData

export async function sendPollToDiscord(text: string, localImagePath: string) {
  const webhookUrl = "https://discord.com/api/webhooks/1298544417346682912/tEyf4M_VkgT8qKv5bbdB9y7Sad1wcqRv_DuzhQlDvRiaSYP0pFKybZbuZmx8VUGemCoR";

  // Certifique-se de que o caminho da imagem é válido e o arquivo existe
  if (!fs.existsSync(localImagePath)) {
    console.error(`File not found: ${localImagePath}`);
    return;
  }

  const form = new FormData();
  form.append('content', text);
  form.append('file', fs.createReadStream(localImagePath), 'poll.png');

  try {
    await axios.post(webhookUrl, form, {
      headers: {
        ...form.getHeaders(),
      },
    });
    console.log(' ----------------- Poll sent to Discord ----------------- ')
  } catch (error) {
    console.error('Error sending message to Discord:', error);
  }
}
