const fs = require('fs');
const path = require('path');

// Chemins à vérifier
const publicPath = path.join(process.cwd(), 'public');
const uploadsPath = path.join(publicPath, 'uploads');
const galeriePath = path.join(uploadsPath, 'galerie');
const avatarsPath = path.join(uploadsPath, 'avatars');

console.log('=== Vérification des chemins de fichiers ===');

// Vérifie si un chemin existe et liste son contenu
function checkPath(directoryPath, level = 0) {
  const indent = '  '.repeat(level);
  
  try {
    if (!fs.existsSync(directoryPath)) {
      console.log(`${indent}❌ Le chemin n'existe pas: ${directoryPath}`);
      return false;
    }
    
    const stats = fs.statSync(directoryPath);
    if (!stats.isDirectory()) {
      console.log(`${indent}⚠️ Ce n'est pas un répertoire: ${directoryPath}`);
      return false;
    }
    
    console.log(`${indent}✅ Répertoire trouvé: ${directoryPath}`);
    
    // Liste les fichiers/dossiers
    const items = fs.readdirSync(directoryPath);
    console.log(`${indent}  📂 Contenu (${items.length} éléments):`);
    
    // Affiche seulement les 10 premiers éléments pour éviter un affichage trop long
    const displayItems = items.slice(0, 10);
    for (const item of displayItems) {
      const itemPath = path.join(directoryPath, item);
      const itemStats = fs.statSync(itemPath);
      const icon = itemStats.isDirectory() ? '📁' : '📄';
      console.log(`${indent}    ${icon} ${item}`);
    }
    
    if (items.length > 10) {
      console.log(`${indent}    ... et ${items.length - 10} autres éléments`);
    }
    
    return true;
  } catch (error) {
    console.error(`${indent}❌ Erreur lors de la vérification de ${directoryPath}: ${error.message}`);
    return false;
  }
}

// Vérifier les chemins
console.log('Répertoire de travail actuel:', process.cwd());

checkPath(publicPath, 0);
checkPath(uploadsPath, 1);
checkPath(galeriePath, 2);
checkPath(avatarsPath, 2);

// Vérifier les permissions
console.log('\n=== Vérification des permissions ===');

function checkPermissions(path) {
  try {
    fs.accessSync(path, fs.constants.R_OK);
    console.log(`✅ Le processus a le droit de lecture sur: ${path}`);
    return true;
  } catch (error) {
    console.error(`❌ Pas de droit de lecture sur: ${path}`);
    return false;
  }
}

checkPermissions(publicPath);
checkPermissions(uploadsPath);
checkPermissions(galeriePath);
checkPermissions(avatarsPath);

console.log('\n=== Fin de la vérification ===');
