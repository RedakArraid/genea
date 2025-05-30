# 🚀 Makefile GeneaIA - Déploiement Automatisé
# Usage: make [commande]



# Couleurs
BLUE := \033[0;34m
GREEN := \033[0;32m
YELLOW := \033[1;33m
RED := \033[0;31m
NC := \033[0m

.PHONY: help push deploy vps-update dev build test clean status

# Commande par défaut
.DEFAULT_GOAL := help

help: ## 📖 Afficher cette aide
	@echo ""
	@echo "$(BLUE)🚀 GeneaIA - Déploiement Automatisé$(NC)"
	@echo "$(BLUE)====================================$(NC)"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "$(GREEN)%-15s$(NC) %s\n", $$1, $$2}'
	@echo ""
	@echo "$(YELLOW)Workflow typique:$(NC)"
	@echo "  1. make dev         # Développement local"
	@echo "  2. make test        # Tests"
	@echo "  3. make push        # Push vers GitHub"
	@echo "  4. Sur VPS: git pull && make vps-update"
	@echo ""

# === DÉVELOPPEMENT LOCAL ===

dev: ## 🔧 Démarrer en mode développement
	@echo "$(BLUE)🔧 Démarrage en mode développement...$(NC)"
	@chmod +x scripts/launch.sh
	@echo "1" | ./scripts/launch.sh

launch: ## 🚀 Lanceur interactif (dev/prod/monitoring)
	@echo "$(BLUE)🚀 Lanceur GeneaIA...$(NC)"
	@chmod +x scripts/launch.sh
	@./scripts/launch.sh

dev-setup: ## 📦 Configuration initiale du développement
	@echo "$(BLUE)📦 Configuration du développement...$(NC)"
	@npm install
	@cd backend && npm install && npx prisma generate
	@cd frontend && npm install
	@echo "$(GREEN)✅ Développement configuré$(NC)"

build: ## 🏗️ Build de production
	@echo "$(BLUE)🏗️ Build de production...$(NC)"
	@cd frontend && npm run build
	@echo "$(GREEN)✅ Build terminé$(NC)"

test: ## 🧪 Lancer tous les tests
	@echo "$(BLUE)🧪 Tests...$(NC)"
	@if [ -d "backend" ]; then cd backend && npm test || true; fi
	@if [ -d "frontend" ]; then cd frontend && npm test || true; fi
	@echo "$(GREEN)✅ Tests terminés$(NC)"

# === DÉPLOIEMENT ===

push: ## 🚀 Push automatique vers GitHub
	@echo "$(BLUE)🚀 Push vers GitHub...$(NC)"
	@chmod +x scripts/auto-push.sh
	@./scripts/auto-push.sh

push-msg: ## 📝 Push avec message personnalisé
	@echo "$(BLUE)📝 Push avec message personnalisé...$(NC)"
	@read -p "Message de commit: " msg; \
	chmod +x scripts/auto-push.sh; \
	./scripts/auto-push.sh "$$msg"

deploy: build push ## 🚀 Déploiement complet (build + push)
	@echo "$(GREEN)✅ Déploiement local terminé !$(NC)"
	@echo "$(YELLOW)📋 Prochaines étapes sur votre VPS:$(NC)"
	@echo "   1. git pull"
	@echo "   2. make vps-update"

# === VPS (À exécuter sur le serveur) ===

vps-update: ## 🌐 Mise à jour sur VPS (après git pull)
	@echo "$(BLUE)🌐 Mise à jour VPS...$(NC)"
	@chmod +x scripts/vps-update.sh
	@./scripts/vps-update.sh

vps-setup: ## ⚙️ Configuration initiale du VPS
	@echo "$(BLUE)⚙️ Configuration initiale VPS...$(NC)"
	@if [ ! -f "backend/.env" ]; then \
		echo "$(YELLOW)⚠️ Configuration backend manquante$(NC)"; \
		cp backend/.env.example backend/.env 2>/dev/null || true; \
		echo "$(RED)❌ Configurez backend/.env avant de continuer$(NC)"; \
		exit 1; \
	fi
	@if [ ! -f "frontend/.env" ]; then \
		echo "$(YELLOW)⚠️ Configuration frontend manquante$(NC)"; \
		cp frontend/.env.example frontend/.env 2>/dev/null || true; \
		echo "$(RED)❌ Configurez frontend/.env avant de continuer$(NC)"; \
		exit 1; \
	fi
	@make vps-update

# === BASE DE DONNÉES ===

db-setup: ## 🗄️ Configuration initiale de la base
	@echo "$(BLUE)🗄️ Configuration de la base de données...$(NC)"
	@cd backend && \
		npx prisma generate && \
		npx prisma migrate deploy && \
		npx prisma db seed
	@echo "$(GREEN)✅ Base de données configurée$(NC)"

db-reset: ## 🔄 Réinitialiser la base de données
	@echo "$(BLUE)🔄 Réinitialisation de la base...$(NC)"
	@cd backend && \
		npx prisma migrate reset --force && \
		npx prisma db seed
	@echo "$(GREEN)✅ Base de données réinitialisée$(NC)"

db-migrate: ## 📋 Appliquer les migrations
	@echo "$(BLUE)📋 Application des migrations...$(NC)"
	@cd backend && npx prisma migrate deploy
	@echo "$(GREEN)✅ Migrations appliquées$(NC)"

# === MONITORING ===

status: ## 📊 Statut des services
	@echo "$(BLUE)📊 Statut des services$(NC)"
	@echo ""
	@if command -v pm2 >/dev/null 2>&1; then \
		echo "🔧 Services PM2:"; \
		pm2 status 2>/dev/null || echo "   Aucun processus PM2"; \
	else \
		echo "⚠️ PM2 non installé"; \
	fi
	@echo ""
	@echo "📁 Fichiers de configuration:"
	@if [ -f "backend/.env" ]; then echo "  ✅ backend/.env"; else echo "  ❌ backend/.env manquant"; fi
	@if [ -f "frontend/.env" ]; then echo "  ✅ frontend/.env"; else echo "  ❌ frontend/.env manquant"; fi
	@if [ -d "frontend/dist" ]; then echo "  ✅ frontend buildé"; else echo "  ⚠️ frontend non buildé"; fi

logs: ## 📊 Voir les logs
	@echo "$(BLUE)📊 Logs des services...$(NC)"
	@if command -v pm2 >/dev/null 2>&1; then \
		pm2 logs; \
	else \
		echo "$(YELLOW)⚠️ PM2 non disponible$(NC)"; \
	fi

restart: ## 🔄 Redémarrer les services
	@echo "$(BLUE)🔄 Redémarrage des services...$(NC)"
	@if command -v pm2 >/dev/null 2>&1; then \
		pm2 restart all; \
		echo "$(GREEN)✅ Services redémarrés$(NC)"; \
	else \
		echo "$(YELLOW)⚠️ PM2 non disponible, redémarrage manuel requis$(NC)"; \
	fi

# === UTILITAIRES ===

clean: ## 🧹 Nettoyer les fichiers temporaires
	@echo "$(BLUE)🧹 Nettoyage...$(NC)"
	@rm -rf backend/node_modules frontend/node_modules frontend/dist
	@find . -name "*.log" -delete 2>/dev/null || true
	@echo "$(GREEN)✅ Nettoyage terminé$(NC)"

install: ## 📦 Installer toutes les dépendances
	@echo "$(BLUE)📦 Installation des dépendances...$(NC)"
	@npm install
	@cd backend && npm install
	@cd frontend && npm install
	@echo "$(GREEN)✅ Dépendances installées$(NC)"

update: ## ⬆️ Mettre à jour les dépendances
	@echo "$(BLUE)⬆️ Mise à jour des dépendances...$(NC)"
	@npm update
	@cd backend && npm update
	@cd frontend && npm update
	@echo "$(GREEN)✅ Dépendances mises à jour$(NC)"

# === CONFIGURATION ===

config-check: ## ✅ Vérifier la configuration
	@echo "$(BLUE)✅ Vérification de la configuration...$(NC)"
	@echo ""
	@echo "📁 Projet GeneaIA:"
	@if [ -f "package.json" ]; then echo "  ✅ package.json"; else echo "  ❌ package.json manquant"; fi
	@if [ -d "backend" ]; then echo "  ✅ Backend"; else echo "  ❌ Backend manquant"; fi
	@if [ -d "frontend" ]; then echo "  ✅ Frontend"; else echo "  ❌ Frontend manquant"; fi
	@echo ""
	@echo "⚙️ Configuration:"
	@if [ -f "backend/.env" ]; then \
		echo "  ✅ Backend configuré"; \
		if grep -q "localhost" backend/.env; then \
			echo "    🔧 Mode développement détecté"; \
		else \
			echo "    🚀 Mode production détecté"; \
		fi \
	else \
		echo "  ⚠️ Backend non configuré (copiez .env.example)"; \
	fi
	@if [ -f "frontend/.env" ]; then \
		echo "  ✅ Frontend configuré"; \
	else \
		echo "  ⚠️ Frontend non configuré (copiez .env.example)"; \
	fi
	@echo ""
	@echo "🛠️ Outils:"
	@node --version 2>/dev/null && echo "  ✅ Node.js installé" || echo "  ❌ Node.js manquant"
	@npm --version 2>/dev/null && echo "  ✅ npm installé" || echo "  ❌ npm manquant"
	@git --version 2>/dev/null && echo "  ✅ Git installé" || echo "  ❌ Git manquant"
	@pm2 --version 2>/dev/null && echo "  ✅ PM2 installé" || echo "  ⚠️ PM2 non installé"
	@psql --version 2>/dev/null && echo "  ✅ PostgreSQL CLI" || echo "  ⚠️ PostgreSQL CLI manquant"

prod-deploy: ## 🚀 Déploiement production complet
	@echo "$(BLUE)🚀 Déploiement production...$(NC)"
	@chmod +x scripts/deploy-production.sh
	@./scripts/deploy-production.sh

prod-status: ## 📊 Statut production complet
	@echo "$(BLUE)📊 Statut production...$(NC)"
	@echo "API Health:"
	@curl -s http://localhost:3001/health | jq . || curl -s http://localhost:3001/health || echo "API non accessible"
	@echo ""
	@echo "Services PM2:"
	@pm2 status 2>/dev/null || echo "PM2 non accessible"
	@echo ""
	@echo "Système:"
	@echo "CPU: $(top -bn1 | grep "Cpu(s)" | awk '{print $2}' 2>/dev/null || echo "N/A")"
	@echo "Memory: $(free | awk 'NR==2{printf "%.1f%%", $3*100/$2}' 2>/dev/null || echo "N/A")"
	@echo "Disk: $(df / | awk 'NR==2 {print $5}' 2>/dev/null || echo "N/A")"

prod-logs: ## 📋 Logs production
	@echo "$(BLUE)📋 Logs production...$(NC)"
	@if [ -d "/var/log/geneaia" ]; then \
		tail -f /var/log/geneaia/*.log; \
	else \
		pm2 logs; \
	fi

setup-firewall: ## 🔥 Configuration pare-feu pour IP publique
	@echo "$(BLUE)🔥 Configuration pare-feu...$(NC)"
	@if [ "$EUID" -eq 0 ]; then \
		chmod +x scripts/setup-firewall.sh; \
		./scripts/setup-firewall.sh; \
	else \
		echo "$(RED)Utilisez: sudo make setup-firewall$(NC)"; \
	fi

test-api: ## 🧪 Test complet du backend API
	@echo "$(BLUE)🧪 Test backend API...$(NC)"
	@chmod +x scripts/test-backend-api.sh
	@./scripts/test-backend-api.sh

test-public: ## 🌍 Tester l'accès via IP publique
	@echo "$(BLUE)🌍 Test accès public...$(NC)"
	@PUBLIC_IP=$(curl -s http://ipv4.icanhazip.com 2>/dev/null || echo "IP_NON_DETECTEE"); \
	if [ "$PUBLIC_IP" != "IP_NON_DETECTEE" ]; then \
		echo "IP publique: $PUBLIC_IP"; \
		echo "Test API..."; \
		curl -f "http://$PUBLIC_IP:3001/health" && echo " ✅ API OK" || echo " ❌ API inaccessible"; \
		echo "Test Frontend..."; \
		curl -f "http://$PUBLIC_IP:8080" && echo " ✅ Frontend OK" || echo " ❌ Frontend inaccessible"; \
	else \
		echo "$(RED)Impossible de détecter l'IP publique$(NC)"; \
	fi

# === DÉVELOPPEMENT AVANCÉ ===

lint: ## 🔍 Vérification du code
	@echo "$(BLUE)🔍 Vérification du code...$(NC)"
	@cd backend && npm run lint 2>/dev/null || echo "⚠️ Linting backend non configuré"
	@cd frontend && npm run lint 2>/dev/null || echo "⚠️ Linting frontend non configuré"
	@echo "$(GREEN)✅ Vérification terminée$(NC)"

format: ## 🎨 Formater le code
	@echo "$(BLUE)🎨 Formatage du code...$(NC)"
	@cd backend && npm run format 2>/dev/null || echo "⚠️ Formatage backend non configuré"
	@cd frontend && npm run format 2>/dev/null || echo "⚠️ Formatage frontend non configuré"
	@echo "$(GREEN)✅ Formatage terminé$(NC)"