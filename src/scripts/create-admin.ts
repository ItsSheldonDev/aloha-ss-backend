import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';

// Charger les variables d'environnement
dotenv.config();

const prisma = new PrismaClient();

async function createAdmin() {
  const email = process.env.ADMIN_EMAIL || 'admin@example.com';
  const password = process.env.ADMIN_PASSWORD || 'password123';
  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    // Vérifier si l'admin existe déjà
    const existingAdmin = await prisma.admin.findUnique({
      where: { email },
    });

    if (existingAdmin) {
      console.log(`L'administrateur avec l'email ${email} existe déjà.`);
      return;
    }

    // Créer le super admin
    const admin = await prisma.admin.create({
      data: {
        email,
        password: hashedPassword,
        nom: 'Admin',
        prenom: 'Super',
        role: Role.SUPER_ADMIN,
      },
    });

    console.log(`Super admin créé avec succès: ${admin.email}`);
  } catch (error) {
    console.error('Erreur lors de la création du super admin:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin()
  .then(() => console.log('Script terminé.'))
  .catch((error) => console.error('Erreur d\'exécution du script:', error));