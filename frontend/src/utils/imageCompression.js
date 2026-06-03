/**
 * Gère l'upload d'images avec une compression forte et une réduction de taille
 * Optimisé pour gérer les cas où les photos sont trop volumineuses
 */

/**
 * Compresse une image à partir d'un fichier
 * Applique une compression de base (taille limitée et qualité à 50%)
 * @param {File} file - Fichier image à compresser
 * @param {number} maxWidth - Largeur maximale
 * @param {number} maxHeight - Hauteur maximale
 * @param {number} quality - Qualité de l'image (0 à 1)
 * @returns {Promise<string>} URL de données de l'image compressée
 */
export const compressImage = (file, maxWidth = 300, maxHeight = 300, quality = 0.5) => {
  return new Promise((resolve, reject) => {
    try {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          // Calculer les dimensions pour respecter les maxima tout en gardant le ratio
          let width = img.width;
          let height = img.height;
          
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
          
          if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }
          
          // Créer un canvas et dessiner l'image redimensionnée
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          
          // Convertir en Base64 avec compression
          const dataUrl = canvas.toDataURL('image/jpeg', quality);
          
          resolve(dataUrl);
        };
        img.onerror = () => {
          reject(new Error("Erreur lors du chargement de l'image"));
        };
        img.src = event.target.result;
      };
      reader.onerror = () => {
        reject(new Error("Erreur lors de la lecture du fichier"));
      };
      reader.readAsDataURL(file);
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Compresse fortement une image Base64 pour les très grandes images
 * @param {string} imageBase64 - Image en Base64 à compresser
 * @param {number} maxDim - Dimension maximale (hauteur ou largeur)
 * @param {number} quality - Qualité de l'image (0 à 1)
 * @returns {Promise<string>} URL de données de l'image fortement compressée
 */
export const compressImageBase64 = (imageBase64, maxDim = 150, quality = 0.2) => {
  return new Promise((resolve, reject) => {
    try {
      const img = new Image();
      img.onload = () => {
        // Calculer les dimensions pour respecter les maxima tout en gardant le ratio
        let width = img.width;
        let height = img.height;
        
        if (width > height) {
          height = (height * maxDim) / width;
          width = maxDim;
        } else {
          width = (width * maxDim) / height;
          height = maxDim;
        }
        
        // Créer un canvas et dessiner l'image redimensionnée
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        
        // Convertir en Base64 avec forte compression
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        
        resolve(dataUrl);
      };
      img.onerror = () => {
        reject(new Error("Erreur lors du chargement de l'image Base64"));
      };
      img.src = imageBase64;
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Compresse au maximum une image Base64 pour les cas extrêmes
 * @param {string} imageBase64 - Image en Base64 à compresser au maximum
 * @returns {Promise<string>} URL de données de l'image compressée au maximum
 */
export const compressImageToMinimum = (imageBase64) => {
  return new Promise((resolve, reject) => {
    try {
      const img = new Image();
      img.onload = () => {
        // Dimensions très réduites
        const maxDim = 100;
        let width = img.width;
        let height = img.height;
        
        if (width > height) {
          height = (height * maxDim) / width;
          width = maxDim;
        } else {
          width = (width * maxDim) / height;
          height = maxDim;
        }
        
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        
        // Qualité ultra minimale
        const dataUrl = canvas.toDataURL('image/jpeg', 0.05); // Qualité 5% 
        
        resolve(dataUrl);
      };
      img.onerror = () => {
        reject(new Error("Erreur lors du chargement de l'image Base64"));
      };
      img.src = imageBase64;
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Vérifie si une chaîne Base64 est trop grande et la compresse si nécessaire
 * @param {string} base64String - Chaîne Base64 à vérifier et compresser
 * @param {number} maxLength - Longueur maximale de la chaîne
 * @returns {Promise<string|null>} Chaîne compressée ou null si impossible
 */
export const ensureBase64Size = async (base64String, maxLength = 500000) => {
  if (!base64String) return null;
  
  console.log('Vérification de la taille de l\'image:', Math.round(base64String.length / 1024), 'KB, max:', Math.round(maxLength / 1024), 'KB');
  
  // Si la taille est acceptable, retourner tel quel
  if (base64String.length <= maxLength) {
    console.log('Image déjà en dessous de la limite de taille');
    return base64String;
  }
  
  try {
    // Première tentative : compression forte
    console.log('Première compression à 150x150, qualité 20%');
    let compressed = await compressImageBase64(base64String, 150, 0.2);
    console.log('Après première compression:', Math.round(compressed.length / 1024), 'KB');
    
    // Si toujours trop grand, compression maximale
    if (compressed.length > maxLength) {
      console.log('Compression maximale nécessaire');
      compressed = await compressImageToMinimum(base64String);
      console.log('Après compression maximale:', Math.round(compressed.length / 1024), 'KB');
    }
    
    // Si toujours trop grand, abandonner
    if (compressed.length > maxLength) {
      console.warn("Image trop volumineuse même après compression maximale");
      return null;
    }
    
    return compressed;
  } catch (error) {
    console.error("Erreur lors de la compression de l'image:", error);
    return null;
  }
};
