import CryptoJS from 'crypto-js';

const AES_KEY = 'LexPilot-2026-backup-key'; // Change later if you want

export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { encrypted } = req.body;
  if (!encrypted) {
    return res.status(400).json({ error: 'No data' });
  }

  try {
    const bytes = CryptoJS.AES.decrypt(encrypted, AES_KEY);
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);
    const lead = JSON.parse(decrypted);

    console.log('NEW BACKUP LEAD:', lead);

    // Optional: Send yourself a WhatsApp alert via CallMeBot (free)
    // Uncomment + add your API key from https://www.callmebot.com/blog/free-api-whatsapp-messages/
    /*
    fetch(`https://api.callmebot.com/whatsapp.php?phone=27764312871&text=${encodeURIComponent(
      `NEW LEAD!\nName: ${lead.name}\nTier: ${lead.tier}\nPhone: ${lead.phone}`
    )}&apikey=YOUR_API_KEY_HERE`);
    */

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Decrypt failed:', error);
    res.status(400).json({ error: 'Invalid data' });
  }
}

export const config = { api: { bodyParser: true } };