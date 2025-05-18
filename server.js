const express = require('express');
const cors = require('cors');
const mysql = require('mysql2');
const app = express();
const port = 5000;

app.use(cors());
app.use(express.json());

const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'bank_app'
});

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
  
app.listen(port, () => {
  console.log(`Serveur backend démarré sur le port ${port}`);
});