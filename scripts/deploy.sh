#!/bin/bash

# 🔄 Script de gestion du déploiement GeneaIA
# Usage: ./scripts/deploy.sh [environment] [action]

set -e

# Couleurs pour les logs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Fonctions utilitaires
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Variables
ENVIRONMENT=${1:-"development"}
ACTION=${2:-"deploy"}
PROJECT_ROOT=$(dirname "$(dirname "$(readlink -f "$0")")")

log_info "🚀 Démarrage du déploiement GeneaIA"
log_info "Environment: $ENVIRONMENT"
log_info "Action: $ACTION"

# Vérification des prérequis
check_requirements() {
    log_info "🔍 Vérification des prérequis..."
    
    if ! command -v docker &> /dev/null; then
        log_error "Docker n'est pas installé"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose n'est pas installé"
        exit 1
    fi
    
    log_success "Prérequis OK"
}

# Chargement des variables d'environnement
load_env() {
    local env_file="$PROJECT_ROOT/environments/.env.$ENVIRONMENT"
    
    if [ -f "$env_file" ]; then
        log_info "📁 Chargement de $env_file"
        set -a
        source "$env_file"
        set +a
    else
        log_warning "Fichier d'environnement $env_file non trouvé"
    fi
}

# Déploiement
deploy() {
    log_info "🚀 Déploiement en cours..."
    
    case $ENVIRONMENT in
        "development"|"dev")
            docker-compose -f docker-compose.yml up -d --build
            ;;
        "staging")
            docker-compose -f docker-compose.staging.yml up -d --build
            ;;
        "production"|"prod")
            docker-compose -f docker-compose.prod.yml up -d
            ;;
        *)
            log_error "Environnement non supporté: $ENVIRONMENT"
            exit 1
            ;;
    esac
    
    log_success "Déploiement terminé"
}

# Arrêt des services
stop() {
    log_info "🛑 Arrêt des services..."
    
    case $ENVIRONMENT in
        "development"|"dev")
            docker-compose -f docker-compose.yml down
            ;;
        "staging")
            docker-compose -f docker-compose.staging.yml down
            ;;
        "production"|"prod")
            docker-compose -f docker-compose.prod.yml down
            ;;
    esac
    
    log_success "Services arrêtés"
}

# Logs
logs() {
    log_info "📋 Affichage des logs..."
    
    case $ENVIRONMENT in
        "development"|"dev")
            docker-compose -f docker-compose.yml logs -f
            ;;
        "staging")
            docker-compose -f docker-compose.staging.yml logs -f
            ;;
        "production"|"prod")
            docker-compose -f docker-compose.prod.yml logs -f
            ;;
    esac
}

# Migration de la base de données
migrate() {
    log_info "🗄️ Migration de la base de données..."
    
    case $ENVIRONMENT in
        "development"|"dev")
            docker-compose -f docker-compose.yml exec backend npx prisma migrate deploy
            ;;
        "staging")
            docker-compose -f docker-compose.staging.yml exec backend npx prisma migrate deploy
            ;;
        "production"|"prod")
            docker-compose -f docker-compose.prod.yml exec backend npx prisma migrate deploy
            ;;
    esac
    
    log_success "Migration terminée"
}

# Backup de la base de données
backup() {
    log_info "💾 Sauvegarde de la base de données..."
    
    local backup_file="backup_$(date +%Y%m%d_%H%M%S).sql"
    
    case $ENVIRONMENT in
        "production"|"prod")
            docker-compose -f docker-compose.prod.yml exec postgres pg_dump -U $DB_USER $DB_NAME > "backups/$backup_file"
            ;;
        "staging")
            docker-compose -f docker-compose.staging.yml exec postgres pg_dump -U postgres geneaia_staging > "backups/$backup_file"
            ;;
        *)
            log_warning "Backup non configuré pour l'environnement $ENVIRONMENT"
            ;;
    esac
    
    log_success "Sauvegarde créée: $backup_file"
}

# Restauration de la base de données
restore() {
    local backup_file=$3
    
    if [ -z "$backup_file" ]; then
        log_error "Fichier de sauvegarde requis"
        exit 1
    fi
    
    log_info "🔄 Restauration de la base de données..."
    log_warning "⚠️ Cette opération va écraser les données existantes!"
    
    read -p "Êtes-vous sûr de vouloir continuer? (y/N): " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        case $ENVIRONMENT in
            "production"|"prod")
                docker-compose -f docker-compose.prod.yml exec -T postgres psql -U $DB_USER $DB_NAME < "backups/$backup_file"
                ;;
            "staging")
                docker-compose -f docker-compose.staging.yml exec -T postgres psql -U postgres geneaia_staging < "backups/$backup_file"
                ;;
        esac
        
        log_success "Restauration terminée"
    else
        log_info "Restauration annulée"
    fi
}

# Health check
health() {
    log_info "🏥 Vérification de l'état des services..."
    
    case $ENVIRONMENT in
        "development"|"dev")
            docker-compose -f docker-compose.yml ps
            ;;
        "staging")
            docker-compose -f docker-compose.staging.yml ps
            ;;
        "production"|"prod")
            docker-compose -f docker-compose.prod.yml ps
            ;;
    esac
}

# Mise à jour
update() {
    log_info "🔄 Mise à jour des images..."
    
    case $ENVIRONMENT in
        "development"|"dev")
            docker-compose -f docker-compose.yml pull
            docker-compose -f docker-compose.yml up -d --build
            ;;
        "staging")
            docker-compose -f docker-compose.staging.yml pull
            docker-compose -f docker-compose.staging.yml up -d
            ;;
        "production"|"prod")
            docker-compose -f docker-compose.prod.yml pull
            docker-compose -f docker-compose.prod.yml up -d
            ;;
    esac
    
    log_success "Mise à jour terminée"
}

# Nettoyage
clean() {
    log_info "🧹 Nettoyage des ressources Docker..."
    
    docker system prune -f
    docker volume prune -f
    docker image prune -f
    
    log_success "Nettoyage terminé"
}

# Menu principal
main() {
    check_requirements
    load_env
    
    case $ACTION in
        "deploy")
            deploy
            ;;
        "stop")
            stop
            ;;
        "logs")
            logs
            ;;
        "migrate")
            migrate
            ;;
        "backup")
            backup
            ;;
        "restore")
            restore
            ;;
        "health")
            health
            ;;
        "update")
            update
            ;;
        "clean")
            clean
            ;;
        *)
            log_error "Action non supportée: $ACTION"
            echo "Actions disponibles: deploy, stop, logs, migrate, backup, restore, health, update, clean"
            exit 1
            ;;
    esac
}

# Création du dossier backups s'il n'existe pas
mkdir -p "$PROJECT_ROOT/backups"

# Exécution
main "$@"
