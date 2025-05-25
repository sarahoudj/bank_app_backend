const express = require('express');
const cors = require('cors');
const mysql = require('mysql2');
const app = express();
const port = 5000;
const bcrypt = require('bcrypt'); // Pour le hachage des mots de passe
const { PDFDocument, rgb, StandardFonts, PageSizes } = require('pdf-lib');
const fs = require('node:fs/promises'); 
const path = require('node:path'); 
app.use(cors());
app.use(express.json());


/*let db; // Déclarez db ici

async function startServer() 
  try {
    db = await mysql.createConnection(
      host: 'localhost',
      user: 'root',
      password: '', // Votre mot de passe MySQL
      database: 'bank_app'
    });
    console.log('Connecté à la base de données MySQL.');*/
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'bank_app'
});
const rawDb = db.promise();
db.connect((err) => {
  if (err) {
    console.error('Erreur de connexion à la base de données:', err);
    return;
  }
  console.log('Connecté à la base de données MySQL');
});

// Fonction pour récupérer les taux de change depuis la base de données
async function getTauxDeChangeFromDB() {
  return new Promise((resolve, reject) => {
    db.query('SELECT code, nom, tauxAchat, tauxVente FROM taux_de_change', (err, results) => {
      if (err) {
        console.error('Erreur lors de la récupération des taux:', err);
        reject(err);
        return;
      }
      resolve(results);
    });
  });
}

// Endpoint pour récupérer les taux de change pour l'affichage
app.get('/api/taux-de-change', async (req, res) => {
  try {
    const taux = await getTauxDeChangeFromDB();
    res.json(taux);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la récupération des taux depuis la base de données', error: error.message });
  }
});

// Endpoint pour modifier un taux de change spécifique
app.post('/api/modifier-taux', async (req, res) => {
  const { code, tauxAchat, tauxVente } = req.body;
  const query = 'UPDATE taux_de_change SET tauxAchat = ?, tauxVente = ? WHERE code = ?';

  db.query(query, [tauxAchat, tauxVente, code], (err, result) => {
    if (err) {
      console.error(`Erreur lors de la modification du taux pour ${code}:`, err);
      return res.status(500).json({ message: `Erreur lors de la modification du taux pour ${code}`, error: err.message });
    }
    console.log(`Taux pour ${code} mis à jour:`, result.affectedRows, 'ligne affectée');
    res.json({ message: `Taux pour ${code} mis à jour avec succès` });
  });
});
// Route pour gérer la soumission du formulaire (requête POST)
app.post('/api/allocations', (req, res) => {
    const formData = req.body;
  
    // Requête SQL pour insérer les données dans la table
    const sql = 'INSERT INTO allocations_touristiques SET ?';
  
    db.query(sql, formData, (error, results) => {
      if (error) {
        console.error('Erreur lors de l\'insertion des données:', error);
        res.status(500).json({ error: 'Erreur lors de l\'enregistrement de l\'allocation' });
        return;
      }
      console.log('Allocation enregistrée avec succès. ID:', results.insertId);
      res.status(201).json({ message: 'Allocation enregistrée avec succès', id: results.insertId });
    });
  });
  
// NOUVEL ENDPOINT POUR GÉRER LA SOUMISSION DU FORMULAIRE DE FRAIS DE MISSIONS
app.post('/api/frais-missions', (req, res) => {
    const formData = req.body; // req.body contient l'objet dataToSend du frontend
    const sql = 'INSERT INTO frais_de_missions SET ?';
  
    db.query(sql, formData, (err, results) => {
      if (err) {
        console.error('Erreur lors de l\'insertion des frais de mission:', err);
        // Envoyez une réponse d'erreur au frontend
        return res.status(500).json({
          message: 'Erreur lors de l\'enregistrement des frais de mission',
          error: err.message
        });
      }
      console.log('Frais de mission enregistrés avec succès. ID:', results.insertId);
      // Envoyez une réponse de succès au frontend
      res.status(201).json({
        message: 'Frais de mission enregistrés avec succès',
        id: results.insertId
      });
    });
  });
  // Nouvelle route pour la soumission du formulaire de soins à l'étranger
app.post('/api/soins', (req, res) => {
    const formData = req.body;
    const sql = 'INSERT INTO soins_a_letranger SET ?';
  
    db.query(sql, formData, (err, results) => {
      if (err) {
        console.error('Erreur lors de l\'insertion des données de soins:', err);
        // Envoyez une réponse d'erreur au frontend
        return res.status(500).json({
          message: 'Erreur lors de l\'enregistrement des soins',
          error: err.message
        });
      }
      console.log('Données de soins enregistrées avec succès. ID:', results.insertId);
      // Envoyez une réponse de succès au frontend
      res.status(201).json({
        message: 'Données de soins enregistrées avec succès',
        id: results.insertId
      });
    });
  });
  /*// NOUVELLE ROUTE POUR LA CONSULTATION DES TRANSACTIONS
app.get('/api/transactions', async (req, res) => {
  const filterDate = req.query.date; // Récupère le paramètre 'date' de l'URL

  let queryAllocations = `
    SELECT
        id,
        'Allocation Touristique' AS type,
        date ,
        nom,
        prenom,
        devise AS devise,
        totalEnDinars AS montant_da,
        numPasseport AS reference
    FROM allocations_touristiques
  `;

  let queryFraisMissions = `
    SELECT
        id,
        'Frais de Missions' AS type,
        date AS date,
        nom AS nom,
        prenom AS prenom,
        devise AS devise,
        totalEnDinars AS montant_da,
        numPasseport AS reference
    FROM frais_de_missions
  `;

  let querySoins = `
    SELECT
        id,
        'Soins' AS type,
        date AS date,
        nom AS nom,
        prenom AS prenom,
        devise AS devise,
        totalEnDinars AS montant_da,
        numPasseport AS reference
    FROM soins_a_letranger
  `;

  const whereClause = filterDate ? ` WHERE date = '${filterDate}'` : '';

  // Appliquer le filtre de date à chaque requête SQL
  queryAllocations += whereClause;
  queryFraisMissions += whereClause;
  querySoins += whereClause;

  try { 


    const [allocations] = await rawDb.execute(queryAllocations);
    const [fraisMissions] = await rawDb.execute(queryFraisMissions);
    const [soins] = await rawDb.execute(querySoins);
   



    // Combiner et trier les résultats par date (du plus récent au plus ancien)
    const allTransactions = [...allocations, ...fraisMissions, ...soins]
      .sort((a, b) => new Date(b.date) - new Date(a.date));

    res.json(allTransactions);

  } catch (err) {
    console.error('Erreur lors de la récupération des transactions combinées:', err);
    res.status(500).json({ message: 'Erreur serveur lors de la récupération des transactions.' });
  }
});*/
// VOTRE ROUTE /api/transactions MODIFIÉE POUR ACCEPTER LE FILTRE code_siege
app.get('/api/transactions', async (req, res) => {
  const filterDate = req.query.date;
  const filterCodeSiege = req.query.codeSiege; // <-- NOUVEAU: Récupérer le code_siege du client

  let whereClauses = []; // Pour construire dynamiquement la clause WHERE
  const params = [];      // Pour les paramètres bindés (sécurité contre injections SQL)

  if (filterDate) {
    whereClauses.push(`DATE(date) = ?`); // Utiliser DATE() pour comparer juste la date
    params.push(filterDate);
  }

  if (filterCodeSiege) { // <-- NOUVEAU: Ajouter le filtre code_siege si fourni
    whereClauses.push(`code_siege = ?`);
    params.push(filterCodeSiege);
  }

  let whereString = '';
  if (whereClauses.length > 0) {
    whereString = ` WHERE ${whereClauses.join(' AND ')}`; // Joindre les conditions avec AND
  }

  try {
    // Note: Utilisation de 'db.execute' avec les paramètres bindés
    const [allocations] = await rawDb.execute(`
        SELECT
         id,
         'Allocation Touristique' AS type,
         date ,
         nom,
         prenom,
         devise AS devise,
         totalEnDinars AS montant_da,
         numPasseport AS reference,
         code_siege
        FROM allocations_touristiques
        ${whereString}
    `, params); // Passer les paramètres ici

    const [fraisMissions] = await rawDb.execute(`
        SELECT
         id,
         'Frais de Missions' AS type,
         date AS date,
         nom AS nom,
         prenom AS prenom,
         devise AS devise,
         totalEnDinars AS montant_da,
         numPasseport AS reference,
         code_siege
        FROM frais_de_missions
        ${whereString}
    `, params); // Passer les paramètres ici

    const [soins] = await rawDb.execute(`
        SELECT
         id,
         'Soins' AS type,
         date AS date,
         nom AS nom,
         prenom AS prenom,
         devise AS devise,
         totalEnDinars AS montant_da,
         numPasseport AS reference,
         code_siege
        FROM soins_a_letranger
        ${whereString}
    `, params); // Passer les paramètres ici

    const allTransactions = [...allocations, ...fraisMissions, ...soins]
      .sort((a, b) => new Date(b.date) - new Date(a.date));

    res.json(allTransactions);

  } catch (err) {
    console.error('Erreur lors de la récupération des transactions combinées:', err);
    res.status(500).json({ message: 'Erreur serveur lors de la récupération des transactions.' });
  }
});
// DELETE pour les allocations touristiques
app.delete('/api/allocations/:id', async (req, res) => {
  const transactionId = req.params.id;
  try {
    const result = await rawDb.query('DELETE FROM allocations_touristiques WHERE id = ?', [transactionId]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Allocation non trouvée.' });
    }
    res.status(200).json({ message: 'Allocation supprimée avec succès.' });
  } catch (err) {
    console.error('Erreur lors de la suppression de l\'allocation:', err);
    res.status(500).json({ message: 'Erreur serveur lors de la suppression de l\'allocation.' });
  }
});

// DELETE pour les frais de missions
app.delete('/api/frais-missions/:id', async (req, res) => {
  const transactionId = req.params.id;
  try {
    const result = await rawDb.query('DELETE FROM frais_de_missions WHERE id = ?', [transactionId]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Frais de mission non trouvés.' });
    }
    res.status(200).json({ message: 'Frais de mission supprimés avec succès.' });
  } catch (err) {
    console.error('Erreur lors de la suppression des frais de mission:', err);
    res.status(500).json({ message: 'Erreur serveur lors de la suppression des frais de mission.' });
  }
});

// DELETE pour les soins à l'étranger
app.delete('/api/soins/:id', async (req, res) => {
  const transactionId = req.params.id;
  try {
    const result = await rawDb.query('DELETE FROM soins_a_letranger WHERE id = ?', [transactionId]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Soins non trouvés.' });
    }
    res.status(200).json({ message: 'Soins supprimés avec succès.' });
  } catch (err) {
    console.error('Erreur lors de la suppression des soins:', err);
    res.status(500).json({ message: 'Erreur serveur lors de la suppression des soins.' });
  }
});




// Nouvelle route POST pour l'enregistrement/pseudo-connexion
app.post('/api/simple-login', async (req, res) => {
  const { username, password, code_siege } = req.body; // <-- Maintenant 'username' au lieu de 'nom' et 'prenom'

  if (!username || !password || !code_siege) {
    return res.status(400).json({ message: 'Tous les champs (Nom d\'utilisateur, Mot de passe, Code Siège) sont requis.' });
  }

  try {
    // Hasher le mot de passe avant de le stocker
    const hashedPassword = await bcrypt.hash(password, 10);

    const [result] = await rawDb.execute(
      // Mettre à jour la table 'users' pour utiliser 'username'
      'INSERT INTO users (username, password, code_siege, is_admin) VALUES (?, ?, ?, FALSE)', // is_admin à FALSE par défaut
      [username, hashedPassword, code_siege]
    );

    res.status(201).json({ message: 'Informations utilisateur enregistrées avec succès.', userId: result.insertId });

  } catch (error) {
    console.error('Erreur lors de l\'enregistrement des informations utilisateur:', error);
    // Gérer l'erreur si l'utilisateur (username) existe déjà
    if (error.code === 'ER_DUP_ENTRY') { // Code d'erreur MySQL pour doublon
        return res.status(409).json({ message: 'Ce nom d\'utilisateur existe déjà. Veuillez en choisir un autre.' });
    }
    res.status(500).json({ message: 'Erreur serveur lors de l\'enregistrement.' });
  }
});

// ... (le reste de vos routes existantes) ...
// --- NOUVELLE ROUTE POUR LA PAGE ENCAISSEMENT ---
app.get('/api/encaissement/:codeSiege', async (req, res) => {
    const { codeSiege } = req.params;
    const today = new Date().toISOString().slice(0, 10); // Format YYYY-MM-DD

    try {
        const devises = ['EUR', 'USD', 'GBP', 'CAD', 'CHF', 'JPY', 'SAR', 'AED', 'KWD', 'SEK', 'DKK', 'NOK'];
        let resultsForFrontend = [];

        for (const devise of devises) {
            // 1. Récupérer l'ancien solde initial pour cette devise et ce siège
            const [initialSoldeResult] = await rawDb.execute(
                `SELECT montant_initial FROM soldes_initiaux_devises
                 WHERE code_siege = ? AND devise = ?`,
                [codeSiege, devise]
            );
            const ancienSolde = initialSoldeResult.length > 0 ? parseFloat(initialSoldeResult[0].montant_initial) : 0.00;

            // 2. Calculer la somme des allocations touristiques pour la journée
            const [sumAllocations] = await rawDb.execute(
                `SELECT COALESCE(SUM(coursVenteDevise), 0) AS total
                 FROM allocations_touristiques
                 WHERE code_siege = ? AND devise = ? AND DATE(date) = ?`,
                [codeSiege, devise, today]
            );
            const montantAllocationsJour = parseFloat(sumAllocations[0].total);

            // 3. Calculer la somme des frais de missions pour la journée
            // Assurez-vous que votre table `frais_de_missions` a bien un champ `montant_devise`
            const [sumFraisMissions] = await rawDb.execute(
                `SELECT COALESCE(SUM(coursVenteDevise), 0) AS total
                 FROM frais_de_missions
                 WHERE code_siege = ? AND devise = ? AND DATE(date) = ?`,
                [codeSiege, devise, today]
            );
            const montantFraisMissionsJour = parseFloat(sumFraisMissions[0].total);

            // 4. Calculer la somme des soins à l'étranger pour la journée
            // Assurez-vous que votre table `soins_a_letranger` a bien un champ `montant_devise`
            const [sumSoins] = await rawDb.execute(
                `SELECT COALESCE(SUM(coursVenteDevise), 0) AS total
                 FROM soins_a_letranger
                 WHERE code_siege = ? AND devise = ? AND DATE(date) = ?`,
                [codeSiege, devise, today]
            );
            const montantSoinsJour = parseFloat(sumSoins[0].total);

            // 5. Calculer le nouveau solde pour la journée
            const nouveauSolde = ancienSolde - (montantAllocationsJour + montantFraisMissionsJour + montantSoinsJour);

            resultsForFrontend.push({
                devise: devise,
                ancien_solde: ancienSolde.toFixed(2),
                montant_allocations_jour: montantAllocationsJour.toFixed(2),
                montant_frais_missions_jour: montantFraisMissionsJour.toFixed(2),
                montant_soins_jour: montantSoinsJour.toFixed(2),
                nouveau_solde: nouveauSolde.toFixed(2)
            });
        }
        res.status(200).json(resultsForFrontend);

    } catch (error) {
        console.error('Erreur lors de la récupération des données d\'encaissement:', error);
        res.status(500).json({ message: 'Erreur serveur lors de la récupération des données d\'encaissement.' });
    }
});

// Fonction utilitaire pour générer un PDF de rapport
async function generateTransactionReportPdf(transactionData, typeTransaction, siegeCode) {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage(PageSizes.A4); 

    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    // Charger le logo
    let logoImageBytes;
    try {
        const logoPath = path.join(__dirname, 'assets', 'logoBA.png'); 
        logoImageBytes = await fs.readFile(logoPath);
    } catch (error) {
        console.error("Erreur lors du chargement du logo:", error);
        // Gérer l'absence de logo 
    }

    let logoImage = null;
    if (logoImageBytes) {
        try {
            logoImage = await pdfDoc.embedPng(logoImageBytes);
        } catch (error) {
            console.error("Erreur lors de l'intégration du logo JPG:", error);
        }
    }

    const {
        nom, prenom, nombreAccompagnant, date, profession, paysDestination,
        devise, coursVenteDevise, coursVenteDinars, totalEnDinars, commission
    } = transactionData;

    // Helper pour gérer les valeurs manquantes
    const getOrDefault = (value) => (value !== undefined && value !== null ? value : '/');

    // --- En-tête du rapport ---
    const headerY = page.getHeight() - 50;
    const paddingX = 50;

    if (logoImage) {
        const logoDims = logoImage.scale(0.1); 
        page.drawImage(logoImage, {
            x: paddingX,
            y: headerY - logoDims.height / 2,
            width: logoDims.width,
            height: logoDims.height,
        });
    }

    // Code Siège
    page.drawText(`Siège: ${getOrDefault(siegeCode)}`, {
        x: page.getWidth() - paddingX - 100,
        y: headerY,
        font: fontBold,
        size: 12,
        color: rgb(0, 0, 0),
    });

    // Titre du rapport
    page.drawText('Autorisation de Sortie des Devises', {
        x: paddingX,
        y: headerY - 50,
        font: fontBold,
        size: 20,
        color: rgb(0, 0, 0),
    });

    // --- Informations de la transaction ---
    let currentY = headerY - 120; 

    page.drawText(`Mr/Mme/Mlle: ${getOrDefault(nom)} ${getOrDefault(prenom)}`, {
        x: paddingX, y: currentY, font, size: 12,
    });
    currentY -= 20;

    page.drawText(`Accompagné(e) de: ${getOrDefault(nombreAccompagnant)}`, {
        x: paddingX, y: currentY, font, size: 12,
    });
    currentY -= 20;

    // Date de l'enregistrement du formulaire (date de la transaction)
    const formattedDate = date ? new Date(date).toLocaleDateString('fr-FR') : '/';
    page.drawText(`Délivré le: ${formattedDate}`, {
        x: paddingX, y: currentY, font, size: 12,
    });
    currentY -= 20;

    page.drawText(`Profession: ${getOrDefault(profession)}`, {
        x: paddingX, y: currentY, font, size: 12,
    });
    currentY -= 20;

    page.drawText(`Destination: ${getOrDefault(paysDestination)}`, {
        x: paddingX, y: currentY, font, size: 12,
    });
    currentY -= 20;

    // Motif de la transaction
    let motif = '/';
    switch (typeTransaction) {
        case 'allocation':
            motif = 'Allocation Touristique';
            break;
        case 'frais_mission':
            motif = 'Frais de Mission';
            break;
        case 'soins_etranger':
            motif = 'Soins à l\'Étranger';
            break;
        default:
            motif = 'Non spécifié';
    }
    page.drawText(`Motif: ${motif}`, {
        x: paddingX, y: currentY, font, size: 12,
    });
    currentY -= 40; // Espace avant le tableau

    // --- Tableau Devise et Montant Devise ---
    const table1Y = currentY;
    const table1X = paddingX;
    const colWidth1_1 = 150;
    const colWidth1_2 = 150;
    const rowHeight = 25;
    const lineHeight = 15;
    const fontSize = 11;

    // Headers
    page.drawText('Devise', { x: table1X + 5, y: table1Y - lineHeight, font: fontBold, size: fontSize });
    page.drawText('Montant Devise', { x: table1X + colWidth1_1 + 5, y: table1Y - lineHeight, font: fontBold, size: fontSize });

    // Lignes du tableau
    page.drawLine({
        start: { x: table1X, y: table1Y - rowHeight },
        end: { x: table1X + colWidth1_1 + colWidth1_2, y: table1Y - rowHeight },
        color: rgb(0.5, 0.5, 0.5),
        thickness: 1,
    });

    currentY = table1Y - rowHeight - 5;
    page.drawText(getOrDefault(devise), { x: table1X + 5, y: currentY - lineHeight, font, size: fontSize });
    page.drawText(getOrDefault(parseFloat(coursVenteDevise).toFixed(2)), { x: table1X + colWidth1_1 + 5, y: currentY - lineHeight, font, size: fontSize });
    currentY -= (rowHeight + 5);

    page.drawLine({
        start: { x: table1X, y: currentY + lineHeight + 5},
        end: { x: table1X + colWidth1_1 + colWidth1_2, y: currentY + lineHeight + 5},
        color: rgb(0.5, 0.5, 0.5),
        thickness: 1,
    });

    // Dessiner les bordures du tableau 1
    page.drawRectangle({
        x: table1X, y: table1Y - rowHeight - (rowHeight * 1),
        width: colWidth1_1 + colWidth1_2, height: rowHeight * 2, // Hauteur pour entête + 1 ligne de données
        borderColor: rgb(0.5, 0.5, 0.5),
        borderWidth: 1,
    });
    page.drawLine({
        start: { x: table1X + colWidth1_1, y: table1Y - rowHeight - (rowHeight * 1) },
        end: { x: table1X + colWidth1_1, y: table1Y },
        color: rgb(0.5, 0.5, 0.5),
        thickness: 1,
    });


    // --- Tableau Contre Valeur, Commission, Total DA ---
    currentY -= 40; // Espace après le premier tableau
    const table2Y = currentY;
    const table2X = paddingX;
    const colWidth2_1 = 150;
    const colWidth2_2 = 150;
    const colWidth2_3 = 150;

    // Headers
    page.drawText('Contre valeur en DA', { x: table2X + 5, y: table2Y - lineHeight, font: fontBold, size: fontSize });
    page.drawText('Commission en DA', { x: table2X + colWidth2_1 + 5, y: table2Y - lineHeight, font: fontBold, size: fontSize });
    page.drawText('Total en DA', { x: table2X + colWidth2_1 + colWidth2_2 + 5, y: table2Y - lineHeight, font: fontBold, size: fontSize });

    // Lignes du tableau
    page.drawLine({
        start: { x: table2X, y: table2Y - rowHeight },
        end: { x: table2X + colWidth2_1 + colWidth2_2 + colWidth2_3, y: table2Y - rowHeight },
        color: rgb(0.5, 0.5, 0.5),
        thickness: 1,
    });

    currentY = table2Y - rowHeight - 5;
    page.drawText(getOrDefault(parseFloat(coursVenteDinars).toFixed(2)), { x: table2X + 5, y: currentY - lineHeight, font, size: fontSize });
    page.drawText(getOrDefault(parseFloat(commission).toFixed(2)), { x: table2X + colWidth2_1 + 5, y: currentY - lineHeight, font, size: fontSize });
    page.drawText(getOrDefault(parseFloat(totalEnDinars).toFixed(2)), { x: table2X + colWidth2_1 + colWidth2_2 + 5, y: currentY - lineHeight, font, size: fontSize });
    currentY -= (rowHeight + 5);

    page.drawLine({
        start: { x: table2X, y: currentY + lineHeight + 5},
        end: { x: table2X + colWidth2_1 + colWidth2_2 + colWidth2_3, y: currentY + lineHeight + 5},
        color: rgb(0.5, 0.5, 0.5),
        thickness: 1,
    });

    // Dessiner les bordures du tableau 2
    page.drawRectangle({
        x: table2X, y: table2Y - rowHeight - (rowHeight * 1),
        width: colWidth2_1 + colWidth2_2 + colWidth2_3, height: rowHeight * 2,
        borderColor: rgb(0.5, 0.5, 0.5),
        borderWidth: 1,
    });
    page.drawLine({
        start: { x: table2X + colWidth2_1, y: table2Y - rowHeight - (rowHeight * 1) },
        end: { x: table2X + colWidth2_1, y: table2Y },
        color: rgb(0.5, 0.5, 0.5),
        thickness: 1,
    });
    page.drawLine({
        start: { x: table2X + colWidth2_1 + colWidth2_2, y: table2Y - rowHeight - (rowHeight * 1) },
        end: { x: table2X + colWidth2_1 + colWidth2_2, y: table2Y },
        color: rgb(0.5, 0.5, 0.5),
        thickness: 1,
    });


    // --- Date de la transaction ---
    currentY -= 40; // Espace après le deuxième tableau
    page.drawText(`Date de la transaction: ${formattedDate}`, {
        x: paddingX, y: currentY, font, size: 12,
    });

    return await pdfDoc.save();
}


// --- Nouvelle route pour générer le rapport PDF ---
app.get('/api/report/:type/:id', async (req, res) => {
    const { type, id } = req.params;
    const { codeSiege } = req.query; // Récupérer le codeSiege depuis les query params

    let tableName;
    let transactionData;

    switch (type) {
        case 'allocation':
            tableName = 'allocations_touristiques';
            break;
        case 'frais_mission':
            tableName = 'frais_de_missions';
            break;
        case 'soins_etranger':
            tableName = 'soins_a_letranger';
            break;
        default:
            return res.status(400).json({ message: 'Type de transaction invalide.' });
    }

    try {
        const [rows] = await rawDb.execute(`SELECT * FROM ${tableName} WHERE id = ?`, [id]);

        if (rows.length === 0) {
            return res.status(404).json({ message: 'Transaction non trouvée.' });
        }
        transactionData = rows[0];

        // Générer le PDF
        const pdfBytes = await generateTransactionReportPdf(transactionData, type, codeSiege); 

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=rapport_${type}_${id}.pdf`);
        res.send(Buffer.from(pdfBytes));

    } catch (error) {
        console.error(`Erreur lors de la génération du rapport PDF pour ${type} ID ${id}:`, error);
        res.status(500).json({ message: `Erreur serveur lors de la génération du rapport PDF.` });
    }
});

app.listen(port, () => {
  console.log(`Serveur backend démarré sur le port ${port}`);
});
/*//nouveau champs pour la cnx de bdd 
} catch (err) {
  console.error('Impossible de se connecter à la base de données et de démarrer le serveur:', err);
  process.exit(1); // Arrêter le processus si la connexion DB échoue
}
}

startServer();*/