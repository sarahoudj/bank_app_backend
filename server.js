const express = require('express');
const cors = require('cors');
const mysql = require('mysql2');
const app = express();
const port = 5000;

app.use(cors());
app.use(express.json());


/*let db; // Déclarez db ici

async function startServer() { // Utilisez une fonction async pour gérer la connexion DB
  try {
    db = await mysql.createConnection({ // Utilisez await ici pour la connexion
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
  // NOUVELLE ROUTE POUR LA CONSULTATION DES TRANSACTIONS
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