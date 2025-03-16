// scripts/create-admin.ts
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as readline from 'readline';
import * as dotenv from 'dotenv';

// Charger les variables d'environnement
dotenv.config();

const prisma = new PrismaClient();

// Configuration du terminal interactif
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Fonction pour poser une question et obtenir la réponse (Promise)
function question(query: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(query, (answer) => {
      resolve(answer);
    });
  });
}

// Fonction pour valider l'email
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Fonction principale
async function createAdmin() {
  console.log('=== Création d\'un compte Super Admin - Aloha Secourisme ===');
  console.log();

  try {
    // Demander l'email
    let email = '';
    let isEmailValid = false;
    
    while (!isEmailValid) {
      email = await question('Email du Super Admin: ');
      isEmailValid = isValidEmail(email);
      
      if (!isEmailValid) {
        console.log('Email invalide. Veuillez réessayer.');
      }
    }

    // Vérifier si l'email existe déjà
    const existingAdmin = await prisma.admin.findUnique({
      where: { email },
    });

    if (existingAdmin) {
      console.log(`Un utilisateur avec l'email ${email} existe déjà.`);
      const updateExisting = await question('Voulez-vous mettre à jour son rôle en SUPER_ADMIN? (o/n): ');
      
      if (updateExisting.toLowerCase() === 'o' || updateExisting.toLowerCase() === 'oui') {
        await prisma.admin.update({
          where: { email },
          data: { role: 'SUPER_ADMIN' },
        });
        
        console.log(`L'utilisateur ${email} a été promu SUPER_ADMIN avec succès!`);
      } else {
        console.log('Opération annulée.');
      }
      
      rl.close();
      await prisma.$disconnect();
      return;
    }

    // Demander les informations supplémentaires
    const nom = await question('Nom de famille: ');
    const prenom = await question('Prénom: ');
    const password = await question('Mot de passe (min 8 caractères): ');

    if (password.length < 8) {
      console.log('Le mot de passe doit contenir au moins 8 caractères. Opération annulée.');
      rl.close();
      await prisma.$disconnect();
      return;
    }
    
    // Confirmation du mot de passe
    const confirmPassword = await question('Confirmez le mot de passe: ');
    
    if (password !== confirmPassword) {
      console.log('Les mots de passe ne correspondent pas. Opération annulée.');
      rl.close();
      await prisma.$disconnect();
      return;
    }

    // Hashage du mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);

    // Création du super admin
    const admin = await prisma.admin.create({
      data: {
        email,
        password: hashedPassword,
        nom,
        prenom,
        role: 'SUPER_ADMIN',
      },
    });

    console.log();
    console.log('Super Admin créé avec succès!');
    console.log('Détails du compte:');
    console.log(`- Email: ${admin.email}`);
    console.log(`- Nom: ${admin.nom} ${admin.prenom}`);
    console.log(`- Rôle: ${admin.role}`);
    console.log();
    console.log('Vous pouvez maintenant vous connecter à l\'interface d\'administration');
    console.log('avec les identifiants que vous venez de créer.');

  } catch (error) {
    console.error('Erreur lors de la création du super admin:', error);
  } finally {
    rl.close();
    await prisma.$disconnect();
  }
}

// Exécuter la fonction principale
createAdmin();