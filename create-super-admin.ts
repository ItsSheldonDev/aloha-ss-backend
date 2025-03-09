#!/usr/bin/env node

/**
 * Script de création d'un Super Admin pour l'API Aloha Secourisme
 * 
 * Ce script permet de créer rapidement un compte Super Admin avec les droits complets
 * Utilisation : node create-super-admin.js
 * 
 * Le script demandera interactivement l'email et le mot de passe
 */

import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as readline from 'readline';
import { config } from 'dotenv';
import chalk from 'chalk';

// Charger les variables d'environnement
config();

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

// Fonction pour poser une question en mode masqué (pour le mot de passe)
function questionHidden(query: string): Promise<string> {
  return new Promise((resolve) => {
    const stdin = process.stdin;
    process.stdout.write(query);
    
    // Configure le terminal pour masquer les entrées
    stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding('utf8');
    
    let password = '';
    stdin.on('data', (key: Buffer) => {
      const keyStr = key.toString();
      
      // Ctrl+C pour quitter
      if (keyStr === '\u0003') {
        process.exit();
      }
      
      // Enter key pour terminer
      if (keyStr === '\r' || keyStr === '\n') {
        process.stdout.write('\n');
        stdin.setRawMode(false);
        stdin.pause();
        resolve(password);
        return;
      }
      
      // Backspace pour effacer
      if (keyStr === '\u0008' || keyStr === '\u007f') {
        if (password.length > 0) {
          password = password.slice(0, -1);
          process.stdout.write('\b \b'); // Efface le caractère à l'écran
        }
        return;
      }
      
      // Ajouter le caractère au mot de passe et afficher *
      password += keyStr;
      process.stdout.write('*');
    });
  });
}

// Fonction pour valider l'email
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Fonction pour valider le mot de passe
function isValidPassword(password: string): boolean {
  return password.length >= 8;
}

// Fonction principale
async function createSuperAdmin() {
  console.log(chalk.bgBlue('╔═════════════════════════════════════════════════════════════╗'));
  console.log(chalk.bgBlue('║                                                             ║'));
  console.log(chalk.bgBlue('║   ') + chalk.bgYellow('Création d\'un compte Super Admin - Aloha Secourisme') + chalk.bgBlue('   ║'));
  console.log(chalk.bgBlue('║                                                             ║'));
  console.log(chalk.bgBlue('╚═════════════════════════════════════════════════════════════╝'));
  console.log();

  try {
    // Demander l'email
    let email = '';
    let isEmailValid = false;
    
    while (!isEmailValid) {
      email = await question(chalk.cyan('Email du Super Admin: '));
      isEmailValid = isValidEmail(email);
      
      if (!isEmailValid) {
        console.log(chalk.red('❌ Email invalide. Veuillez réessayer.'));
      }
    }

    // Vérifier si l'email existe déjà
    const existingAdmin = await prisma.admin.findUnique({
      where: { email },
    });

    if (existingAdmin) {
      console.log(chalk.yellow(`⚠️  Un utilisateur avec l'email ${email} existe déjà.`));
      const updateExisting = await question(chalk.cyan('Voulez-vous mettre à jour son rôle en SUPER_ADMIN? (o/n): '));
      
      if (updateExisting.toLowerCase() === 'o' || updateExisting.toLowerCase() === 'oui') {
        await prisma.admin.update({
          where: { email },
          data: { role: Role.SUPER_ADMIN },
        });
        
        console.log(chalk.green(`✅ L'utilisateur ${email} a été promu SUPER_ADMIN avec succès!`));
      } else {
        console.log(chalk.yellow('⚠️  Opération annulée.'));
      }
      
      rl.close();
      await prisma.$disconnect();
      return;
    }

    // Demander les informations supplémentaires
    const nom = await question(chalk.cyan('Nom de famille: '));
    const prenom = await question(chalk.cyan('Prénom: '));
    
    // Demander le mot de passe
    let password = '';
    let isPasswordValid = false;
    
    while (!isPasswordValid) {
      password = await questionHidden(chalk.cyan('Mot de passe (min 8 caractères): '));
      isPasswordValid = isValidPassword(password);
      
      if (!isPasswordValid) {
        console.log(chalk.red('❌ Le mot de passe doit contenir au moins 8 caractères.'));
      }
    }
    
    // Confirmation du mot de passe
    let confirmPassword = await questionHidden(chalk.cyan('Confirmez le mot de passe: '));
    
    if (password !== confirmPassword) {
      console.log(chalk.red('❌ Les mots de passe ne correspondent pas. Opération annulée.'));
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
        role: Role.SUPER_ADMIN,
      },
    });

    console.log();
    console.log(chalk.green('✅ Super Admin créé avec succès!'));
    console.log(chalk.green('╔═════════════════════════════════════════════════╗'));
    console.log(chalk.green('║  Détails du compte:                             ║'));
    console.log(chalk.green('║  ') + chalk.white(`Email: ${admin.email}`) + chalk.green('║'.padStart(43 - admin.email.length)));
    console.log(chalk.green('║  ') + chalk.white(`Nom: ${admin.nom} ${admin.prenom}`) + chalk.green('║'.padStart(43 - (admin.nom.length + admin.prenom.length + 1))));
    console.log(chalk.green('║  ') + chalk.white(`Rôle: ${admin.role}`) + chalk.green('║'.padStart(43 - admin.role.length)));
    console.log(chalk.green('╚═════════════════════════════════════════════════╝'));
    console.log();
    console.log(chalk.blueBright('Vous pouvez maintenant vous connecter à l\'interface d\'administration'));
    console.log(chalk.blueBright('avec les identifiants que vous venez de créer.'));

  } catch (error) {
    console.error(chalk.red('❌ Erreur lors de la création du super admin:'), error);
  } finally {
    rl.close();
    await prisma.$disconnect();
  }
}

// Exécuter la fonction principale
createSuperAdmin();