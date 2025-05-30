import { create } from 'zustand';
import api from '../services/api';
import { ensureBase64Size } from '../utils/imageCompression';

// Limite pour la taille des chaînes dans PostgreSQL (par sécurité)
const MAX_STRING_LENGTH = 800000;

/**
 * Fonction pour mettre à jour une personne avec gestion optimisée des images
 * Cette fonction est extraite du store pour clarifier le code
 * 
 * @param {string} personId - ID de la personne à mettre à jour
 * @param {Object} personData - Données de la personne
 * @param {Function} set - Fonction de mise à jour du state Zustand
 * @returns {Promise<{success: boolean, message?: string}>}
 */
export const updatePersonWithOptimizedImage = async (personId, personData, set) => {
  set({ isLoading: true, error: null });

  try {
    // Créer une copie pour éviter de modifier l'original
    let optimizedPersonData = { ...personData };
    
    // Si la photo existe, s'assurer qu'elle n'est pas trop volumineuse
    if (optimizedPersonData.photoUrl) {
      // Vérifier la taille totale des données
      const dataSize = JSON.stringify(optimizedPersonData).length;
      const photoSize = optimizedPersonData.photoUrl.length;
      
      console.log(`Taille des données: ${(dataSize/(1024*1024)).toFixed(2)} MB, Photo: ${(photoSize/(1024*1024)).toFixed(2)} MB`);
      
      // Optimiser la photo si nécessaire
      if (photoSize > MAX_STRING_LENGTH) {
        console.log("Photo trop volumineuse, compression en cours...");
        optimizedPersonData.photoUrl = await ensureBase64Size(optimizedPersonData.photoUrl, MAX_STRING_LENGTH);
        
        // Si l'optimisation a échoué, supprimer la photo
        if (!optimizedPersonData.photoUrl) {
          console.warn("Impossible de compresser suffisamment la photo, suppression");
          delete optimizedPersonData.photoUrl;
        }
      }
    }
    
    // Envoi de la requête
    try {
      const response = await api.put(`/persons/${personId}`, optimizedPersonData);
      const updatedPerson = response.data.person;
      
      // Mise à jour de l'état
      set(state => ({ 
        nodes: state.nodes.map(node => 
          node.id === personId 
            ? { 
                ...node, 
                data: { 
                  ...node.data, 
                  ...updatedPerson,
                  label: `${updatedPerson.firstName} ${updatedPerson.lastName}`
                } 
              } 
            : node
        ),
        isLoading: false 
      }));
      
      return { 
        success: true,
        message: optimizedPersonData.photoUrl !== personData.photoUrl && optimizedPersonData.photoUrl
          ? "Personne mise à jour avec photo compressée"
          : !optimizedPersonData.photoUrl && personData.photoUrl
            ? "Personne mise à jour sans photo (photo trop volumineuse)"
            : "Personne mise à jour avec succès"
      };
    } catch (error) {
      console.error("Erreur lors de la mise à jour:", error);
      
      // En cas d'échec et si c'était dû à la photo, essayer sans photo
      if (error.response?.status === 400 && optimizedPersonData.photoUrl) {
        console.warn("Tentative de mise à jour sans photo...");
        const dataWithoutPhoto = { ...optimizedPersonData };
        delete dataWithoutPhoto.photoUrl;
        
        try {
          const retryResponse = await api.put(`/persons/${personId}`, dataWithoutPhoto);
          const updatedPerson = retryResponse.data.person;
          
          // Mise à jour de l'état
          set(state => ({ 
            nodes: state.nodes.map(node => 
              node.id === personId 
                ? { 
                    ...node, 
                    data: { 
                      ...node.data, 
                      ...updatedPerson,
                      label: `${updatedPerson.firstName} ${updatedPerson.lastName}`
                    } 
                  } 
                : node
            ),
            isLoading: false 
          }));
          
          return { 
            success: true, 
            message: "Personne mise à jour sans photo (la photo posait problème)" 
          };
        } catch (retryError) {
          throw retryError;
        }
      }
      
      throw error;
    }
  } catch (error) {
    console.error("Erreur globale:", error);
    set({ 
      error: error.response?.data?.message || "Erreur lors de la mise à jour de la personne", 
      isLoading: false 
    });
    return { 
      success: false, 
      message: error.response?.data?.message || "Erreur lors de la mise à jour" 
    };
  }
};

/**
 * Extrait de familyTreeStore.js contenant seulement la fonction updatePerson
 * A intégrer dans le store complet
 */
export const updatePersonFunction = {
  // Fonction simplifiée qui utilise l'utilitaire ci-dessus
  updatePerson: async (personId, personData) => {
    return await updatePersonWithOptimizedImage(personId, personData, set);
  }
};
