/* ============================================================
   GESTION DE STOCK — SITE WEB TONGA LAFATRA
   ------------------------------------------------------------
   Ity server.js ity dia:
   1) MAMPISEHO NY SITE (interface) — ny fichier
      public/index.html (ny application Gestion de Stock & Journal
      efa nampiasainao teo aloha) dia atolotra mivantana amin'ny
      mpampiasa rehefa mitsidika ny adiresy amin'ny navigateur izy.
   2) MANOME NY BACKEND PAIEMENT — ny endpoint /api/momo/pay
      iantsoan'ilay site rehefa misy paiement Airtel Money,
      Orange Money, na MVola.

   Tsy backend fotsiny intsony izy io fa TONTOLO WEB APPLICATION
   iray manontolo azo lefasoina (npm start) ka jerena amin'ny
   navigateur toy ny site tokoa.
============================================================ */

require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;
const API_KEY = (process.env.API_KEY || '').trim();

/* ------------------------------------------------------------
   1) SITE — fampisehoana ny interface (frontend)
   Ny rehetra ao amin'ny dossier "public/" (anisan'izany ny
   index.html, izay ny application Gestion de Stock & Journal)
   dia atolotra mivantana amin'ny mpampiasa.
------------------------------------------------------------ */
app.use(express.static(path.join(__dirname, 'public')));

/* ------------------------------------------------------------
   2) BACKEND — sécurité : clé API optionnelle
------------------------------------------------------------ */
function checkApiKey(req, res, next) {
  if (!API_KEY) return next();
  const provided = req.headers['x-api-key'];
  if (provided !== API_KEY) {
    return res.status(401).json({ status: 'error', message: 'Clé API invalide ou manquante' });
  }
  next();
}

function isValidMgPhone(phone) {
  return typeof phone === 'string' && /^\d{9,10}$/.test(phone.replace(/[\s.-]/g, ''));
}

/* ============================================================
   INTÉGRATIONS PAR OPÉRATEUR
   Squelettes à compléter avec la documentation officielle de
   chaque opérateur et les identifiants obtenus après inscription
   marchand. Tant que non configuré : échec explicite, jamais
   un faux succès.
     - Airtel Money : https://developers.airtel.africa/
     - Orange Money : https://developer.orange.com/apis/om-webpay
     - MVola (Telma) : documentation fournie après accord API MVola
============================================================ */
async function payAirtelMoney({ senderPhone, beneficiaryPhone, beneficiaryName, amount, motif, reference }) {
  const clientId = process.env.AIRTEL_CLIENT_ID;
  const clientSecret = process.env.AIRTEL_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return { success: false, message: 'Identifiants Airtel Money non configurés (AIRTEL_CLIENT_ID / AIRTEL_CLIENT_SECRET dans .env)' };
  }
  try {
    // TODO : authentification OAuth2 puis appel de l'API officielle Airtel Money.
    return { success: false, message: 'Intégration Airtel Money non implémentée — compléter payAirtelMoney() avec la doc officielle' };
  } catch (err) {
    return { success: false, message: 'Erreur Airtel Money : ' + (err.response?.data?.message || err.message) };
  }
}

async function payOrangeMoney({ senderPhone, beneficiaryPhone, beneficiaryName, amount, motif, reference }) {
  const clientId = process.env.ORANGE_CLIENT_ID;
  const clientSecret = process.env.ORANGE_CLIENT_SECRET;
  const merchantKey = process.env.ORANGE_MERCHANT_KEY;
  if (!clientId || !clientSecret || !merchantKey) {
    return { success: false, message: 'Identifiants Orange Money non configurés (ORANGE_CLIENT_ID / ORANGE_CLIENT_SECRET / ORANGE_MERCHANT_KEY dans .env)' };
  }
  try {
    // TODO : authentification puis appel de l'API officielle Orange Money.
    return { success: false, message: 'Intégration Orange Money non implémentée — compléter payOrangeMoney() avec la doc officielle' };
  } catch (err) {
    return { success: false, message: 'Erreur Orange Money : ' + (err.response?.data?.message || err.message) };
  }
}

async function payMvola({ senderPhone, beneficiaryPhone, beneficiaryName, amount, motif, reference }) {
  const consumerKey = process.env.MVOLA_CONSUMER_KEY;
  const consumerSecret = process.env.MVOLA_CONSUMER_SECRET;
  const partnerName = process.env.MVOLA_PARTNER_NAME;
  if (!consumerKey || !consumerSecret || !partnerName) {
    return { success: false, message: 'Identifiants MVola non configurés (MVOLA_CONSUMER_KEY / MVOLA_CONSUMER_SECRET / MVOLA_PARTNER_NAME dans .env)' };
  }
  try {
    // TODO : authentification OAuth2 puis appel de l'API officielle MVola.
    return { success: false, message: 'Intégration MVola non implémentée — compléter payMvola() avec la doc officielle' };
  } catch (err) {
    return { success: false, message: 'Erreur MVola : ' + (err.response?.data?.message || err.message) };
  }
}

/* ============================================================
   ROUTE API — appelée par le site (POST /api/momo/pay)
============================================================ */
app.post('/api/momo/pay', checkApiKey, async (req, res) => {
  const { network, senderPhone, beneficiaryPhone, beneficiaryName, amount, motif, reference } = req.body || {};

  if (!network) return res.status(400).json({ status: 'error', message: 'Le réseau (network) est requis' });
  if (!isValidMgPhone(senderPhone)) return res.status(400).json({ status: 'error', message: "Numéro de l'expéditeur invalide" });
  if (!isValidMgPhone(beneficiaryPhone)) return res.status(400).json({ status: 'error', message: 'Numéro du bénéficiaire invalide' });
  if (!beneficiaryName) return res.status(400).json({ status: 'error', message: 'Le nom du bénéficiaire est requis' });
  if (!amount || Number(amount) <= 0) return res.status(400).json({ status: 'error', message: 'Montant invalide' });

  try {
    let result;
    switch (network) {
      case 'Airtel Money':
        result = await payAirtelMoney({ senderPhone, beneficiaryPhone, beneficiaryName, amount, motif, reference });
        break;
      case 'Orange Money':
        result = await payOrangeMoney({ senderPhone, beneficiaryPhone, beneficiaryName, amount, motif, reference });
        break;
      case 'MVola':
        result = await payMvola({ senderPhone, beneficiaryPhone, beneficiaryName, amount, motif, reference });
        break;
      default:
        return res.status(400).json({ status: 'error', message: 'Réseau non pris en charge : ' + network });
    }

    if (result.success) {
      return res.json({ status: 'success', transactionId: result.transactionId, reference: reference || result.transactionId });
    }
    return res.status(502).json({ status: 'error', message: result.message || "Paiement refusé par l'opérateur" });
  } catch (err) {
    console.error('Erreur inattendue /api/momo/pay :', err);
    return res.status(500).json({ status: 'error', message: 'Erreur interne du serveur' });
  }
});

app.get('/health', (req, res) => res.json({ ok: true }));

/* Toute autre route non-API renvoie le site (utile si un jour
   des routes internes de navigation sont ajoutées côté client). */
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) return next();
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`✅ Site + backend démarrés : http://localhost:${PORT}`);
});
// v2
