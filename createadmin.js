// create-admin.js
const fetch = require('node-fetch'); // Vous pourriez avoir besoin d'installer 'node-fetch' : npm install node-fetch@2

const username = 'sarah_admn';
const password = 'admpasse';
const code_siege = 'Alger';

async function createAdmin() {
    try {
        const response = await fetch('http://localhost:5000/api/admin/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password, code_siege })
        });

        const data = await response.json();
        console.log('Réponse du serveur:', data);

        if (response.ok) {
            console.log('Compte administrateur créé avec succès !');
        } else {
            console.error('Erreur lors de la création de l\'administrateur:', data.message);
        }
    } catch (error) {
        console.error('Erreur de connexion au serveur:', error);
    }
}

createAdmin();