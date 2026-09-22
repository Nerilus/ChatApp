import puppeteer from 'puppeteer-core';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const screenshotsDir = path.resolve(__dirname, '../screenshots');

if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir, { recursive: true });
}

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const BASE_URL = 'http://localhost:5173';

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function run() {
  console.log('🚀 Démarrage du script de capture d\'écran...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--use-fake-ui-for-media-stream',
      '--use-fake-device-for-media-stream',
      '--window-size=1440,900',
    ],
    defaultViewport: {
      width: 1440,
      height: 900,
      deviceScaleFactor: 2,
    },
  });

  try {
    const page = await browser.newPage();

    // 1. Page de connexion
    console.log('📸 1. Capture de la page de connexion...');
    await page.goto(BASE_URL, { waitUntil: 'networkidle0' });
    await sleep(1000);
    await page.screenshot({
      path: path.join(screenshotsDir, '01_connexion.png'),
    });
    console.log('✅ 01_connexion.png sauvegardé');

    // Connexion admin
    console.log('🔑 Connexion en tant qu\'admin...');
    await page.waitForSelector('input[type="text"]');
    await page.type('input[type="text"]', 'admin');
    await page.type('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');

    // 2. Vue d'ensemble du Dashboard
    console.log('📸 2. Capture du Dashboard principal...');
    await page.waitForSelector('.chat-app-layout', { timeout: 15000 });
    await sleep(3000); // Laisser le temps aux salons, messages et websockets de s'initialiser
    await page.screenshot({
      path: path.join(screenshotsDir, '02_dashboard_principal.png'),
    });
    console.log('✅ 02_dashboard_principal.png sauvegardé');

    // 3. Modale de création de salon (Textuel & Vocal)
    console.log('📸 3. Capture de la modale de création de salon...');
    const addChatBtn = await page.$('.channels-header .btn-icon');
    if (addChatBtn) {
      await addChatBtn.click();
      await sleep(800);
      await page.screenshot({
        path: path.join(screenshotsDir, '03_creation_salon_modal.png'),
      });
      console.log('✅ 03_creation_salon_modal.png sauvegardé');
      // Fermer la modale
      const cancelBtn = await page.$('.modal-footer .btn-secondary');
      if (cancelBtn) await cancelBtn.click();
      await sleep(500);
    }

    // 4. Vue de l'onglet Utilisateurs en ligne & Profil Teams
    console.log('📸 4. Capture de l\'onglet Utilisateurs en ligne...');
    const tabs = await page.$$('.sidebar-tab');
    if (tabs.length > 1) {
      await tabs[1].click(); // Onglet 'En ligne'
      await sleep(1000);
      await page.screenshot({
        path: path.join(screenshotsDir, '04_utilisateurs_en_ligne.png'),
      });
      console.log('✅ 04_utilisateurs_en_ligne.png sauvegardé');

      // Cliquer sur le premier utilisateur pour ouvrir le profil style Teams
      const userItem = await page.$('.user-online-info');
      if (userItem) {
        await userItem.click();
        await sleep(800);
        await page.screenshot({
          path: path.join(screenshotsDir, '05_profil_utilisateur_teams.png'),
        });
        console.log('✅ 05_profil_utilisateur_teams.png sauvegardé');

        // Fermer la modale de profil
        const closeProfileBtn = await page.$('.btn-close-modal');
        if (closeProfileBtn) await closeProfileBtn.click();
        await sleep(500);
      }

      // Revenir à l'onglet salons
      await tabs[0].click();
      await sleep(600);
    }

    // 5. Enregistrement d'une note vocale
    console.log('📸 5. Capture du mode enregistrement vocal...');
    const micBtn = await page.$('.btn-mic');
    if (micBtn) {
      await micBtn.click();
      await sleep(2500); // Laisser le compteur monter à 0:02
      await page.screenshot({
        path: path.join(screenshotsDir, '06_enregistrement_vocal.png'),
      });
      console.log('✅ 06_enregistrement_vocal.png sauvegardé');

      // Envoyer la note vocale pour l'afficher dans le chat
      const sendAudioBtn = await page.$('.btn-recorder-send');
      if (sendAudioBtn) {
        await sendAudioBtn.click();
        await sleep(3000); // Attendre upload et affichage du lecteur
      }
    }

    // 6. Lecteur audio avec onde sonore dans le chat
    console.log('📸 6. Capture du lecteur audio dans le chat...');
    await page.screenshot({
      path: path.join(screenshotsDir, '07_lecteur_audio_message.png'),
    });
    console.log('✅ 07_lecteur_audio_message.png sauvegardé');

    // 7. Salon vocal Discord
    console.log('📸 7. Connexion au salon vocal Discord...');
    const voiceChannel = await page.$('.voice-channel-item');
    if (voiceChannel) {
      await voiceChannel.click();
      await sleep(2000);
      await page.screenshot({
        path: path.join(screenshotsDir, '08_salon_vocal_discord.png'),
      });
      console.log('✅ 08_salon_vocal_discord.png sauvegardé');
    }

    // 8. Appel WebRTC 1-à-1
    console.log('📸 8. Déclenchement d\'un appel WebRTC 1-à-1...');
    if (tabs.length > 1) {
      await tabs[1].click(); // Onglet 'En ligne'
      await sleep(800);
      const callBtn = await page.$('.btn-call-user-quick');
      if (callBtn) {
        await callBtn.click();
        await sleep(1500);
        await page.screenshot({
          path: path.join(screenshotsDir, '09_appel_webrtc_sortant.png'),
        });
        console.log('✅ 09_appel_webrtc_sortant.png sauvegardé');

        // Annuler l'appel
        const cancelCallBtn = await page.$('.btn-call-reject');
        if (cancelCallBtn) await cancelCallBtn.click();
        await sleep(500);
      }
    }

    console.log('🎉 Toutes les captures d\'écran ont été créées avec succès !');
  } catch (error) {
    console.error('❌ Erreur lors des captures:', error);
  } finally {
    await browser.close();
  }
}

run();
