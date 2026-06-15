import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useFamilyTreeStore } from '../store/familyTreeStore';
import { useToast } from '../hooks/useToast';
import { normalizePersons, computeLayout } from '../utils/layoutEngine';

// Import des nouveaux composants
import TreeCanvas from '../components/FamilyTree/TreeCanvas';
import SidePanel from '../components/FamilyTree/SidePanel';
import AddPersonModal from '../components/FamilyTree/AddPersonModal';
import EditPersonModal from '../components/FamilyTree/EditPersonModal';
import ShareModal from '../components/FamilyTree/ShareModal';
import TreeTweaksPanel from '../components/FamilyTree/TreeTweaksPanel';
import AddRelationModal from '../components/FamilyTree/AddRelationModal';

export default function FamilyTreePage() {
  const { id: treeId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();

  // Store
  const {
    currentTree,
    isLoading,
    error,
    fetchTreeById,
    resetState,
    updateNodePositions,
    addPerson,
    updatePerson,
    deletePerson,
    addRelationship,
    deleteRelationship,
    updateTree,
  } = useFamilyTreeStore();

  // États locaux
  const [selectedId, setSelectedId] = useState(null);
  const [hoverId, setHoverId] = useState(null);
  const [positions, setPositions] = useState({});
  const [growKey, setGrowKey] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [lastRelsHash, setLastRelsHash] = useState(null);

  // États d'ouverture des modales/panneaux
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isTweaksOpen, setIsTweaksOpen] = useState(false);
  const [isRelationOpen, setIsRelationOpen] = useState(false);

  // Personne en cours d'édition/liaison
  const [editingPersonData, setEditingPersonData] = useState(null);

  // Données de relation pré-remplies pour l'ajout
  const [addPersonRelData, setAddPersonRelData] = useState({ parentId: null, parent2Id: null, relType: null });

  const handleOpenAddModal = (parentId = null, relType = null, parent2Id = null) => {
    setAddPersonRelData({ parentId, parent2Id, relType });
    setIsAddOpen(true);
  };

  // Tweaks d'affichage par défaut
  const [tweaks, setTweaks] = useState({
    theme: 'light',
    layout: 'vertical',
    density: 'spacious',
    cardStyle: 'square',
    connStyle: 'elbow',
    generation: 'all',
    hideDates: false,
    hidePlaces: false,
    hidePhotos: false,
  });

  // Charger l'arbre au montage
  useEffect(() => {
    if (treeId) {
      fetchTreeById(treeId);
    }
    return () => resetState();
  }, [treeId, fetchTreeById, resetState]);

  // Initialiser les positions à partir des données de l'arbre
  useEffect(() => {
    if (currentTree && currentTree.Person && currentTree.Person.length > 0) {
      const normalizedPeople = normalizePersons(currentTree.Person, currentTree.Relationship);
      
      const dbPositions = {};
      currentTree.NodePosition?.forEach(np => {
        dbPositions[np.nodeId] = { x: np.x, y: np.y };
      });

      // Calculer un hash des relations courantes pour détecter les changements de structure
      const currentRelsHash = (currentTree.Relationship || [])
        .map(r => `${r.id}-${r.type}-${r.sourceId}-${r.targetId}`)
        .sort()
        .join('|');
      
      const relsChanged = lastRelsHash !== null && lastRelsHash !== currentRelsHash;

      // Vérifier si toutes les personnes ont une position enregistrée en DB
      const hasAllPositions = normalizedPeople.every(p => dbPositions[p.id]);

      if (hasAllPositions && Object.keys(dbPositions).length > 0 && !relsChanged) {
        setPositions(dbPositions);
      } else {
        // Sinon (ou si les relations ont changé), calculer une disposition initiale et la sauvegarder
        const { positions: computed } = computeLayout(normalizedPeople, tweaks.layout, tweaks.density);
        setPositions(computed);
        
        const toSave = Object.entries(computed).map(([id, pos]) => ({
          id,
          position: pos,
        }));
        updateNodePositions(toSave);
      }

      setLastRelsHash(currentRelsHash);
    }
  }, [currentTree]);

  // Appliquer le thème à l'élément HTML
  useEffect(() => {
    document.documentElement.dataset.theme = tweaks.theme;
  }, [tweaks.theme]);

  // Gérer la mise au point / sélection depuis l'URL (select=...)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const selectParam = params.get('select');
    if (selectParam && positions[selectParam]) {
      setSelectedId(selectParam);
      // Attendre un peu que le canvas soit prêt pour centrer la vue
      setTimeout(() => {
        if (window.__focusOn) {
          window.__focusOn(selectParam);
        }
      }, 300);
    }
  }, [location.search, positions]);

  // Sauvegarde automatique dédoublée des positions (drag & drop)
  useEffect(() => {
    if (Object.keys(positions).length === 0 || !currentTree) return;

    const handler = setTimeout(() => {
      const dbPositions = {};
      currentTree.NodePosition?.forEach(np => {
        dbPositions[np.nodeId] = { x: np.x, y: np.y };
      });

      let hasChanged = false;
      const toSave = Object.entries(positions).map(([id, pos]) => {
        const dbPos = dbPositions[id];
        if (!dbPos || Math.abs(dbPos.x - pos.x) > 1 || Math.abs(dbPos.y - pos.y) > 1) {
          hasChanged = true;
        }
        return { id, position: pos };
      });

      if (hasChanged) {
        updateNodePositions(toSave);
      }
    }, 1000); // Debounce de 1s

    return () => clearTimeout(handler);
  }, [positions, currentTree, updateNodePositions]);

  // Normaliser les membres de l'arbre
  const people = useMemo(() => {
    if (!currentTree || !currentTree.Person) return [];
    return normalizePersons(currentTree.Person, currentTree.Relationship);
  }, [currentTree]);

  // Trouver la personne sélectionnée
  const selectedPerson = useMemo(() => {
    if (!selectedId || !people) return null;
    return people.find(p => p.id === selectedId);
  }, [selectedId, people]);

  // Mettre à jour un réglage d'affichage (Tweak)
  const handleSetTweak = (key, val) => {
    setTweaks(prev => {
      const next = { ...prev, [key]: val };
      // Si la disposition ou densité change, on recalcule le layout complet
      if (key === 'layout' || key === 'density') {
        const { positions: computed } = computeLayout(people, next.layout, next.density);
        setPositions(computed);
        setGrowKey(Date.now());
        
        const toSave = Object.entries(computed).map(([id, pos]) => ({
          id,
          position: pos,
        }));
        updateNodePositions(toSave);
      }
      return next;
    });
  };

  // Ajouter une personne
  const handleAddPerson = async (formData, relToId, relType, relToId2) => {
    // Calculer une position par défaut décalée
    const position = { x: 300, y: 200 };

    const result = await addPerson(treeId, {
      firstName: formData.firstName,
      lastName: formData.lastName,
      birthDate: formData.birthDate ? new Date(formData.birthDate) : null,
      birthPlace: formData.birthPlace,
      deathDate: formData.deathDate ? new Date(formData.deathDate) : null,
      gender: formData.gender,
      biography: formData.biography,
      photoUrl: formData.photoUrl,
      position
    });

    if (result.success && result.person) {
      if (relToId && relType) {
        await addRelationship({
          sourceId: relType === 'parent' ? result.person.id : relToId,
          targetId: relType === 'parent' ? relToId : result.person.id,
          type: relType === 'spouse' ? 'spouse' : 'parent',
        });
      }
      if (relToId2 && relType === 'child') {
        await addRelationship({
          sourceId: relToId2,
          targetId: result.person.id,
          type: 'parent',
        });
      }
      showToast(`${result.person.firstName} a été ajouté(e) avec succès.`, 'success');
      fetchTreeById(treeId);
      setIsAddOpen(false);
    } else {
      showToast(result.message || "Erreur lors de l'ajout", 'error');
    }
  };

  // Modifier une personne
  const handleEditPerson = (person) => {
    // Trouver l'objet Person brut dans la DB
    const raw = currentTree.Person.find(p => p.id === person.id);
    setEditingPersonData(raw);
    setIsEditOpen(true);
  };

  const handleEditPersonSubmit = async (personId, formData) => {
    const payload = {
      ...formData,
      birthDate: formData.birthDate ? new Date(formData.birthDate) : null,
      deathDate: formData.deathDate ? new Date(formData.deathDate) : null,
    };

    const result = await updatePerson(personId, payload);
    if (result.success) {
      showToast('Informations mises à jour.', 'success');
      fetchTreeById(treeId);
      setIsEditOpen(false);
    } else {
      showToast(result.message || 'Erreur lors de la modification', 'error');
    }
  };

  // Supprimer une personne
  const handleDeletePerson = async (personId) => {
    const person = people.find(p => p.id === personId);
    const name = person ? `${person.given} ${person.sur}` : 'cette personne';
    
    if (window.confirm(`Supprimer définitivement ${name} de l'arbre ? Les relations liées seront également supprimées.`)) {
      const result = await deletePerson(personId);
      if (result.success) {
        showToast('Personne supprimée.', 'success');
        setSelectedId(null);
        fetchTreeById(treeId);
      } else {
        showToast(result.message || 'Erreur lors de la suppression', 'error');
      }
    }
  };

  // Créer une relation entre deux personnes existantes
  const handleAddRelation = (person) => {
    setEditingPersonData(person);
    setIsRelationOpen(true);
  };

  const handleAddRelationSubmit = async (sourceId, targetId, relType, target2Id = null) => {
    // relType: parent, child, spouse
    const source = relType === 'parent' ? sourceId : targetId;
    const target = relType === 'parent' ? targetId : sourceId;
    const type = relType === 'spouse' ? 'spouse' : 'parent';

    const response = await addRelationship({
      sourceId: source,
      targetId: target,
      type: type,
    });

    if (response.success) {
      if (target2Id && relType === 'child') {
        await addRelationship({
          sourceId: target2Id,
          targetId: sourceId,
          type: 'parent',
        });
      }
      showToast('Lien de parenté créé.', 'success');
      fetchTreeById(treeId);
      setIsRelationOpen(false);
    } else {
      showToast(response.message || 'Erreur lors de la création de la relation', 'error');
    }
  };

  // Animer l'arbre
  const triggerGrow = useCallback(() => {
    setGrowKey(Date.now());
    setTimeout(() => setGrowKey(null), 2400);
  }, []);

  // Exposer l'animation au niveau global pour que le SideNav puisse le déclencher
  useEffect(() => {
    window.__triggerGrow = triggerGrow;
    return () => {
      window.__triggerGrow = null;
    };
  }, [triggerGrow]);

  if (isLoading) {
    return (
      <div style={{ display: 'grid', placeItems: 'center', height: '80vh' }}>
        <div className="spinner"></div>
        <p style={{ marginTop: '12px', color: 'var(--text-3)' }}>Chargement de l'arbre généalogique...</p>
      </div>
    );
  }

  if (error || !currentTree) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <h2>Une erreur s'est produite</h2>
        <p>{error || "Arbre introuvable."}</p>
        <button className="btn primary" onClick={() => navigate('/dashboard')}>Retour au tableau de bord</button>
      </div>
    );
  }

  const handleDeleteRelation = async (relId) => {
    if (window.confirm("Supprimer ce lien de parenté ?")) {
      const res = await deleteRelationship(relId);
      if (res.success) {
        showToast("Lien de parenté supprimé.", "success");
        fetchTreeById(treeId);
      } else {
        showToast(res.message || "Erreur lors de la suppression du lien", "error");
      }
    }
  };

  return (
    <div style={{ display: 'flex', width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }}>
      
      {/* Canvas central */}
      <TreeCanvas
        people={people}
        tweaks={tweaks}
        positions={positions}
        setPositions={setPositions}
        selectedId={selectedId}
        onSelect={(id) => setSelectedId(prev => prev === id ? null : id)}
        hoverId={hoverId}
        onHover={setHoverId}
        growKey={growKey}
        onOpenAdd={handleOpenAddModal}
        onOpenShare={() => setIsShareOpen(true)}
        onOpenTweaks={() => setIsTweaksOpen(!isTweaksOpen)}
        onSetTweak={handleSetTweak}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      {/* Panneau latéral de détails */}
      {selectedPerson && (
        <SidePanel
          person={selectedPerson}
          people={people}
          currentTree={currentTree}
          onClose={() => setSelectedId(null)}
          onSelect={(id) => {
            setSelectedId(id);
            if (window.__focusOn) window.__focusOn(id);
          }}
          onEdit={handleEditPerson}
          onAddRelation={handleAddRelation}
          onAddChildRelation={(parentId, relType, parent2Id) => handleOpenAddModal(parentId, relType, parent2Id)}
          onDelete={handleDeletePerson}
          onDeleteRelation={handleDeleteRelation}
        />
      )}

      {/* Modal Ajout Personne */}
      <AddPersonModal
        isOpen={isAddOpen}
        onClose={() => {
          setIsAddOpen(false);
          setAddPersonRelData({ parentId: null, parent2Id: null, relType: null });
        }}
        onSubmit={handleAddPerson}
        treeName={currentTree.name}
        people={people}
        parentNodeId={addPersonRelData.parentId}
        parentNode2Id={addPersonRelData.parent2Id}
        relationType={addPersonRelData.relType}
      />

      {/* Modal Modification Personne */}
      {isEditOpen && editingPersonData && (
        <EditPersonModal
          isOpen={isEditOpen}
          onClose={() => {
            setIsEditOpen(false);
            setEditingPersonData(null);
          }}
          onSubmit={handleEditPersonSubmit}
          nodeData={editingPersonData}
          nodeId={editingPersonData.id}
          people={people}
          currentTree={currentTree}
          onAddRelationship={handleAddRelationSubmit}
          onDeleteRelationship={handleDeleteRelation}
        />
      )}

      {/* Modal Partager */}
      <ShareModal
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        currentTree={currentTree}
        onUpdateTree={updateTree}
      />

      {/* Panneau latéral de réglages */}
      <TreeTweaksPanel
        isOpen={isTweaksOpen}
        onClose={() => setIsTweaksOpen(false)}
        tweaks={tweaks}
        onSetTweak={handleSetTweak}
      />

      {/* Modal d'ajout de relations entre existants */}
      {isRelationOpen && editingPersonData && (
        <AddRelationModal
          isOpen={isRelationOpen}
          onClose={() => {
            setIsRelationOpen(false);
            setEditingPersonData(null);
          }}
          person={editingPersonData}
          people={people}
          onSubmit={handleAddRelationSubmit}
        />
      )}
    </div>
  );
}